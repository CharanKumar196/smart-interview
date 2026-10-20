
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

Also provide constructive coaching to help the candidate communicate
more clearly and create a more engaging, professional interview presence.

BODY LANGUAGE AND PRESENTATION RULES:
- Use only the supplied video metrics as evidence of observed behavior.
- The current head orientation values are approximate 2D indicators,
  not calibrated anatomical angles.
- Face visibility means whether a face was detected in sampled frames.
  It does not establish eye contact or attention.
- Head movement is not automatically a problem. Natural movement,
  looking away briefly, and blinking are normal.
- Do not claim to detect eye closure, gaze direction, facial emotion,
  smiling, or eye contact unless the supplied metrics explicitly
  contain reliable measurements for that behavior.
- If a measurement is missing, unavailable, or insufficient, say so.
  Do not invent observations or give a negative judgment.
- Offer practical suggestions such as camera positioning, comfortable
  posture, naturally looking toward the camera, and using clear,
  well-paced explanations.
- Frame suggestions positively and respectfully. Do not tell candidates
  to suppress natural expressions or keep their head perfectly still.
- Distinguish measured observations from general optional coaching tips.
- Do not infer confidence, interest, honesty, or professionalism
  from facial appearance or head movement alone.

Return valid JSON only, using exactly this structure:
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
  ],
  "presentationFeedback": {
    "status": "available or limited or unavailable",
    "summary": "string",
    "observations": [
      {
        "area": "string",
        "evidence": "string",
        "suggestion": "string"
      }
    ]
  }
}

PRESENTATION FEEDBACK STATUS:
- available: usable video measurements support specific observations.
- limited: some measurements exist, but they support only limited feedback.
- unavailable: no usable video measurements are available.

For every presentation observation:
- evidence must describe an actual supplied measurement or explicitly
  state that the advice is general rather than detected.
- suggestion must be actionable, supportive, and relevant.
- When measurements are unavailable, provide a short explanation and,
  if useful, general coaching tips clearly labelled as general advice.
- Do not present generic advice as something detected in this interview.

All numeric scores must be between 0 and 100.
Do not award credit for answers that were not provided.
Keep feedback specific and useful.

Interview answers:
${JSON.stringify(questionsAnswers)}

Local audio activity metrics (may be unavailable or noisy):
${JSON.stringify(audioMetrics)}

Local video metrics (may be unavailable or incomplete):
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
    !Array.isArray(evaluation.answerFeedback) ||
    !evaluation.presentationFeedback ||
    !["available", "limited", "unavailable"].includes(
      evaluation.presentationFeedback.status
    ) ||
    !Array.isArray(evaluation.presentationFeedback.observations)
  ) {
    throw new Error("Gemini returned an incomplete evaluation.");
  }

  return evaluation;
}
