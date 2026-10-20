
import "./index.js";

const apiKey = process.env.GEMINI_API_KEY;
const model = "gemini-3.5-flash-lite";

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing.");
  process.exitCode = 1;
} else {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Reply with exactly: Gemini connection successful." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 30,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      console.error(
        result.error?.message || "Check the model, API key, and API access."
      );
      process.exitCode = 1;
    } else {
      const reply =
        result.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

      console.log("Gemini API connection successful.");
      console.log("Model:", model);
      console.log("Test reply:", reply || "(No text returned)");
    }
  } catch (error) {
    console.error("Could not reach Gemini:", error.message);
    process.exitCode = 1;
  }
}
