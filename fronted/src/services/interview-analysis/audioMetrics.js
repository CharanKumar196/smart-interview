
const SAMPLE_INTERVAL_MS = 100;
const MIN_PAUSE_MS = 500;

export function startAudioMetrics(stream) {
  const audioTracks = stream?.getAudioTracks?.() ?? [];

  if (!audioTracks.some((track) => track.enabled && track.readyState === "live")) {
    return {
      available: false,
      reason: "No active microphone track",
      stop: () => ({
        available: false,
        reason: "No active microphone track",
      }),
    };
  }

  let audioContext;
  let analyser;
  let source;
  let intervalId;
  let stopped = false;

  const startedAt = performance.now();
  const data = {
    available: true,
    voicedMs: 0,
    silenceMs: 0,
    pauseCount: 0,
    longestPauseMs: 0,
    averageRms: 0,
    samples: 0,
  };

  let silenceStartedAt = null;
  let lastSampleAt = startedAt;
  let rmsTotal = 0;
  let pendingPauseMs = 0;
  const buffer = new Uint8Array(2048);

  const stop = () => {
    if (stopped) {
      return { ...data, durationMs: performance.now() - startedAt };
    }

    stopped = true;
    window.clearInterval(intervalId);

    if (silenceStartedAt !== null) {
      const pauseDuration = performance.now() - silenceStartedAt;

      if (pauseDuration >= MIN_PAUSE_MS) {
        data.pauseCount += 1;
        data.longestPauseMs = Math.max(data.longestPauseMs, pauseDuration);
      }
    }

    try {
      source?.disconnect();
      analyser?.disconnect();
    } catch {
      // Audio nodes may already be disconnected.
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }

    return {
      ...data,
      durationMs: performance.now() - startedAt,
      voicedSeconds: Number((data.voicedMs / 1000).toFixed(1)),
      silenceSeconds: Number((data.silenceMs / 1000).toFixed(1)),
      longestPauseSeconds: Number((data.longestPauseMs / 1000).toFixed(1)),
      averageRms: data.samples
        ? Number((rmsTotal / data.samples).toFixed(4))
        : 0,
    };
  };

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return {
        available: false,
        reason: "Web Audio API is not supported",
        stop: () => ({
          available: false,
          reason: "Web Audio API is not supported",
        }),
      };
    }

    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    intervalId = window.setInterval(() => {
      if (stopped) return;

      const now = performance.now();
      const elapsed = Math.min(now - lastSampleAt, SAMPLE_INTERVAL_MS * 2);
      lastSampleAt = now;

      analyser.getByteTimeDomainData(buffer);

      let sumSquares = 0;

      for (const value of buffer) {
        const normalized = (value - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / buffer.length);
      rmsTotal += rms;
      data.samples += 1;

      // This is an audio-activity estimate, not speech recognition.
      const audioActive = rms > 0.025;

      if (audioActive) {
        data.voicedMs += elapsed;

        if (silenceStartedAt !== null) {
          const pauseDuration = now - silenceStartedAt;

          if (pauseDuration >= MIN_PAUSE_MS) {
            data.pauseCount += 1;
            data.longestPauseMs = Math.max(
              data.longestPauseMs,
              pauseDuration
            );
          }

          silenceStartedAt = null;
        }
      } else {
        data.silenceMs += elapsed;

        if (silenceStartedAt === null) {
          silenceStartedAt = now;
        }
      }
    }, SAMPLE_INTERVAL_MS);

    return { available: true, stop };
  } catch (error) {
    window.clearInterval(intervalId);

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }

    return {
      available: false,
      reason: error?.message || "Could not start audio analysis",
      stop: () => ({
        available: false,
        reason: error?.message || "Could not start audio analysis",
      }),
    };
  }
}
