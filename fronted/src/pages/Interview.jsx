import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInterviewQuestions } from "../data/interviewQuestions";
import { useLocation } from "react-router-dom";



function Interview() {
  const navigate = useNavigate();
  
  const location = useLocation();

  const {
    role = "Frontend Developer",
    technology = "React.js",
    difficulty = "Medium",
    questionCount = 5,
  } = location.state || {};

  const availableQuestions = getInterviewQuestions(
    role,
    technology,
    difficulty
  );

  const interviewQuestions = availableQuestions.slice(
    0,
    questionCount
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [recording, setRecording] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    startMedia();

    return () => {
      stopMedia();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
      setMicActive(true);
    } catch (error) {
      console.log("Camera/microphone permission denied:", error);
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const recorder = new MediaRecorder(streamRef.current);

      mediaRecorderRef.current = recorder;

      recorder.start();

      setRecording(true);
    } catch (error) {
      console.log("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  };

  const toggleMic = () => {
    if (!streamRef.current) return;

    const audioTracks = streamRef.current.getAudioTracks();

    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMicActive((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;

    const videoTracks = streamRef.current.getVideoTracks();

    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraActive((prev) => !prev);
  };

  const nextQuestion = () => {
    stopRecording();

    if (questionIndex < interviewQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      stopMedia();
      navigate("/interview/completed");
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="interview-page">
      <header className="interview-header">
        <div className="interview-brand">
          <div className="brand-logo">AI</div>
          <div>
            <strong>InterviewAI</strong>
            <span>{role} · {technology}</span>
          </div>
        </div>

        <div className="interview-progress">
          <span>QUESTION</span>
          <strong>
            {questionIndex + 1} / {interviewQuestions.length}
          </strong>
        </div>

        <div className="live-indicator">
          <span></span>
          LIVE
        </div>
      </header>

      <main className="interview-main">
        <section className="video-section">
          <div className="video-container">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
              />
            ) : (
              <div className="camera-placeholder">
                <div className="camera-avatar">AJ</div>
                <p>Camera is off</p>
              </div>
            )}

            <div className="video-name">
              <span className="record-dot"></span>
              Alex Johnson
            </div>

            {recording && (
              <div className="recording-badge">
                <span></span>
                Recording answer
              </div>
            )}
          </div>

          <div className="interview-controls">
            <button
              className={`control-button ${
                !micActive ? "disabled" : ""
              }`}
              onClick={toggleMic}
            >
              {micActive ? "🎙" : "🔇"}
            </button>

            <button
              className={`control-button ${
                !cameraActive ? "disabled" : ""
              }`}
              onClick={toggleCamera}
            >
              {cameraActive ? "▣" : "▧"}
            </button>

            {!recording ? (
              <button
                className="record-button"
                onClick={startRecording}
              >
                <span>●</span>
                Start Answer
              </button>
            ) : (
              <button
                className="stop-record-button"
                onClick={stopRecording}
              >
                <span>■</span>
                Stop Recording
              </button>
            )}

            <div className="timer-display">⏱ {formatTime()}</div>
          </div>
        </section>

        <section className="question-section">
          <div className="question-top">
            <span className="question-label">AI INTERVIEWER</span>
            <span className="timer-small">⏱ {formatTime()}</span>
          </div>

          <div className="question-content">
            <div className="ai-avatar">
              ✦
            </div>

            <p className="question-count">
              Question {questionIndex + 1}
            </p>

            <h1>{interviewQuestions[questionIndex]}</h1>

            <p className="question-help">
              Take a moment to think about your answer. Click
              "Start Answer" when you're ready.
            </p>
          </div>

          <div className="question-footer">
            <div className="audio-status">
              <span className={recording ? "pulse-dot" : ""}></span>
              {recording
                ? "Listening to your answer..."
                : "Ready when you are"}
            </div>

            <button
              className="next-question-button"
              onClick={nextQuestion}
            >
              {questionIndex === interviewQuestions.length - 1
                ? "Finish Interview"
                : "Next Question"}
              <span>→</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Interview;