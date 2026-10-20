
const SAMPLE_INTERVAL_MS = 1000;

export function startVideoMetrics(videoElement) {
  if (
    !videoElement ||
    !videoElement.srcObject ||
    videoElement.readyState < 2
  ) {
    return {
      available: false,
      reason: "Video stream is not ready",
      stop: () => ({
        available: false,
        reason: "Video stream is not ready",
      }),
    };
  }

  const videoTrack = videoElement.srcObject
    .getVideoTracks()
    .find((track) => track.enabled && track.readyState === "live");

  if (!videoTrack) {
    return {
      available: false,
      reason: "No active camera track",
      stop: () => ({
        available: false,
        reason: "No active camera track",
      }),
    };
  }

  let intervalId;
  let stopped = false;

  const metrics = {
    available: true,
    samples: 0,
    visibleSamples: 0,
    visibilityRatio: null,
  };

  const sample = () => {
    if (stopped) return;

    if (
      videoElement.readyState >= 2 &&
      videoElement.videoWidth > 0 &&
      videoElement.videoHeight > 0
    ) {
      metrics.samples += 1;
      metrics.visibleSamples += 1;
    }
  };

  sample();
  intervalId = window.setInterval(sample, SAMPLE_INTERVAL_MS);

  const stop = () => {
    if (!stopped) {
      stopped = true;
      window.clearInterval(intervalId);
    }

    return {
      ...metrics,
      visibilityRatio: metrics.samples
        ? Number(
            (metrics.visibleSamples / metrics.samples).toFixed(3)
          )
        : null,
    };
  };

  return { available: true, stop };
}
