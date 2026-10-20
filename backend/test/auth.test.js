import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { after, before } from "node:test";
import { signInAuthorizedUser, signOutUser } from "../../fronted/src/lib/authFlows.js";
import { getAuthorizedProfile } from "../../fronted/src/lib/authorizedApi.js";

const usersByToken = {
  "authorized-token": { id: "11111111-1111-4111-8111-111111111111", email: "allowed@example.test", user_metadata: { full_name: "Allowed User" }, email_confirmed_at: "2026-01-01T00:00:00Z" },
  "unauthorized-token": { id: "22222222-2222-4222-8222-222222222222", email: "blocked@example.test", user_metadata: { full_name: "Blocked User" }, email_confirmed_at: "2026-01-01T00:00:00Z" },
};
const profilesByLoginId = {
  validlogin: { user_id: usersByToken["authorized-token"].id },
  blockeduser: { user_id: usersByToken["unauthorized-token"].id },
};
let mockSupabase;
let apiServer;
let mockUrl;
let apiUrl;
const authorizationRows = [];
const createdProfiles = [];
const registrationEvents = [];
let provisionVerifiedAccount;

before(async () => {
  mockSupabase = createServer(async (request, response) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const url = new URL(request.url, "http://supabase.test");
    const json = (status, body) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(body));
    };
    const readBody = async () => {
      let body = "";
      for await (const chunk of request) body += chunk;
      return JSON.parse(body || "{}");
    };

    if (request.method === "POST" && url.pathname === "/rest/v1/authorized_users") {
      const row = await readBody();
      registrationEvents.push("authorization");
      authorizationRows.push({
        row,
        usedServerKey: request.headers.apikey === "test-server-only-key",
        prefer: request.headers.prefer,
      });
      response.writeHead(201);
      response.end();
      return;
    }

    if (request.method === "POST" && url.pathname === "/rest/v1/profiles") {
      const row = await readBody();
      registrationEvents.push("profile");
      createdProfiles.push({
        row,
        usedServerKey: request.headers.apikey === "test-server-only-key",
        prefer: request.headers.prefer,
      });
      response.writeHead(201);
      response.end();
      return;
    }

    if (request.method === "POST" && url.pathname === "/auth/v1/admin/users") {
      const body = await readBody();
      registrationEvents.push("auth");
      const user = {
        id: "44444444-4444-4444-8444-444444444444",
        email: body.email,
        user_metadata: body.user_metadata,
        email_confirmed_at: "2026-01-01T00:00:00Z",
      };
      json(200, user);
      return;
    }

    if (request.method === "GET" && url.pathname === "/rest/v1/profiles") {
      const loginId = url.searchParams.get("login_id")?.replace(/^eq\./, "");
      return json(200, profilesByLoginId[loginId] ? [profilesByLoginId[loginId]] : []);
    }

    if (request.method === "GET" && url.pathname.startsWith("/auth/v1/admin/users/")) {
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      const user = Object.values(usersByToken).find((candidate) => candidate.id === id);
      return json(user ? 200 : 404, user || { message: "User not found" });
    }

    if (request.method === "POST" && url.pathname === "/auth/v1/token") {
      const { email, password } = await readBody();
      const match = Object.entries(usersByToken).find(([, user]) => user.email === email);
      if (password !== "password" || !match) return json(400, { message: "Invalid login credentials" });
      const [accessToken, user] = match;
      return json(200, {
        access_token: accessToken,
        refresh_token: `refresh-${accessToken}`,
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    }

    if (request.method === "GET" && url.pathname === "/auth/v1/user") {
      const user = usersByToken[token];
      return json(user ? 200 : 401, user || { message: "Invalid token" });
    }

    if (request.method === "GET" && url.pathname === "/rest/v1/authorized_users") {
      const user = usersByToken[token];
      const row = user?.id === usersByToken["authorized-token"].id
        ? [{ is_authorized: true }]
        : user?.id === usersByToken["unauthorized-token"].id
          ? [{ is_authorized: false }]
          : [];
      return json(200, row);
    }

    json(404, { message: "Not found" });
  });
  mockSupabase.listen(0, "127.0.0.1");
  await once(mockSupabase, "listening");
  mockUrl = `http://127.0.0.1:${mockSupabase.address().port}`;

  process.env.SUPABASE_URL = mockUrl;
  process.env.SUPABASE_ANON_KEY = "test-publishable-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server-only-key";
  const { createApiServer, provisionVerifiedAccount: provision } = await import("../index.js");
  provisionVerifiedAccount = provision;
  apiServer = createApiServer();
  apiServer.listen(0, "127.0.0.1");
  await once(apiServer, "listening");
  apiUrl = `http://127.0.0.1:${apiServer.address().port}`;
});

