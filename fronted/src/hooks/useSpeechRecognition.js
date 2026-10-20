
import { useCallback, useEffect, useRef, useState } from "react";

export default function useSpeechRecognition({
  language = "en-IN",
  initialText = "",
  onTranscriptChange,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef(null);
  const baseTextRef = useRef(initialText);
  const finalTextRef = useRef("");
  const latestTranscriptRef = useRef(initialText);
  const mountedRef = useRef(false);
  const stopWaitersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const recognition = recognitionRef.current;
      recognitionRef.current = null;

      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        try {
          recognition.abort();
        } catch {
          // Recognition may already have stopped.
        }
      }

      stopWaitersRef.current.forEach((resolve) => {
        resolve(latestTranscriptRef.current);
      });
      stopWaitersRef.current = [];
    };
  }, []);

  const updateTranscript = useCallback(
    (text) => {
      if (!mountedRef.current) return;

      latestTranscriptRef.current = text;
      setTranscript(text);
      onTranscriptChange?.(text);
    },
    [onTranscriptChange]
  );

  const startListening = useCallback(
    (currentText = latestTranscriptRef.current) => {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechError(
          "Speech recognition is not supported in this browser. Please type your answer instead."
        );
        return;
      }

      if (recognitionRef.current) return;

      setSpeechError("");

      baseTextRef.current = currentText.trim();
      finalTextRef.current = "";
      latestTranscriptRef.current = currentText;

      const recognition = new SpeechRecognition();

      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (
          !mountedRef.current ||
          recognitionRef.current !== recognition
        ) {
          return;
        }

        setIsListening(true);
      };

      recognition.onresult = (event) => {
        if (
          !mountedRef.current ||
          recognitionRef.current !== recognition
        ) {
          return;
        }

        let interimText = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i += 1
        ) {
          const result = event.results[i];
          const text = result[0]?.transcript?.trim();

          if (!text) continue;

          if (result.isFinal) {
            finalTextRef.current +=
              `${finalTextRef.current ? " " : ""}${text}`;
          } else {
            interimText +=
              `${interimText ? " " : ""}${text}`;
          }
        }

        const combinedText = [
          baseTextRef.current,
          finalTextRef.current,
          interimText,
        ]
          .filter(Boolean)
          .join(" ");

        updateTranscript(combinedText);
      };

      recognition.onerror = (event) => {
        if (
          !mountedRef.current ||
          recognitionRef.current !== recognition
        ) {
          return;
        }

        setIsListening(false);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setSpeechError(
            "Microphone permission was denied. Allow microphone access in Chrome settings."
          );
        } else if (event.error === "no-speech") {
          setSpeechError(
            "No speech was detected. Try speaking closer to your microphone."
          );
        } else if (event.error === "audio-capture") {
          setSpeechError(
            "No working microphone was detected. Check your microphone settings."
          );
        } else if (event.error !== "aborted") {
          setSpeechError(
            `Speech recognition error: ${event.error}. You can type your answer instead.`
          );
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;

        recognitionRef.current = null;

        if (mountedRef.current) {
          setIsListening(false);
        }

        const waiters = stopWaitersRef.current;
        stopWaitersRef.current = [];

        waiters.forEach((resolve) => {
          resolve(latestTranscriptRef.current);
        });
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (error) {
        recognitionRef.current = null;
        setIsListening(false);

        setSpeechError(
          error.message ||
            "Could not start speech recognition. Please try again."
        );
      }
    },
    [language, updateTranscript]
  );

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setIsListening(false);
      return;
    }

    try {
      recognition.stop();
    } catch (error) {
      console.error("Could not stop speech recognition:", error);
    }
  }, []);

  const stopListeningAndWait = useCallback(() => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current;

      if (!recognition) {
        setIsListening(false);
        resolve(latestTranscriptRef.current);
        return;
      }

      stopWaitersRef.current.push(resolve);

      try {
        recognition.stop();
      } catch (error) {
        console.error("Could not stop speech recognition:", error);

        const waiters = stopWaitersRef.current;
        stopWaitersRef.current = [];

        waiters.forEach((finish) => {
          finish(latestTranscriptRef.current);
        });
      }
    });
  }, []);

  const resetTranscript = useCallback(
    (text = "") => {
      baseTextRef.current = text.trim();
      finalTextRef.current = "";
      latestTranscriptRef.current = text;

      updateTranscript(text);
      setSpeechError("");
    },
    [updateTranscript]
  );

  return {
    transcript,
    setTranscript: updateTranscript,
    isListening,
    speechError,
    startListening,
    stopListening,
    stopListeningAndWait,
    resetTranscript,
  };
}
