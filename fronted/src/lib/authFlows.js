import { getAuthorizedProfile } from "./authorizedApi.js";

export async function signInAuthorizedUser(
  client,
  email,
  password,
  getProfile = getAuthorizedProfile,
  apiBase = ""
) {
  let response;

  try {
    response = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password,
      }),
    });
  } catch {
    throw new Error(
      "Cannot reach the authentication server. Make sure the backend is running."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const authError = new Error(
      result.message || "Invalid email address or password."
    );
    authError.status = response.status;
    throw authError;
  }

  if (
    !result?.session?.access_token ||
    !result.session.refresh_token
  ) {
    throw new Error(
      "The authentication server did not return a valid session."
    );
  }

  const { data, error } = await client.auth.setSession(result.session);

  if (error) throw error;

  if (!data?.session?.access_token) {
    throw new Error("Supabase did not return a signed-in session.");
  }

  try {
    const profile = await getProfile(
      data.session.access_token,
      apiBase
    );

    return {
      session: data.session,
      user: data.user || result.user,
      profile,
    };
  } catch (authorizationError) {
    await client.auth.signOut();
    throw authorizationError;
  }
}

export async function signOutUser(client) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}