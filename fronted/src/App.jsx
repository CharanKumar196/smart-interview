import { useEffect, useRef, useState } from "react";
import { signInAuthorizedUser, signOutUser } from "./lib/authFlows";
import { getAuthorizedProfile } from "./lib/authorizedApi";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { getInterviewQuestions } from "./data/interviewQuestions";
import VoiceToText from "./components/VoiceToText";
import { evaluateInterview } from "./services/interview-analysis/evaluationService";
import { startAudioMetrics } from "./services/interview-analysis/audioMetrics";
import { startVideoMetrics } from "./services/interview-analysis/videoMetrics";

function mergeAudioMetricResults(previous, next) {
  if (!next) return previous;
  if (!next.available) return previous || next;
  if (!previous?.available) return next;

  const previousSamples = Number(previous.samples) || 0;
  const nextSamples = Number(next.samples) || 0;
  const totalSamples = previousSamples + nextSamples;
  const previousRms = Number(previous.averageRms) || 0;
  const nextRms = Number(next.averageRms) || 0;

  const voicedMs = (Number(previous.voicedMs) || 0) + (Number(next.voicedMs) || 0);
  const silenceMs = (Number(previous.silenceMs) || 0) + (Number(next.silenceMs) || 0);
  const longestPauseMs = Math.max(Number(previous.longestPauseMs) || 0, Number(next.longestPauseMs) || 0);
  const durationMs = (Number(previous.durationMs) || 0) + (Number(next.durationMs) || 0);

  return {
    available: true,
    voicedMs,
    silenceMs,
    pauseCount: (Number(previous.pauseCount) || 0) + (Number(next.pauseCount) || 0),
    longestPauseMs,
    samples: totalSamples,
    averageRms: totalSamples
      ? Number(((previousRms * previousSamples + nextRms * nextSamples) / totalSamples).toFixed(4))
      : 0,
    durationMs,
    voicedSeconds: Number((voicedMs / 1000).toFixed(1)),
    silenceSeconds: Number((silenceMs / 1000).toFixed(1)),
    longestPauseSeconds: Number((longestPauseMs / 1000).toFixed(1)),
  };
}

function mergeVideoMetricResults(previous, next) {
  if (!next) return previous;
  if (!next.available) return previous || next;
  if (!previous?.available) return next;

  const samples = (Number(previous.samples) || 0) + (Number(next.samples) || 0);
  const visibleSamples = (Number(previous.visibleSamples) || 0) + (Number(next.visibleSamples) || 0);

  return {
    available: true,
    samples,
    visibleSamples,
    visibilityRatio: samples ? Number((visibleSamples / samples).toFixed(3)) : null,
  };
}

function App() {
  const [page, setPage] = useState("login");
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerEmail, setRegisterEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const stopSpeechRef = useRef(null);

  const [currentInterviewId, setCurrentInterviewId] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);
  const speechBaseAnswerRef = useRef("");
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistoryInterview, setSelectedHistoryInterview] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationResult, setEvaluationResult] = useState(null);



  
const completedInterviews = interviewHistory.filter(
  (interview) => String(interview.status || "").toLowerCase() === "completed"
);

const evaluatedInterviews = completedInterviews.filter(
  (interview) =>
    interview.overall_score != null &&
    interview.ai_feedback &&
    Object.keys(interview.ai_feedback).length > 0
);

const averageScore =
  evaluatedInterviews.length > 0
    ? Math.round(
        evaluatedInterviews.reduce(
          (total, interview) =>
            total + Number(interview.overall_score),
          0
        ) / evaluatedInterviews.length
      )
    : null;

const averageMetric = (key) => {
  const values = evaluatedInterviews
    .map((interview) => {
      const scores = interview.scores || {};
      const matchingKey = Object.keys(scores).find(
        (item) => item.toLowerCase() === key.toLowerCase()
      );
      return matchingKey ? Number(scores[matchingKey]) : null;
    })
    .filter((score) => score !== null && Number.isFinite(score));

  return values.length
    ? Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
    : null;
};

