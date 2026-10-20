export async function getAuthorizedProfile(accessToken, apiBase = "") {
  const response = await fetch(`${apiBase}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || "Could not verify account access.");
    error.status = response.status;
    throw error;
  }

  return result.user;
}
