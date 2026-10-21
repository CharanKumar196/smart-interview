
const FILLER_PHRASES = [
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "i guess",
  "basically",
  "actually",
  "literally",
  "obviously",
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function analyzeFillerWords(questionsAnswers = []) {
  const counts = {};

  for (const item of questionsAnswers) {
    const answer =
      typeof item?.answer === "string" ? item.answer : "";

    for (const phrase of FILLER_PHRASES) {
      const pattern = new RegExp(
        `\\b${escapeRegExp(phrase)}\\b`,
        "gi"
      );

      const matches = answer.match(pattern);

      if (matches) {
        counts[phrase] = (counts[phrase] || 0) + matches.length;
      }
    }
  }

  const totalFillerWords = Object.values(counts).reduce(
    (total, count) => total + count,
    0
  );

  return {
    totalFillerWords,
    counts,
    source: "speech_transcript",
    note:
      "Counts are based on the recognized transcript. Speech recognition may omit or misrecognize words, and some words such as 'like' may be used normally rather than as fillers.",
  };
}
