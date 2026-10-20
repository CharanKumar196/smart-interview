
export async function evaluateInterview({
  interviewId,
  accessToken,
  audioMetrics = null,
  videoMetrics = null,
}) {
  if (!interviewId || !accessToken) {
    throw new Error("Interview ID and login session are required.");
  }

  const apiBase = import.meta.env.VITE_API_URL || "";

  const response = await fetch(
    `${apiBase}/api/interviews/${encodeURIComponent(interviewId)}/evaluate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        audioMetrics,
        videoMetrics,
      }),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Could not evaluate this interview."
    );
  }

  if (!result.evaluation) {
    throw new Error("The server returned no evaluation report.");
  }

  return result.evaluation;
}
