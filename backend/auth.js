import "node:process";

const trimSlash = (value) =>
  String(value || "").trim().replace(/\/+$/, "");

export function supabaseConfig({ admin = false } = {}) {
  const url = trimSlash(process.env.SUPABASE_URL);
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim();

  if (!url || !anonKey || (admin && !serviceRoleKey)) {
    throw Object.assign(
      new Error(
        "Supabase is not configured. Check the Supabase settings in the project-root .env."
      ),
      { status: 503 }
    );
  }

  return { url, anonKey, serviceRoleKey };
}

async function adminRest(path, options = {}) {
  const { url, serviceRoleKey } = supabaseConfig({ admin: true });

  let response;

  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw Object.assign(
      new Error("Could not reach Supabase database."),
      { status: 503 }
    );
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.details ||
      data?.hint ||
      "Supabase database request failed.";

    throw Object.assign(new Error(message), {
      status: response.status >= 500 ? 503 : 400,
    });
  }

  return data;
}

export async function createUserProfile({ userId, email, fullName }) {
  return adminRest("profiles?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      login_id: email,
      full_name: fullName,
    }),
  });
}

export async function authorizeRegisteredUser(userId) {
  return adminRest("authorized_users?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      is_authorized: true,
    }),
  });
}

export async function deleteSupabaseUser(userId) {
  const { url, serviceRoleKey } = supabaseConfig({ admin: true });

  const response = await fetch(
    `${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw Object.assign(
      new Error("Could not roll back the incomplete Supabase account."),
      { status: 503 }
    );
  }
}

export async function authenticateEmail(email, password) {
  const { url, anonKey } = supabaseConfig();

  let response;

  try {
    response = await fetch(
      `${url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );
  } catch {
    throw Object.assign(
      new Error("Could not reach Supabase authentication."),
      { status: 503 }
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(
      new Error("Invalid email address or password."),
      { status: 401 }
    );
  }

  return result;
}

export async function verifyAuthorizedRequest(request) {
  const authorization =
    request.headers?.authorization ||
    request.headers?.Authorization ||
    "";

  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw Object.assign(
      new Error("Sign in to continue."),
      { status: 401 }
    );
  }

  const { url, anonKey } = supabaseConfig();

  let response;

  try {
    response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw Object.assign(
      new Error("Could not validate the signed-in session."),
      { status: 503 }
    );
  }

  const authUser = await response.json().catch(() => ({}));

  if (!response.ok || !authUser.id) {
    throw Object.assign(
      new Error(
        "Your session is invalid or has expired. Please sign in again."
      ),
      { status: 401 }
    );
  }

  const encodedUserId = encodeURIComponent(authUser.id);

  const accessRows = await adminRest(
    `authorized_users?select=is_authorized&user_id=eq.${encodedUserId}&limit=1`
  );

  if (
    !Array.isArray(accessRows) ||
    accessRows[0]?.is_authorized !== true
  ) {
    throw Object.assign(
      new Error(
        "This account is not authorized to access Smart Interview."
      ),
      { status: 403 }
    );
  }

  const profiles = await adminRest(
    `profiles?select=full_name&user_id=eq.${encodedUserId}&limit=1`
  );

  return {
    id: authUser.id,
    email: authUser.email || "",
    full_name:
      profiles?.[0]?.full_name ||
      authUser.user_metadata?.full_name ||
      "Student",
  };
}