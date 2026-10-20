
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

const SAMPLE_INTERVAL_MS = 1000;

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;

function getFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    })().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }

  return landmarkerPromise;
}

function unavailable(reason) {
  return {
    available: false,
    reason,
    stop: () => ({
      available: false,
      reason,
    }),
  };
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function estimateHeadOrientation(landmarks) {
  const nose = landmarks[1];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const leftFace = landmarks[234];
  const rightFace = landmarks[454];

  if (
    !nose ||
    !forehead ||
    !chin ||
    !leftEye ||
    !rightEye ||
    !leftFace ||
    !rightFace
  ) {
    return null;
  }

  const eyeDistance = Math.hypot(
    rightEye.x - leftEye.x,
    rightEye.y - leftEye.y
  );

  const faceWidth = Math.hypot(
    rightFace.x - leftFace.x,
    rightFace.y - leftFace.y
  );

  if (eyeDistance < 0.001 || faceWidth < 0.001) {
    return null;
  }

  // These are approximate 2D landmark-based indicators,
  // not calibrated anatomical head angles.
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const faceMidX = (leftFace.x + rightFace.x) / 2;
  const faceMidY = (leftFace.y + rightFace.y) / 2;

  const yawIndicator = (nose.x - faceMidX) / faceWidth;
  const verticalFaceSpan = chin.y - forehead.y;
  const noseVerticalPosition =
    (nose.y - eyeMidY) / Math.max(verticalFaceSpan, 0.001);

  const rollRadians = Math.atan2(
    rightEye.y - leftEye.y,
    rightEye.x - leftEye.x
  );

  return {
    yawIndicator: round(yawIndicator, 3),
    pitchIndicator: round(noseVerticalPosition, 3),
    rollDegrees: round((rollRadians * 180) / Math.PI, 1),
  };
}

export function startVideoMetrics(videoElement) {
  if (
    !videoElement ||
    !videoElement.srcObject ||
    videoElement.readyState < 2
  ) {
    return unavailable("Video stream is not ready");
  }

  const videoTrack = videoElement.srcObject
    .getVideoTracks()
    .find(
      (track) =>
        track.enabled && track.readyState === "live"
    );

  if (!videoTrack) {
    return unavailable("No active camera track");
  }

  let stopped = false;
  let intervalId = null;
  let landmarker = null;
  let processing = false;
  let lastVideoTime = -1;
  let initializationError = null;

  const orientationSamples = [];

  const metrics = {
    available: true,
    status: "initializing",
    samples: 0,
    visibleSamples: 0,
    visibilityRatio: null,
    faceDetectionRate: null,
    headOrientationSamples: 0,
    averageAbsoluteYawIndicator: null,
    averageAbsolutePitchIndicator: null,
    averageAbsoluteRollDegrees: null,
    headMovementSamples: 0,
    averageHeadMovement: null,
    maximumHeadMovement: null,
    durationMs: 0,
  };

  const startedAt = performance.now();
  let previousOrientation = null;
  let movementTotal = 0;
  let maximumMovement = 0;
  let movementSamples = 0;

  async function initialize() {
    try {
      landmarker = await getFaceLandmarker();

      if (stopped) return;

      metrics.status = "running";
      sample();
      intervalId = window.setInterval(
        sample,
        SAMPLE_INTERVAL_MS
      );
    } catch (error) {
      initializationError =
        error?.message || "Could not initialize face analysis";

      metrics.available = false;
      metrics.status = "unavailable";
      metrics.reason = initializationError;
    }
  }

  function sample() {
    if (
      stopped ||
      processing ||
      !landmarker ||
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0 ||
      videoTrack.readyState !== "live" ||
      !videoTrack.enabled
    ) {
      return;
    }

    if (videoElement.currentTime === lastVideoTime) {
      return;
    }

    processing = true;

    try {
      lastVideoTime = videoElement.currentTime;

      const result = landmarker.detectForVideo(
        videoElement,
        performance.now()
      );

      metrics.samples += 1;

      const landmarks = result.faceLandmarks?.[0];

      if (!landmarks || landmarks.length === 0) {
        previousOrientation = null;
        return;
      }

      metrics.visibleSamples += 1;

      const orientation = estimateHeadOrientation(landmarks);

      if (!orientation) {
        previousOrientation = null;
        return;
      }

      orientationSamples.push(orientation);

      if (previousOrientation) {
        const movement = Math.sqrt(
          (orientation.yawIndicator -
            previousOrientation.yawIndicator) ** 2 +
            (orientation.pitchIndicator -
              previousOrientation.pitchIndicator) ** 2 +
            ((orientation.rollDegrees -
              previousOrientation.rollDegrees) /
              90) ** 2
        );

        movementTotal += movement;
        maximumMovement = Math.max(maximumMovement, movement);
        movementSamples += 1;
      }

      previousOrientation = orientation;
    } catch (error) {
      console.warn("Face analysis sample failed:", error);
    } finally {
      processing = false;
    }
  }

  function stop() {
    if (!stopped) {
      stopped = true;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    }

    const count = orientationSamples.length;

    const average = (key) =>
      count
        ? round(
            orientationSamples.reduce(
              (sum, item) => sum + Math.abs(item[key]),
              0
            ) / count
          )
        : null;

    metrics.durationMs = round(
      performance.now() - startedAt,
      0
    );

    metrics.visibilityRatio = metrics.samples
      ? round(metrics.visibleSamples / metrics.samples, 3)
      : null;

    metrics.faceDetectionRate = metrics.visibilityRatio;
    metrics.headOrientationSamples = count;
    metrics.averageAbsoluteYawIndicator = average("yawIndicator");
    metrics.averageAbsolutePitchIndicator = average("pitchIndicator");
    metrics.averageAbsoluteRollDegrees = average("rollDegrees");
    metrics.headMovementSamples = movementSamples;
    metrics.averageHeadMovement = movementSamples
      ? round(movementTotal / movementSamples, 4)
      : null;
    metrics.maximumHeadMovement = movementSamples
      ? round(maximumMovement, 4)
      : null;

    if (initializationError) {
      metrics.available = false;
      metrics.status = "unavailable";
      metrics.reason = initializationError;
    } else if (metrics.status === "initializing") {
      metrics.status = "stopped_before_initialization";
    } else {
      metrics.status = "completed";
    }

    return { ...metrics };
  }

  void initialize();

  return {
    available: true,
    stop,
  };
}
