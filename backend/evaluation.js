
const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function generateInterviewEvaluation({
  interviewType,
  difficulty,
  questionsAnswers,
  audioMetrics = null,
  videoMetrics = null,
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  if (!Array.isArray(questionsAnswers) || questionsAnswers.length === 0) {
    throw new Error("No interview answers are available to evaluate.");
  }

  const prompt = `
You are an interview coach evaluating a practice interview.

Interview type: ${interviewType}
Difficulty: ${difficulty}

Evaluate only the answers actually provided. Do not invent missing answers.
Use a fair, constructive rubric. Do not infer personality, intelligence,
or job suitability from appearance, accent, or camera behavior.

Return valid JSON only, with this structure:
{
  "overallScore": 0,
  "scores": {
    "technicalAccuracy": 0,
    "relevance": 0,
    "communication": 0,
    "completeness": 0
  },
  "summary": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "answerFeedback": [
    {
      "question": "string",
      "score": 0,
      "feedback": "string",
      "suggestedAnswer": "string"
    }
  ]
}

All scores must be between 0 and 100. If an answer is empty, do not award
credit for content that was not provided. Keep feedback specific and useful.

Interview answers:
${JSON.stringify(questionsAnswers)}

Local audio activity metrics (may be unavailable or noisy):
${JSON.stringify(audioMetrics)}

Local video availability metrics (may be unavailable or incomplete):
${JSON.stringify(videoMetrics)}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Gemini evaluation request failed:", response.status);
    throw Object.assign(
      new Error("Gemini could not evaluate this interview. Please try again."),
      { status: response.status === 429 ? 429 : 502 }
    );
  }

  const text = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty evaluation.");
  }

  let evaluation;

  try {
    evaluation = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned an invalid evaluation format.");
  }

  if (
    typeof evaluation.overallScore !== "number" ||
    evaluation.overallScore < 0 ||
    evaluation.overallScore > 100 ||
    !evaluation.scores ||
    !Array.isArray(evaluation.strengths) ||
    !Array.isArray(evaluation.improvements) ||
    !Array.isArray(evaluation.answerFeedback)
  ) {
    throw new Error("Gemini returned an incomplete evaluation.");
  }

  return evaluation;
}