after(async () => {
  await Promise.all([
    apiServer && new Promise((resolve) => apiServer.close(resolve)),
    mockSupabase && new Promise((resolve) => mockSupabase.close(resolve)),
  ].filter(Boolean));
});

test("registration only grants access after OTP verification", async () => {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "new@example.test", name: "New Person", loginId: "newperson", password: "password123" }),
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).message, /Verify your email/);
  assert.equal(authorizationRows.length, 0);
});

test("successful verified registration saves a profile and automatically authorizes it", async () => {
  await provisionVerifiedAccount("new@example.test", "New Person", "newperson", "password123");
  const userId = "44444444-4444-4444-8444-444444444444";

  assert.deepEqual(createdProfiles.at(-1), {
    row: { user_id: userId, login_id: "newperson", full_name: "New Person" },
    usedServerKey: true,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  assert.deepEqual(authorizationRows.at(-1), {
    row: { user_id: userId, is_authorized: true },
    usedServerKey: true,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  assert.deepEqual(registrationEvents.slice(-3), ["auth", "profile", "authorization"]);
  assert.equal(JSON.stringify(createdProfiles.at(-1).row).includes("password"), false);
});

test("login ID and password authenticate through Supabase and return only authorized sessions", async () => {
  let storedSession = null;
  let signedOut = false;
  const client = {
    auth: {
      async setSession(session) {
        storedSession = session;
        return { data: { session, user: usersByToken["authorized-token"] }, error: null };
      },
      async signOut() {
        signedOut = true;
        return { error: null };
      },
    },
  };
  const result = await signInAuthorizedUser(client, "validlogin", "password", getAuthorizedProfile, apiUrl);
  assert.equal(result.profile.id, usersByToken["authorized-token"].id);
  assert.equal(result.user.email, "allowed@example.test");
  assert.equal(storedSession.access_token, "authorized-token");
  assert.equal(signedOut, false);
});

test("registered email and password can also be used to log in", async () => {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: " ALLOWED@example.test ", password: "password" }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.session.access_token, "authorized-token");
  assert.equal(result.user.email, "allowed@example.test");
});

test("invalid login ID or password is rejected by Supabase Auth", async () => {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "validlogin", password: "wrong-password" }),
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).message, /Invalid login ID or password/);
});

test("unauthorized users cannot log in or access private API routes", async () => {
  const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "blockeduser", password: "password" }),
  });
  assert.equal(loginResponse.status, 403);

  const apiResponse = await fetch(`${apiUrl}/api/me`, {
    headers: { Authorization: "Bearer unauthorized-token" },
  });
  assert.equal(apiResponse.status, 403);
});

test("backend ignores browser-supplied user IDs and guards private API routes", async () => {
  const spoofed = await fetch(`${apiUrl}/api/me?user_id=${usersByToken["authorized-token"].id}`, {
    headers: { Authorization: "Bearer unauthorized-token" },
  });
  assert.equal(spoofed.status, 403);

  const missingSession = await fetch(`${apiUrl}/api/private/example`);
  assert.equal(missingSession.status, 401);
});

test("logout clears the Supabase session", async () => {
  let signedOut = false;
  await signOutUser({ auth: { async signOut() { signedOut = true; return { error: null }; } } });
  assert.equal(signedOut, true);
});