const averageCommunication = averageMetric("communication");
const averageTechnical = averageMetric("technicalAccuracy");

  const [user, setUser] = useState({
    name: "Student",
    email: "student@example.com",
  });

  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState("10");
  const [interviewRole, setInterviewRole] = useState("Frontend Developer");

  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [speechGracePeriod, setSpeechGracePeriod] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const [cameraError, setCameraError] = useState("");
  const [micError, setMicError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [micLoading, setMicLoading] = useState(false);

const videoRef = useRef(null);
const streamRef = useRef(null);
const finishingInterviewRef = useRef(false);
const timerFinishStartedRef = useRef(false);

const audioMetricsStopRef = useRef(null);
const videoMetricsStopRef = useRef(null);
const audioMetricsResultRef = useRef(null);
const videoMetricsResultRef = useRef(null);

  const questions = getInterviewQuestions(
    interviewType,
    interviewRole,
    difficulty
  );

 
  // Load interview history whenever the Dashboard or History page is opened.
  useEffect(() => {
    if (
      (page === "dashboard" || page === "history") &&
      authSession
    ) {
      void loadInterviewHistory();
    }
  }, [page, authSession]);


  // ---------------- AUTH SESSION ----------------
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    let active = true;

    const authorizeSession = async (session) => {
      if (!session) {
        if (active) {
          setAuthSession(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const profile = await getAuthorizedProfile(session.access_token);

        if (!active) return;

        setAuthSession(session);
        setUser({
          name:
            profile.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Student",
          email: profile.email || session.user.email || "",
        });

        setPage("dashboard");
        setAuthError("");
      } catch (error) {
        await supabase.auth.signOut();

        if (!active) return;

        setAuthSession(null);
        setPage("login");
        setAuthError(
          error.status === 403
            ? "This account is not authorized to access Smart Interview. Contact the project administrator."
            : error.message || "Could not validate account access."
        );
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      void authorizeSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthSession(null);
        setPage("login");
        setAuthLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        void authorizeSession(session);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------------- FORMAT TIME ----------------
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  // ---------------- LOGIN / REGISTER ----------------
  const authRequest = async (path, payload) => {
    const apiBase = import.meta.env.VITE_API_URL || "";
    let response;

    try {
      response = await fetch(`${apiBase}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        "Cannot reach the email verification server. Start the backend and set VITE_API_URL if it runs on another address."
      );
    }

    if (
      !response.headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      throw new Error(
        "The email verification API is not available. The backend must provide POST /api/auth/send-otp."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.message || "Something went wrong. Please try again."
      );
      error.status = response.status;
      throw error;
    }

    return data;
  };

  const beginRegistration = async (e) => {
    e.preventDefault();

    const email = e.currentTarget.email.value.trim();

    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);

    try {
      await authRequest("send-otp", { email });

      setRegisterEmail(email);
      setRegisterStep(2);
      setAuthNotice(
        "Verification code sent. Check your inbox and spam folder."
      );
    } catch (error) {
      if (error.status === 429) {
        setRegisterEmail(email);
        setRegisterStep(2);
        setAuthNotice(
          "A code was sent recently. Use the latest code in your inbox."
        );
      } else {
        setAuthError(
          error.message || "Could not send the verification code."
        );
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const resendRegistrationOtp = async () => {
    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);

    try {
      await authRequest("send-otp", { email: registerEmail });

      setAuthNotice(
        "A new verification code was sent. Check your inbox and spam folder."
      );
    } catch (error) {
      if (error.status === 429) {
        setAuthNotice(error.message);
      } else {
        setAuthError(
          error.message || "Could not resend the verification code."
        );
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const verifyRegistrationOtp = async (e) => {
    e.preventDefault();

    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);

    try {
      const otp = e.currentTarget.otp.value.trim();

      await authRequest("verify-otp", {
        email: registerEmail,
        otp,
      });

      setRegisterStep(3);
    } catch (error) {
      setAuthError(error.message || "That code could not be verified.");
    } finally {
      setAuthBusy(false);
    }
  };

  const createRegisteredAccount = async (e) => {
    e.preventDefault();

    setAuthError("");

    const name = e.currentTarget.name.value.trim();
    const password = e.currentTarget.password.value;
    const confirmPassword = e.currentTarget.confirmPassword.value;

    if (!name) {
      setAuthError("Enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Use a password with at least 8 characters.");
      return;
    }

    setAuthBusy(true);

    try {
      await authRequest("register", {
        name,
        email: registerEmail,
        password,
      });

      setUser({ name, email: registerEmail });
      setIsRegister(false);
      setRegisterStep(1);
      setAuthError("");
      setAuthNotice("");

      alert(
        "Your account was created and authorized. You can now log in with your email and password."
      );
    } catch (error) {
      setAuthError(error.message || "Could not create your account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    const email = e.currentTarget.email.value.trim().toLowerCase();
    const password = e.currentTarget.password.value;

    setAuthError("");
    setAuthBusy(true);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the project-root .env, then restart Vite."
        );
      }

      const {
        session,
        user: signedInUser,
        profile,
      } = await signInAuthorizedUser(supabase, email, password);

      setAuthSession(session);
      setUser({
        name:
          profile.full_name ||
          signedInUser.user_metadata?.full_name ||
          email.split("@")[0],
        email: profile.email || signedInUser.email || email,
      });

      setPage("dashboard");
    } catch (error) {
      setAuthError(
        error.status === 403
          ? "This account is not authorized to access Smart Interview."
          : error.message ||
              "Could not sign in. Check your email address and password."
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const openRegistration = () => {
    setIsRegister(true);
    setRegisterStep(1);
    setRegisterEmail("");
    setAuthError("");
  };

  const backToLogin = () => {
    setIsRegister(false);
    setRegisterStep(1);
    setAuthError("");
    setAuthNotice("");
  };

  
  // ---------------- CAMERA ----------------
  const startCamera = async () => {
    if (cameraLoading) return;

    setCameraLoading(true);
    setCameraError("");

    try {
      const currentStream = streamRef.current;
      const existingVideoTrack = currentStream?.getVideoTracks()[0];

      if (existingVideoTrack && existingVideoTrack.readyState === "live") {
        existingVideoTrack.enabled = true;
        setCameraOn(true);
        setCameraError("");
        // The preview effect starts video analysis when the video element is ready.
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is unavailable. Use HTTPS or localhost and a supported browser."
        );
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const videoTrack = videoStream.getVideoTracks()[0];

      if (!videoTrack) {
        videoStream.getTracks().forEach((track) => track.stop());
        throw new Error("No camera was found.");
      }

      let combinedStream = streamRef.current;

      if (!combinedStream) {
        combinedStream = new MediaStream();
        streamRef.current = combinedStream;
      }

      combinedStream.addTrack(videoTrack);
      // Wait for the video preview to become ready before analyzing it.

      // The temporary stream is no longer needed.
      // Only its video track was added to the shared stream.
      setCameraOn(true);
      setCameraError("");
    } catch (error) {
      console.error("Camera access error:", error);

      const message =
        error.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings."
          : error.name === "NotFoundError"
            ? "No camera was found on this device."
            : error.name === "NotReadableError"
              ? "The camera may be in use by another application."
              : error.message || "Could not start the camera.";

      setCameraError(message);
      setCameraOn(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // ---------------- MICROPHONE ----------------
  const startMicrophone = async () => {
    if (micLoading) return;

    setMicLoading(true);
    setMicError("");

    try {
      const currentStream = streamRef.current;
      const existingAudioTrack = currentStream?.getAudioTracks()[0];

      if (existingAudioTrack && existingAudioTrack.readyState === "live") {
        existingAudioTrack.enabled = true;

        if (!audioMetricsStopRef.current) {
          const analysis = startAudioMetrics(currentStream);
          audioMetricsStopRef.current = analysis.available ? analysis.stop : null;

          if (!analysis.available) {
            audioMetricsResultRef.current = mergeAudioMetricResults(
              audioMetricsResultRef.current,
              analysis.stop()
            );
            console.warn("Audio analysis unavailable:", analysis.reason);
          }
        }

        setMicOn(true);
        setMicError("");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access is unavailable in this browser context."
        );
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const audioTrack = audioStream.getAudioTracks()[0];

      if (!audioTrack) {
        audioStream.getTracks().forEach((track) => track.stop());
        throw new Error("No microphone was found.");
      }

      let combinedStream = streamRef.current;

      if (!combinedStream) {
        combinedStream = new MediaStream();
        streamRef.current = combinedStream;
      }

      combinedStream.addTrack(audioTrack);

      // Close any stale analyzer before starting a new microphone session.
      if (audioMetricsStopRef.current) {
        audioMetricsResultRef.current = mergeAudioMetricResults(
          audioMetricsResultRef.current,
          audioMetricsStopRef.current()
        );
        audioMetricsStopRef.current = null;
      }

      const audioAnalysis = startAudioMetrics(combinedStream);
      audioMetricsStopRef.current = audioAnalysis.available
        ? audioAnalysis.stop
        : null;

      if (!audioAnalysis.available) {
        audioMetricsResultRef.current = mergeAudioMetricResults(
          audioMetricsResultRef.current,
          audioAnalysis.stop()
        );
        console.warn("Audio analysis unavailable:", audioAnalysis.reason);
      }

      setMicOn(true);
      setMicError("");
    } catch (error) {
      console.error("Microphone access error:", error);

      const message =
        error.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser settings."
          : error.name === "NotFoundError"
            ? "No microphone was found on this device."
            : error.name === "NotReadableError"
              ? "The microphone may be in use by another application."
              : error.message || "Could not start the microphone.";

      setMicError(message);
      setMicOn(false);
    } finally {
      setMicLoading(false);
    }
  };

  // ---------------- STOP CAMERA AND MICROPHONE ----------------
  const stopCamera = () => {
    if (audioMetricsStopRef.current) {
      audioMetricsResultRef.current = mergeAudioMetricResults(
        audioMetricsResultRef.current,
        audioMetricsStopRef.current()
      );
      audioMetricsStopRef.current = null;
    }

    if (videoMetricsStopRef.current) {
      videoMetricsResultRef.current = mergeVideoMetricResults(
        videoMetricsResultRef.current,
        videoMetricsStopRef.current()
      );
      videoMetricsStopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
    setCameraError("");
    setMicError("");
  };

  // ---------------- TOGGLE CAMERA ----------------
      
    const toggleCamera = () => {
      const videoTrack = streamRef.current?.getVideoTracks()[0];

      if (videoTrack) {
        if (videoTrack.enabled) {
          // Save the current video metrics before turning the camera off.
          if (videoMetricsStopRef.current) {
            videoMetricsResultRef.current = mergeVideoMetricResults(
              videoMetricsResultRef.current,
              videoMetricsStopRef.current()
            );
            videoMetricsStopRef.current = null;
          }

          videoTrack.enabled = false;
          setCameraOn(false);
        } else {
          videoTrack.enabled = true;
          setCameraOn(true);
          setCameraError("");
        }
      } else {
        void startCamera();
      }
    };


  // ---------------- TOGGLE MICROPHONE ----------------
  
    const toggleMic = () => {
      const audioTrack = streamRef.current?.getAudioTracks()[0];

      if (audioTrack) {
        if (audioTrack.enabled) {
          // Save audio metrics before disabling the microphone.
          if (audioMetricsStopRef.current) {
            audioMetricsResultRef.current = mergeAudioMetricResults(
              audioMetricsResultRef.current,
              audioMetricsStopRef.current()
            );
            audioMetricsStopRef.current = null;
          }

          audioTrack.enabled = false;
          setMicOn(false);
        } else {
          audioTrack.enabled = true;

          // Start a fresh audio analysis session.
          const analysis = startAudioMetrics(streamRef.current);

          audioMetricsStopRef.current = analysis.available
            ? analysis.stop
            : null;

          if (!analysis.available) {
            audioMetricsResultRef.current = mergeAudioMetricResults(
              audioMetricsResultRef.current,
              analysis.stop()
            );
            console.warn("Audio analysis unavailable:", analysis.reason);
          }

          setMicOn(true);
          setMicError("");
        }
      } else {
        void startMicrophone();
      }
    };


  
  // ---------------- CONNECT LIVE CAMERA PREVIEW ----------------
  useEffect(() => {
    const videoElement = videoRef.current;
    const stream = streamRef.current;

    let cancelled = false;

    const connectPreview = async () => {
      if (
        page !== "interview" ||
        !cameraOn ||
        !videoElement ||
        !stream
      ) {
        return;
      }

      videoElement.srcObject = stream;

      try {
        await videoElement.play();

        if (cancelled) return;

        // Stop any previous video analyzer.
        if (videoMetricsStopRef.current) {
          videoMetricsResultRef.current = mergeVideoMetricResults(
            videoMetricsResultRef.current,
            videoMetricsStopRef.current()
          );
          videoMetricsStopRef.current = null;
        }

        // Start video metrics after the preview is ready.
        const analysis = startVideoMetrics(videoElement);

        if (analysis.available) {
          videoMetricsStopRef.current = analysis.stop;
        } else {
          videoMetricsResultRef.current = mergeVideoMetricResults(
            videoMetricsResultRef.current,
            analysis.stop()
          );
          console.warn("Video analysis unavailable:", analysis.reason);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Camera preview playback error:", error);
          setCameraError(
            "The camera is active, but the preview could not start."
          );
        }
      }
    };

    void connectPreview();

    return () => {
      cancelled = true;

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [page, cameraOn]);

  // ---------------- START INTERVIEW ----------------
  const startInterview = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error(
          "Please sign in again before starting an interview."
        );
      }

      const apiBase = import.meta.env.VITE_API_URL || "";

      const response = await fetch(`${apiBase}/api/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          interviewType,
          difficulty,
          durationMinutes: Number(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not create interview session."
        );
      }

      finishingInterviewRef.current = false;
      timerFinishStartedRef.current = false;
      setSpeechGracePeriod(false);

      setCurrentInterviewId(data.interview.id);
      setQuestionIndex(0);
      setInterviewAnswers({});
      setCurrentAnswer("");
      setTimeLeft(Number(duration) * 60);
      setInterviewStarted(true);
      setPage("interview");

// Reset metrics for this new interview.
audioMetricsResultRef.current = null;
videoMetricsResultRef.current = null;

// Start camera and microphone.
void startCamera();
void startMicrophone();
    } catch (error) {
      console.error("Start interview error:", error);
      alert(error.message || "Could not start the interview.");
    }
  };

  
  // ---------------- RUN AI EVALUATION ----------------
  const runInterviewEvaluation = async (interviewId = currentInterviewId) => {
    if (!interviewId) {
      setEvaluationError("No interview ID was found. Please refresh and try again.");
      return;
    }

    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Please sign in again to evaluate your interview.");
      }

      const evaluation = await evaluateInterview({
        interviewId,
        accessToken: session.access_token,
        audioMetrics: audioMetricsResultRef.current,
        videoMetrics: videoMetricsResultRef.current,
      });

      setEvaluationResult(evaluation);
    } catch (error) {
      console.error("Interview evaluation error:", error);
      setEvaluationError(
        error.message || "Could not evaluate this interview. Please try again."
      );
    } finally {
      setEvaluationLoading(false);
    }
  };

 
  // ---------------- FINISH INTERVIEW ----------------
  const finishInterview = async (
    answersToSave = null,
    answerOverride = null
  ) => {
    if (finishingInterviewRef.current) return;

    finishingInterviewRef.current = true;

    try {
      if (!currentInterviewId) {
        throw new Error("No active interview session was found.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Please sign in again.");
      }

      const finalAnswers = answersToSave ?? {
        ...interviewAnswers,
        [questionIndex]: {
          question: questions[questionIndex],
          answer: (answerOverride ?? currentAnswer).trim(),
        },
      };

      const questionsAnswers = Object.keys(finalAnswers)
        .sort((a, b) => Number(a) - Number(b))
        .map((index) => finalAnswers[index]);

      const apiBase = import.meta.env.VITE_API_URL || "";

      const response = await fetch(
        `${apiBase}/api/interviews/${currentInterviewId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            questions_answers: questionsAnswers,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not save and complete the interview."
        );
      }

      // Answers are saved successfully. Show the completed page,
      // then request the AI evaluation separately.
    setInterviewAnswers(finalAnswers);
    setEvaluationResult(null);
    setEvaluationError("");
    setInterviewStarted(false);

    // Collect final metrics before stopping the media tracks.
    audioMetricsResultRef.current = mergeAudioMetricResults(
      audioMetricsResultRef.current,
      audioMetricsStopRef.current?.() ?? null
    );

    videoMetricsResultRef.current = mergeVideoMetricResults(
      videoMetricsResultRef.current,
      videoMetricsStopRef.current?.() ?? null
    );

    audioMetricsStopRef.current = null;
    videoMetricsStopRef.current = null;

    stopCamera();
    setPage("completed");

    await runInterviewEvaluation(currentInterviewId);

    } catch (error) {
      console.error("Finish interview error:", error);
      alert(error.message || "Could not finish the interview.");

      // Allow retry if saving or completing the interview failed.
      finishingInterviewRef.current = false;
    }
  };


  // ---------------- TIMER COUNTDOWN ----------------
  useEffect(() => {
    if (!interviewStarted || timeLeft <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [interviewStarted, timeLeft]);

  // ---------------- TIMER FINISH ----------------
  useEffect(() => {
    if (!interviewStarted || timeLeft > 0) return undefined;
    if (timerFinishStartedRef.current) return undefined;

    setSpeechGracePeriod(true);

    const graceTimer = window.setTimeout(async () => {
      if (timerFinishStartedRef.current) return;
      timerFinishStartedRef.current = true;

      let latestAnswer = currentAnswer;

      try {
        const stopSpeech = stopSpeechRef.current;

        if (stopSpeech) {
          const transcript = await Promise.race([
            stopSpeech(),
            new Promise((resolve) => {
              window.setTimeout(() => resolve(null), 5000);
            }),
          ]);

          if (typeof transcript === "string") {
            latestAnswer = transcript;
          }
        }
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }

      await finishInterview(null, latestAnswer);
      setSpeechGracePeriod(false);
    }, 5000);

    return () => window.clearTimeout(graceTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStarted, timeLeft]);

  // ---------------- LOAD INTERVIEW HISTORY ----------------
const loadInterviewHistory = async () => {
  setHistoryLoading(true);
  setHistoryError("");

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error("Please sign in again.");
    }

    const apiBase = import.meta.env.VITE_API_URL || "";

    const response = await fetch(`${apiBase}/api/interviews`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load interview history."
      );
    }

    setInterviewHistory(
      Array.isArray(data.interviews) ? data.interviews : []
    );
  } catch (error) {
    console.error("Load interview history error:", error);
    setHistoryError(
      error.message || "Could not load interview history."
    );
  } finally {
    setHistoryLoading(false);
  }
};
  
  // ---------------- NEXT QUESTION ----------------
  const nextQuestion = () => {
    if (finishingInterviewRef.current) return;

    // Save the current question and its answer first.
    const updatedAnswers = {
      ...interviewAnswers,
      [questionIndex]: {
        question: questions[questionIndex],
        answer: currentAnswer.trim(),
      },
    };

    setInterviewAnswers(updatedAnswers);

    if (questionIndex < questions.length - 1) {
      // Stop speech recognition before moving to the next question.
      const stopSpeech = stopSpeechRef.current;

      if (stopSpeech) {
        void stopSpeech();
      }

      setCurrentAnswer("");
      setQuestionIndex((prev) => prev + 1);
    } else {
      void finishInterview(updatedAnswers);
    }
  };


  // ---------------- LOGOUT ----------------
  const logout = () => {
    stopCamera();
    setInterviewStarted(false);

    if (supabase) {
      void signOutUser(supabase).catch((error) =>
        setAuthError(error.message)
      );
    }

    setAuthSession(null);
    setPage("login");
    setIsRegister(false);
  };

  // =========================================================
  // LOGIN / REGISTER PAGE
  // =========================================================
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-loading">
          Checking your account access…
        </div>
      </div>
    );
  }

  if (page === "login" || !authSession) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="logo-box">AI</div>

          {!isRegister ? (
            <>
              <h1>Welcome Back</h1>
              <p className="auth-subtitle">
                Practice smarter. Interview better.
              </p>

              {authError && (
                <p className="auth-error" role="alert">
                  {authError}
                </p>
              )}

              <form onSubmit={handleAuth}>
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  required
                />

                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={authBusy}
                >
                  {authBusy ? "Signing in…" : "Login →"}
                </button>
              </form>

              <p className="auth-footer">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={openRegistration}>
                  Register here
                </button>
              </p>
            </>
          ) : (
            <>
              <div
                className="registration-steps"
                aria-label={`Registration step ${registerStep} of 3`}
              >
                {["Email", "Verify", "Details"].map((step, index) => (
                  <div
                    className={`registration-step ${
                      registerStep >= index + 1 ? "current" : ""
                    }`}
                    key={step}
                  >
                    <span>{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>

              <h1>
                {registerStep === 1
                  ? "Create your account"
                  : registerStep === 2
                    ? "Check your email"
                    : "Your account details"}
              </h1>

              <p className="auth-subtitle">
                {registerStep === 1 && "Start with your email address."}
                {registerStep === 2 && (
                  <>
                    We sent a 6-digit verification code to{" "}
                    <strong>{registerEmail}</strong>.
                  </>
                )}
                {registerStep === 3 &&
                  "Choose a name and password to finish signing up."}
              </p>

              {authError && (
                <p className="auth-error" role="alert">
                  {authError}
                </p>
              )}

              {authNotice && (
                <p className="auth-notice" role="status">
                  {authNotice}
                </p>
              )}

              {registerStep === 1 && (
                <form onSubmit={beginRegistration}>
                  <label htmlFor="register-email">Gmail address</label>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="you@gmail.com"
                    autoComplete="email"
                    required
                  />

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={authBusy}
                  >
                    {authBusy
                      ? "Sending code…"
                      : "Send verification code →"}
                  </button>
                </form>
              )}

              {registerStep === 2 && (
                <form onSubmit={verifyRegistrationOtp}>
                  <label htmlFor="register-otp">
                    6-digit verification code
                  </label>

                  <input
                    id="register-otp"
                    className="otp-input"
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    required
                  />

                  <button
                    className="auth-text-button resend-link"
                    type="button"
                    onClick={resendRegistrationOtp}
                    disabled={authBusy}
                  >
                    {authBusy ? "Sending…" : "Resend OTP"}
                  </button>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={authBusy}
                  >
                    {authBusy ? "Verifying…" : "Verify email →"}
                  </button>

                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthNotice("");
                      setRegisterStep(1);
                    }}
                  >
                    Use a different email
                  </button>
                </form>
              )}

              {registerStep === 3 && (
                <form onSubmit={createRegisteredAccount}>
                  <label htmlFor="register-name">Full name</label>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    required
                  />

                  <label htmlFor="register-password">Password</label>
                  <input
                    id="register-password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    required
                  />

                  <label htmlFor="register-confirm-password">
                    Confirm password
                  </label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Enter your password again"
                    required
                  />

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={authBusy}
                  >
                    {authBusy ? "Creating account…" : "Create account →"}
                  </button>
                </form>
              )}

              <p className="auth-footer">
                Already have an account?{" "}
                <button type="button" onClick={backToLogin}>
                  Login here
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN APPLICATION
  // =========================================================
  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} logout={logout} />

      <main className="main-content">
        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <div className="top-header">
              <div>
                <h1>Dashboard</h1>
                <p>Welcome back, {user.name} 👋</p>
              </div>

              <button
                className="primary-btn small-btn"
                onClick={() => setPage("setup")}
              >
                + New Interview
              </button>
            </div>

            <div className="welcome-box">
              <div>
                <h2>AI-Powered Interview Practice</h2>
                <p>
                  Improve your technical skills, communication and interview
                  confidence with AI-powered feedback.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => setPage("setup")}
                >
                  Start Practice Interview →
                </button>
              </div>

              <div className="welcome-icon">🤖</div>
            </div>

            
              <div className="stats-grid">
                <StatCard
                  icon="🎯"
                  title="Interviews"
                  value={completedInterviews.length}
                  subtitle="Completed interviews"
                />
                <StatCard
                  icon="⭐"
                  title="Average Score"
                  value={averageScore === null ? "—" : `${averageScore}/100`}
                  subtitle={
                    evaluatedInterviews.length
                      ? `${evaluatedInterviews.length} evaluated interview(s)`
                      : "No evaluated interviews yet"
                  }
                />
                <StatCard
                  icon="🗣️"
                  title="Communication"
                  value={
                    averageCommunication === null
                      ? "—"
                      : `${averageCommunication}/100`
                  }
                  subtitle="Average communication score"
                />
                <StatCard
                  icon="💻"
                  title="Technical"
                  value={
                    averageTechnical === null
                      ? "—"
                      : `${averageTechnical}/100`
                  }
                  subtitle="Average technical accuracy score"
                />
              </div>


            
              <div className="section-title">
                <h2>Recent Activity</h2>
              </div>

              <div className="history-card" style={{ padding: "28px" }}>
                {historyLoading ? (
                  <p>Loading recent interviews...</p>
                ) : historyError ? (
                  <p role="alert">{historyError}</p>
                ) : interviewHistory.length === 0 ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                      📋
                    </div>
                    <h3>No interviews yet</h3>
                    <p>
                      Your completed interviews will appear here. Start your first
                      practice interview when you're ready.
                    </p>
                    <button
                      className="primary-btn"
                      onClick={() => setPage("setup")}
                    >
                      Start First Interview →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {interviewHistory.slice(0, 5).map((interview) => {
                      const feedback = interview.ai_feedback || {};
                      const hasEvaluation =
                        interview.overall_score != null &&
                        Object.keys(feedback).length > 0;

                      return (
                        <div
                          key={interview.id}
                          style={{
                            padding: "18px",
                            border: "1px solid var(--border-color, #ddd)",
                            borderRadius: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h3 style={{ marginTop: 0 }}>
                              {interview.interview_type || "Practice Interview"}
                            </h3>

                            <p>
                              <strong>Difficulty:</strong>{" "}
                              {interview.difficulty || "—"}
                            </p>

                            <p>
                              <strong>Date:</strong>{" "}
                              {interview.created_at
                                ? new Date(interview.created_at).toLocaleString()
                                : "—"}
                            </p>

                            <p>
                              <strong>Status:</strong>{" "}
                              {interview.status || "Unknown"}
                            </p>

                            <p>
                              <strong>AI Score:</strong>{" "}
                              {hasEvaluation
                                ? `${Number(interview.overall_score)}/100`
                                : "Not evaluated"}
                            </p>
                          </div>

                          {hasEvaluation && (
                            <button
                              className="primary-btn"
                              onClick={() => {
                                setEvaluationResult({
                                  ...feedback,
                                  overallScore: Number(interview.overall_score),
                                  scores: interview.scores || feedback.scores || {},
                                });
                                setEvaluationError("");
                                setPage("results");
                              }}
                            >
                              View AI Feedback
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

          </div>
        )}

        {/* SETUP */}
        {page === "setup" && (
          <div>
            <div className="top-header">
              <div>
                <h1>Interview Setup</h1>
                <p>Customize your practice interview.</p>
              </div>
            </div>

            <div className="setup-card">
              <h2>Interview Type</h2>

              <div className="option-grid">
                {["Technical", "HR", "Behavioral"].map((type) => (
                  <button
                    key={type}
                    className={
                      interviewType === type
                        ? "option-btn active"
                        : "option-btn"
                    }
                    onClick={() => {
                      setInterviewType(type);

                      if (type === "Technical") {
                        setInterviewRole("Frontend Developer");
                      } else if (type === "HR") {
                        setInterviewRole("HR Generalist");
                      } else {
                        setInterviewRole("Behavioral");
                      }
                    }}
                  >
                    {type === "Technical" && "💻"}
                    {type === "HR" && "👥"}
                    {type === "Behavioral" && "🧠"}
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              <h2>
                {interviewType === "Technical"
                  ? "Select Technical Role"
                  : interviewType === "HR"
                    ? "Select HR Role"
                    : "Behavioral Category"}
              </h2>

              <select
                value={interviewRole}
                onChange={(e) => setInterviewRole(e.target.value)}
              >
                {interviewType === "Technical" && (
                  <>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>Full Stack Developer</option>
                    <option>Cloud Computing</option>
                    <option>Software Tester</option>
                    <option>Data Analyst</option>
                  </>
                )}

                {interviewType === "HR" && (
                  <>
                    <option>HR Generalist</option>
                    <option>HR Specialist</option>
                    <option>HR Business Partner</option>
                  </>
                )}

                {interviewType === "Behavioral" && (
                  <>
                    <option>General Behavioral</option>
                    <option>Leadership</option>
                    <option>Teamwork</option>
                    <option>Problem Solving</option>
                  </>
                )}
              </select>

              <h2>Difficulty</h2>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>

              <h2>Duration</h2>

              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
              </select>

              <div className="setup-summary">
                <h3>Interview Summary</h3>
                <p>
                  <strong>Type:</strong> {interviewType}
                </p>
                <p>
                  <strong>Difficulty:</strong> {difficulty}
                </p>
                <p>
                  <strong>Duration:</strong> {duration} minutes
                </p>
                <p>
                  <strong>Questions:</strong> {questions.length}
                </p>
              </div>

              <button
                className="primary-btn full-btn"
                onClick={startInterview}
              >
                Start Interview →
              </button>
            </div>
          </div>
        )}

        {/* INTERVIEW */}
        {page === "interview" && (
          <div className="interview-page">
            <div className="interview-header">
              <div>
                <h1>Live Interview</h1>
                <p>
                  {interviewType} • {difficulty}
                </p>
              </div>

              <div className="timer">⏱ {formatTime(timeLeft)}</div>
              {speechGracePeriod && (
                <p>
                  Time is up! Finish your sentence — saving your answer in 5 seconds...
                </p>
              )}
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{
                  width: `${
                    ((questionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>

            <p className="question-number">
              Question {questionIndex + 1} of {questions.length}
            </p>

            <div className="question-card">
              <h2>{questions[questionIndex]}</h2>
              <p>
                Take a moment to think and explain your answer clearly.
              </p>

              <textarea
                className="answer-input"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={5}
              />
              
                
                <VoiceToText
                  key={questionIndex}
                  value={currentAnswer}
                  onChange={setCurrentAnswer}
                  disabled={finishingInterviewRef.current}
                  language="en-IN"
                  stopListeningRef={stopSpeechRef}
                />
                </div>

            
  <div className="video-card">
    {cameraOn ? (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="video-preview"
        aria-label="Live camera preview"
      />
    ) : (
      <div className="camera-placeholder">
        <div className="camera-icon">📷</div>
        <h3>{cameraLoading ? "Starting camera..." : "Camera is off"}</h3>
        <p>
          {cameraLoading
            ? "Please allow camera access in your browser."
            : "Turn on your camera when you are ready."}
        </p>

        <button
          className="secondary-btn"
          onClick={() => void startCamera()}
          disabled={cameraLoading}
        >
          {cameraLoading ? "Starting..." : "Turn On Camera"}
        </button>
      </div>
    )}

    {cameraError && (
      <p className="media-error" role="alert">
        {cameraError}
      </p>
    )}

    <p className="media-status" role="status">
      Camera: {cameraOn ? "On" : cameraLoading ? "Requesting permission..." : "Off"}
    </p>
  </div>


            
              <div className="controls">
                <button
                  type="button"
                  className={cameraOn ? "control-btn active-control" : "control-btn"}
                  onClick={toggleCamera}
                  disabled={cameraLoading}
                >
                  {cameraLoading
                    ? "⌛ Starting Camera..."
                    : cameraOn
                      ? "📹 Camera On"
                      : "📷 Turn On Camera"}
                </button>

                <button
                  type="button"
                  className={micOn ? "control-btn active-control" : "control-btn"}
                  onClick={toggleMic}
                  disabled={micLoading}
                >
                  {micLoading
                    ? "⌛ Starting Microphone..."
                    : micOn
                      ? "🎙️ Microphone On"
                      : "🔇 Turn On Microphone"}
                </button>
              </div>

              <div className="media-permission-status">
                <p role="status">
                  <strong>Camera:</strong>{" "}
                  {cameraLoading
                    ? "Requesting permission"
                    : cameraError
                      ? "Permission or device issue"
                      : cameraOn
                        ? "Enabled"
                        : "Off"}
                </p>

                <p role="status">
                  <strong>Microphone:</strong>{" "}
                  {micLoading
                    ? "Requesting permission"
                    : micError
                      ? "Permission or device issue"
                      : micOn
                        ? "Enabled"
                        : "Off"}
                </p>

                {micError && (
                  <p className="media-error" role="alert">
                    {micError}
                  </p>
                )}
              </div>


            <div className="interview-actions">
              <button
                className="danger-btn"
                onClick={() => void finishInterview()}
                disabled={finishingInterviewRef.current}
              >
                End Interview
              </button>

              <button
                className="primary-btn"
                onClick={nextQuestion}
                disabled={finishingInterviewRef.current}
              >
                {questionIndex === questions.length - 1
                  ? "Finish Interview →"
                  : "Next Question →"}
              </button>
            </div>
          </div>
        )}


        {/* COMPLETED */}
        {page === "completed" && (
          <div className="completed-page">
            <div className="completed-icon">✓</div>
            <h1>Practice Session Completed</h1>
            <p>
              Your practice session has ended. Your answers have been saved.
              Review your AI evaluation below.
            </p>

            <div
              className="history-card"
              style={{
                padding: "22px",
                margin: "20px auto",
                maxWidth: "560px",
                textAlign: "left",
              }}
            >
              {evaluationLoading ? (
                <>
                  <h2>🤖 Evaluating your interview...</h2>
                  <p>
                    Your answers are saved. Please wait while Gemini prepares
                    your feedback.
                  </p>
                </>
              ) : evaluationError ? (
                <>
                  <h2>Evaluation unavailable</h2>
                  <p role="alert">{evaluationError}</p>
                  <button
                    className="primary-btn"
                    onClick={() => void runInterviewEvaluation()}
                  >
                    Try Evaluation Again
                  </button>
                </>
              ) : evaluationResult ? (
                <>
                  <h2>
                    Overall Score: {evaluationResult.overallScore}/100
                  </h2>

                  <p>{evaluationResult.summary}</p>

                  <h3>Category Scores</h3>
                  <ul>
                    {Object.entries(evaluationResult.scores || {}).map(
                      ([category, score]) => (
                        <li key={category}>
                          {category.replace(/([A-Z])/g, " $1")}: {score}/100
                        </li>
                      )
                    )}
                  </ul>

                  <h3>Strengths</h3>
                  <ul>
                    {(evaluationResult.strengths || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <h3>Areas to Improve</h3>
                  <ul>
                    {(evaluationResult.improvements || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <h3>Answer-by-Answer Feedback</h3>
                  {(evaluationResult.answerFeedback || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: "18px" }}>
                      <strong>{item.question}</strong>
                      <p>Score: {item.score}/100</p>
                      <p>{item.feedback}</p>

                      {item.suggestedAnswer && (
                        <p>
                          <strong>Suggested answer:</strong>{" "}
                          {item.suggestedAnswer}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <h2>No evaluation yet</h2>
                  <p>Your interview answers have been saved.</p>
                  <button
                    className="primary-btn"
                    onClick={() => void runInterviewEvaluation()}
                  >
                    Generate AI Feedback
                  </button>
                </>
              )}
            </div>

            <button
              className="primary-btn"
              onClick={() => setPage("setup")}
            >
              Practice Again →
            </button>

            <button
              className="secondary-btn"
              onClick={() => setPage("dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* RESULTS */}
        {page === "results" && (
          <div>
            <div className="top-header">
              <div>
                <h1>AI Feedback</h1>
                <p>
                  Feedback will be based on your actual interview answers.
                </p>
              </div>
            </div>

<div
  className="history-card"
  style={{ padding: "28px", textAlign: "left" }}
>
  {evaluationLoading ? (
    <p>Loading your AI feedback...</p>
  ) : evaluationResult ? (
    <>
      <h2>Overall Score: {evaluationResult.overallScore}/100</h2>
      <p>{evaluationResult.summary}</p>

      <h3>Category Scores</h3>
      <ul>
        {Object.entries(evaluationResult.scores || {}).map(
          ([category, score]) => (
            <li key={category}>
              {category.replace(/([A-Z])/g, " $1")}: {score}/100
            </li>
          )
        )}
      </ul>

      <h3>Strengths</h3>
      <ul>
        {(evaluationResult.strengths || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h3>Areas to Improve</h3>
      <ul>
        {(evaluationResult.improvements || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  ) : (
    <>
      <h2>No feedback available</h2>
      <p>
        No evaluation is loaded for this session yet. Open Interview History
        to select a previously evaluated interview.
      </p>
      <button
        className="primary-btn"
        onClick={() => setPage("history")}
      >
        Open Interview History
      </button>
    </>
  )}
</div>

          </div>
        )}


          {/* HISTORY */}
          {page === "history" && (
            <div>
              <div className="top-header">
                <div>
                  <h1>Interview History</h1>
                  <p>Review your previous practice sessions.</p>
                </div>

                <button
                  className="primary-btn small-btn"
                  onClick={loadInterviewHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {historyError && (
                <div className="history-card" role="alert">
                  <p>{historyError}</p>
                  <button
                    className="primary-btn"
                    onClick={loadInterviewHistory}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {historyLoading ? (
                <div className="history-card" style={{ padding: "36px", textAlign: "center" }}>
                  <p>Loading your interviews...</p>
                </div>
              ) : !historyError && interviewHistory.length === 0 ? (
                <div className="history-card" style={{ padding: "36px", textAlign: "center" }}>
                  <div style={{ fontSize: "42px", marginBottom: "12px" }}>
                    🗂️
                  </div>
                  <h2>No interviews yet</h2>
                  <p>Your completed interviews will appear here.</p>
                  <button
                    className="primary-btn"
                    onClick={() => setPage("setup")}
                  >
                    Start Your First Interview →
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "18px" }}>
                  {interviewHistory.map((interview) => {
                    const answers = Array.isArray(interview.questions_answers)
                      ? interview.questions_answers
                      : [];

                    const isSelected =
                      selectedHistoryInterview === interview.id;

                    return (
                      <div
                        className="history-card"
                        key={interview.id}
                        style={{ padding: "24px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h2 style={{ marginTop: 0 }}>
                              {interview.interview_type || "Practice Interview"}
                            </h2>

                            <p>
                              <strong>Difficulty:</strong>{" "}
                              {interview.difficulty || "Not specified"}
                            </p>

                            <p>
                              <strong>Duration:</strong>{" "}
                              {interview.duration_minutes ?? "—"} minutes
                            </p>

                            <p>
                              <strong>Date:</strong>{" "}
                              {interview.created_at
                                ? new Date(interview.created_at).toLocaleString()
                                : "Not available"}
                            </p>

                            <p>
                              <strong>Status:</strong>{" "}
                              <span>{interview.status || "Unknown"}</span>
                            </p>

                            <p>
                              <strong>Answers saved:</strong> {answers.length}
                            </p>
                            {interview.overall_score != null && (
                              <p>
                                <strong>AI Score:</strong>{" "}
                                {Number(interview.overall_score)}/100
                              </p>
                            )}
                          </div>

                          <button
                            className="primary-btn"
                            onClick={() =>
                              setSelectedHistoryInterview(
                                isSelected ? null : interview.id
                              )
                            }
                          >
                            {isSelected ? "Hide Answers" : "View Answers"}
                          </button>
                          
                          <button
                            className="primary-btn"
                            disabled={
                              interview.overall_score == null ||
                              !interview.ai_feedback ||
                              Object.keys(interview.ai_feedback).length === 0
                            }
                            onClick={() => {
                              setEvaluationResult({
                                overallScore: Number(interview.overall_score),
                                scores: interview.scores || {},
                                ...(interview.ai_feedback || {}),
                              });
                              setEvaluationError("");
                              setPage("results");
                            }}
                          >
                            View AI Feedback
                          </button>

                        </div>

                        {isSelected && (
                          <div style={{ marginTop: "20px" }}>
                            <h3>Questions and Answers</h3>

                            {answers.length === 0 ? (
                              <p>No answers were saved for this interview.</p>
                            ) : (
                              <div style={{ display: "grid", gap: "14px" }}>
                                {answers.map((item, index) => (
                                  <div
                                    key={`${interview.id}-${index}`}
                                    style={{
                                      padding: "16px",
                                      border: "1px solid var(--border-color, #ddd)",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    <p>
                                      <strong>
                                        Question {index + 1}:
                                      </strong>{" "}
                                      {item.question}
                                    </p>

                                    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                      <strong>Your answer:</strong>{" "}
                                      {item.answer || "(No answer provided)"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


        {/* PROFILE */}
        {page === "profile" && (
          <div className="profile-page">
            <div className="top-header profile-page-header">
              <div>
                <h1>My Profile</h1>
                <p>Manage your personal information and preferences.</p>
              </div>
              <div className="profile-header-icon">⚙️</div>
            </div>

            <div className="profile-layout">
              <section className="profile-overview">
                <div className="profile-avatar-large">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <h2>{user.name}</h2>
                <p className="profile-email-text">{user.email}</p>

                <div className="profile-status">
                  <span className="status-dot"></span>
                  Account active
                </div>

                <div className="profile-overview-divider"></div>

                <div className="profile-info-item">
                  <span>👤</span>
                  <div>
                    <small>Account holder</small>
                    <strong>{user.name}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <span>✉️</span>
                  <div>
                    <small>Email address</small>
                    <strong>{user.email}</strong>
                  </div>
                </div>
              </section>

              <section className="profile-settings-card">
                <div className="profile-section-heading">
                  <div>
                    <h2>Personal Information</h2>
                    <p>Update your profile details below.</p>
                  </div>
                  <span className="profile-heading-icon">✎</span>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label htmlFor="profile-full-name">Full name</label>
                    <input
                      id="profile-full-name"
                      type="text"
                      value={user.name}
                      onChange={(e) =>
                        setUser({ ...user, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-email">Email address</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={user.email}
                      readOnly
                      aria-describedby="profile-email-help"
                    />
                    <small id="profile-email-help">
                      Your registered email address cannot be changed here.
                    </small>
                  </div>
                </div>

                <div className="profile-section-heading preferences-heading">
                  <div>
                    <h2>Interview Preferences</h2>
                    <p>Choose your preferred practice settings.</p>
                  </div>
                  <span className="profile-heading-icon">⚙</span>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label htmlFor="profile-interview-type">
                      Preferred interview type
                    </label>
                    <select id="profile-interview-type">
                      <option>Technical</option>
                      <option>HR</option>
                      <option>Behavioral</option>
                    </select>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-difficulty">
                      Difficulty preference
                    </label>
                    <select id="profile-difficulty">
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setUser({
                        ...user,
                        name: user.name.trim() || "Student",
                      });
                    }}
                  >
                    Keep editing
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      if (!user.name.trim()) {
                        alert("Please enter your full name.");
                        return;
                      }

                      setUser({
                        ...user,
                        name: user.name.trim(),
                      });

                      alert(
                        "Profile updated for this session. Persistent saving will be added separately."
                      );
                    }}
                  >
                    Save Changes →
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =========================================================
// SIDEBAR
// =========================================================
function Sidebar({ page, setPage, logout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">AI</div>

        <div>
          <strong>Smart Interview</strong>
          <small>AI Practice Platform</small>
        </div>
      </div>

      <nav>
        <button
          className={page === "dashboard" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button
          className={page === "setup" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("setup")}
        >
          🎤 New Interview
        </button>

        <button
          className={page === "results" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("results")}
        >
          🤖 AI Feedback
        </button>

        <button
          className={page === "history" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("history")}
        >
          📊 History
        </button>

        <button
          className={page === "profile" ? "nav-btn active" : "nav-btn"}
          onClick={() => setPage("profile")}
        >
          ⚙️ Profile
        </button>
      </nav>

      <button className="logout-btn" onClick={logout}>
        🚪 Logout
      </button>
    </aside>
  );
}

// =========================================================
// STAT CARD
// =========================================================
function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

// =========================================================
// FEEDBACK CARD
// =========================================================
function FeedbackCard({ icon, title, text }) {
  return (
    <div className="feedback-card">
      <div className="feedback-icon">{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

// =========================================================
// FEEDBACK SCORE
// =========================================================
function FeedbackScore({ title, score }) {
  return (
    <div className="feedback-score">
      <div className="score-title">
        <span>{title}</span>
        <strong>{score}%</strong>
      </div>

      <div className="score-progress">
        <div
          className="score-progress-fill"
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

export default App;