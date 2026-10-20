
import { useEffect, useState } from "react";
import "./VoiceToText.css";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const SUPPORTED_LANGUAGES = [
  { label: "English (India)", value: "en-IN" },
  { label: "English (US)", value: "en-US" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Kannada", value: "kn-IN" },
];

export default function VoiceToText({
  value,
  onChange,
  disabled = false,
  language: initialLanguage = "en-IN",
  stopListeningRef,
}) {  const [language, setLanguage] = useState(initialLanguage);

  const {
  transcript,
  isListening,
  speechError,
  startListening,
  stopListening,
  stopListeningAndWait,
} = useSpeechRecognition({
  language,
  initialText: value || "",
  onTranscriptChange: onChange,
});

    useEffect(() => {
    if (!stopListeningRef) return;

    stopListeningRef.current = stopListeningAndWait;

    return () => {
      if (stopListeningRef.current === stopListeningAndWait) {
        stopListeningRef.current = null;
      }
    };
  }, [stopListeningRef, stopListeningAndWait]);

    
useEffect(() => {
  startListening(value || "");
}, [startListening]);


  const handleStart = () => {
    startListening(value || "");
  };


  const handleStop = () => {
    stopListening();
  };

  return (
    <div className="voice-to-text">
      <div className="voice-to-text__language">
        <label htmlFor="speech-language">
          Speech language
        </label>

        <select
          id="speech-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          disabled={disabled || isListening}
        >
          {SUPPORTED_LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="voice-to-text__controls">
        <button
          type="button"
          className="voice-to-text__button voice-to-text__button--primary"
          onClick={handleStart}
          disabled={disabled || isListening}
        >
          🎤 Start Speaking
        </button>

        <button
          type="button"
          className="voice-to-text__button"
          onClick={handleStop}
          disabled={disabled || !isListening}
        >
          ⏹ Stop Speaking
        </button>
      </div>

      <div
        className="voice-to-text__status"
        role="status"
        aria-live="polite"
      >
        {isListening ? (
          <span className="voice-to-text__listening">
            <span className="voice-to-text__recording-dot" />
            Listening in{" "}
            {SUPPORTED_LANGUAGES.find(
              (item) => item.value === language
            )?.label || language}
            ...
          </span>
        ) : (
          "Type your answer or use voice-to-text."
        )}
      </div>

      {speechError && (
        <p className="voice-to-text__error" role="alert">
          {speechError}
        </p>
      )}
    </div>
  );
}
