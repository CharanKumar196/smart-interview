import "node:process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { generateInterviewEvaluation } from "./evaluation.js";

import {
  authenticateEmail,
  authorizeRegisteredUser,
  createUserProfile,
  deleteSupabaseUser,
  supabaseConfig,
  verifyAuthorizedRequest,
} from "./auth.js";

const root = resolve(import.meta.dirname);
const port = Number(process.env.API_PORT || 3001);

const otpTtlMs = 10 * 60 * 1000;
const sendCooldownMs = 60 * 1000;
const maxAttempts = 5;

const otpChallenges = new Map();
const verifiedEmails = new Map();
const lastSendAt = new Map();

function loadLocalEnv() {
  const envPath = resolve(root, "..", ".env");

  return readFile(envPath, "utf8")
    .then((contents) => {
      for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#")) continue;

        const separator = line.indexOf("=");
        if (separator < 1) continue;

        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "");

        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    })
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
}

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const hashOtp = (email, otp) =>
  createHash("sha256").update(`${email}:${otp}`).digest();

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });

  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let raw = "";

  for await (const chunk of request) {
    raw += chunk;

    if (raw.length > 16_384) {
      throw Object.assign(new Error("Request is too large."), {
        status: 413,
      });
    }
  }

  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw Object.assign(
      new Error("Request body must be valid JSON."),
      { status: 400 }
    );
  }
}

async function createSupabaseUser({ email, name, password }) {
  const { url, serviceRoleKey } = supabaseConfig({ admin: true });

  let response;

  try {
    response = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      }),
    });
  } catch {
    throw Object.assign(
      new Error("Could not create the Supabase Auth account."),
      { status: 503 }
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result.msg || result.message || result.error_description;

    const status =
      response.status === 422 || response.status === 409
        ? 409
        : response.status >= 500
          ? 503
          : 400;

    throw Object.assign(
      new Error(
        status === 409
          ? "An account with this email already exists."
          : message || "Could not create the Supabase Auth account."
      ),
      { status }
    );
  }

  return result;
}

function createMailer() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !password) {
    throw Object.assign(
      new Error(
        "Email sending is not configured. Add SMTP_USER and SMTP_APP_PASSWORD to the project-root .env."
      ),
      { status: 503 }
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
}

async function sendOtp(email) {
  const now = Date.now();
  const lastSent = lastSendAt.get(email) || 0;

  if (now - lastSent < sendCooldownMs) {
    const seconds = Math.ceil(
      (sendCooldownMs - (now - lastSent)) / 1000
    );

    throw Object.assign(
      new Error(
        `Please wait ${seconds} seconds before requesting another code.`
      ),
      { status: 429 }
    );
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const transporter = createMailer();

  try {
    await transporter.sendMail({
      from:
        process.env.MAIL_FROM ||
        `Smart Interview <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Smart Interview verification code",
      text: `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:28px;color:#22243a">
          <h2>Verify your email</h2>
          <p>Enter this code to finish creating your Smart Interview account:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#f0edff;border-radius:12px;text-align:center;color:#5e46d4">${otp}</div>
          <p style="color:#888a9e">This code expires in 10 minutes. If you did not request it, ignore this message.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("OTP email delivery failed:", error.message);

    throw Object.assign(
      new Error(
        "Could not send the verification email. Check the Gmail app password and SMTP settings."
      ),
      { status: 502 }
    );
  }

  otpChallenges.set(email, {
    digest: hashOtp(email, otp),
    expiresAt: now + otpTtlMs,
    attempts: 0,
  });

  verifiedEmails.delete(email);
  lastSendAt.set(email, now);
}

async function verifyOtp(email, otp) {
  const challenge = otpChallenges.get(email);

  if (!challenge || challenge.expiresAt <= Date.now()) {
    otpChallenges.delete(email);

    throw Object.assign(
      new Error("That code has expired. Request a new one."),
      { status: 400 }
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    throw Object.assign(
      new Error("Enter the 6-digit code from your email."),
      { status: 400 }
    );
  }

  challenge.attempts += 1;

  const submittedDigest = hashOtp(email, otp);

  if (!timingSafeEqual(challenge.digest, submittedDigest)) {
    if (challenge.attempts >= maxAttempts) {
      otpChallenges.delete(email);
    }

    throw Object.assign(
      new Error(
        challenge.attempts >= maxAttempts
          ? "Too many incorrect attempts. Request a new code."
          : "That code is incorrect. Check the email and try again."
      ),
      { status: 400 }
    );
  }

  otpChallenges.delete(email);
  verifiedEmails.set(email, Date.now() + otpTtlMs);
}

export async function provisionVerifiedAccount(email, name, password) {
  if (!name || name.length > 100) {
    throw Object.assign(new Error("Enter a valid name."), {
      status: 400,
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw Object.assign(
      new Error("Password must be between 8 and 128 characters."),
      { status: 400 }
    );
  }

  const createdUser = await createSupabaseUser({
    email,
    name,
    password,
  });

  if (!createdUser.id) {
    throw Object.assign(
      new Error(
        "Supabase created an account without returning its user ID."
      ),
      { status: 503 }
    );
  }

  try {
    await createUserProfile({
      userId: createdUser.id,
      email,
      fullName: name,
    });

    await authorizeRegisteredUser(createdUser.id);
  } catch (error) {
    await deleteSupabaseUser(createdUser.id);
    throw error;
  }
}

async function registerAccount(email, name, password) {
  const verifiedUntil = verifiedEmails.get(email);

  if (!verifiedUntil || verifiedUntil <= Date.now()) {
    verifiedEmails.delete(email);

    throw Object.assign(
      new Error("Verify your email before creating an account."),
      { status: 403 }
    );
  }

  await provisionVerifiedAccount(email, name, password);
  verifiedEmails.delete(email);
}

async function handle(request, response) {
  const pathname = new URL(
    request.url,
    "http://localhost"
  ).pathname;

  console.log("API request:", request.method, pathname);

  if (request.method === "GET" && pathname === "/api/me") {
    const user = await verifyAuthorizedRequest(request);
    return sendJson(response, 200, { user });
  }

  const publicAuthRoute =
    request.method === "POST" &&
    [
      "/api/auth/send-otp",
      "/api/auth/verify-otp",
      "/api/auth/register",
      "/api/auth/login",
    ].includes(pathname);

  // Create an interview session.
  if (
    request.method === "POST" &&
    pathname === "/api/interviews"
  ) {
    const user = await verifyAuthorizedRequest(request);
    const payload = await readJson(request);

    const interviewType = String(payload.interviewType || "").trim();
    const difficulty = String(payload.difficulty || "").trim();
    const durationMinutes = Number(payload.durationMinutes);

    const allowedTypes = ["Technical", "HR", "Behavioral", "Mixed"];
    const allowedDifficulties = ["Easy", "Medium", "Hard"];

    if (
      !allowedTypes.includes(interviewType) ||
      !allowedDifficulties.includes(difficulty) ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 180
    ) {
      return sendJson(response, 400, {
        message: "Invalid interview settings.",
      });
    }

    const { url, serviceRoleKey } = supabaseConfig({ admin: true });

    const dbResponse = await fetch(`${url}/rest/v1/interviews`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: user.id,
        interview_type: interviewType,
        difficulty,
        duration_minutes: durationMinutes,
        status: "in_progress",
      }),
    });

    const result = await dbResponse.json().catch(() => []);

    if (!dbResponse.ok) {
      console.error("Create interview failed:", result);

      return sendJson(response, 500, {
        message: "Could not create the interview session.",
      });
    }

    return sendJson(response, 201, {
      interview: Array.isArray(result) ? result[0] : result,
    });
  }

  // Get the signed-in user's interview history.
  if (request.method === "GET" && pathname === "/api/interviews") {
    const user = await verifyAuthorizedRequest(request);
    const { url, serviceRoleKey } = supabaseConfig({ admin: true });

    const query = new URLSearchParams({
      select: "*",
      user_id: `eq.${user.id}`,
      order: "created_at.desc",
      limit: "50",
    });

    const dbResponse = await fetch(
      `${url}/rest/v1/interviews?${query.toString()}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const result = await dbResponse.json().catch(() => []);

    if (!dbResponse.ok) {
      console.error("Fetch interviews failed:", result);

      return sendJson(response, 500, {
        message: "Could not load interview history.",
      });
    }

    return sendJson(response, 200, {
      interviews: Array.isArray(result) ? result : [],
    });
  }

  // Complete an interview and save its answers.
  if (
    request.method === "PATCH" &&
    pathname.startsWith("/api/interviews/")
  ) {
    console.log("PATCH INTERVIEW ROUTE HIT:", pathname);

    const payload = await readJson(request);

    console.log(
      "ANSWERS RECEIVED BY BACKEND:",
      JSON.stringify(payload.questions_answers, null, 2)
    );

    if (
      !Array.isArray(payload.questions_answers) ||
      payload.questions_answers.length > 200
    ) {
      return sendJson(response, 400, {
        message: "Invalid interview answers.",
      });
    }

    if (
      payload.questions_answers.some(
        (item) =>
          !item ||
          typeof item.question !== "string" ||
          typeof item.answer !== "string"
      )
    ) {
      return sendJson(response, 400, {
        message: "Each answer must include a question and answer.",
      });
    }

    const user = await verifyAuthorizedRequest(request);
    const interviewId = pathname.split("/").pop();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        interviewId
      )
    ) {
      return sendJson(response, 400, {
        message: "Invalid interview ID.",
      });
    }

    const { url, serviceRoleKey } = supabaseConfig({ admin: true });

    const query = new URLSearchParams({
      id: `eq.${interviewId}`,
      user_id: `eq.${user.id}`,
      status: "eq.in_progress",
      select: "id,status,completed_at,questions_answers",
    });

    const dbResponse = await fetch(
      `${url}/rest/v1/interviews?${query.toString()}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          questions_answers: payload.questions_answers,
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      }
    );

    const result = await dbResponse.json().catch(() => []);

    console.log("SUPABASE UPDATE STATUS:", dbResponse.status);
    console.log(
      "SUPABASE UPDATE RESULT:",
      JSON.stringify(result, null, 2)
    );

    if (!dbResponse.ok) {
      console.error("Complete interview failed:", result);

      return sendJson(response, 500, {
        message: "Could not complete the interview.",
      });
    }

    if (!Array.isArray(result) || result.length === 0) {
      console.error(
        "No interview row was updated. Check interview ID, user ID, and status.",
        { interviewId, userId: user.id, result }
      );

      return sendJson(response, 404, {
        message: "No active interview was found to complete.",
      });
    }

    return sendJson(response, 200, {
      interview: result[0],
    });
  }

  
  // Generate and save AI evaluation for a completed interview.
  if (
    request.method === "POST" &&
    /^\/api\/interviews\/[^/]+\/evaluate$/.test(pathname)
  ) {
    const user = await verifyAuthorizedRequest(request);
    const interviewId = pathname.split("/")[3];

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        interviewId
      )
    ) {
      return sendJson(response, 400, {
        message: "Invalid interview ID.",
      });
    }

    const payload = await readJson(request);
    const { url, serviceRoleKey } = supabaseConfig({ admin: true });

    // Load the interview belonging to the authenticated user.
    const query = new URLSearchParams({
      id: `eq.${interviewId}`,
      user_id: `eq.${user.id}`,
      status: "eq.completed",
      select: "id,interview_type,difficulty,questions_answers,overall_score,scores,ai_feedback",
    });

    const interviewResponse = await fetch(
      `${url}/rest/v1/interviews?${query.toString()}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const interviews = await interviewResponse.json().catch(() => []);

    if (!interviewResponse.ok) {
      console.error("Load interview for evaluation failed:", interviews);

      return sendJson(response, 500, {
        message: "Could not load the completed interview.",
      });
    }

    if (!Array.isArray(interviews) || interviews.length === 0) {
      return sendJson(response, 404, {
        message: "No completed interview was found for your account.",
      });
    }

    const interview = interviews[0];

    if (
      !Array.isArray(interview.questions_answers) ||
      interview.questions_answers.length === 0
    ) {
      return sendJson(response, 400, {
        message: "This interview has no answers to evaluate.",
      });
    }

    // Avoid accidental duplicate Gemini calls for an already evaluated interview.
    if (
      interview.ai_feedback &&
      typeof interview.overall_score === "number"
    ) {
      return sendJson(response, 200, {
        evaluation: {
          overallScore: interview.overall_score,
          scores: interview.scores,
          ...interview.ai_feedback,
        },
        alreadyEvaluated: true,
      });
    }

    const evaluation = await generateInterviewEvaluation({
      interviewType: interview.interview_type,
      difficulty: interview.difficulty,
      questionsAnswers: interview.questions_answers,
      audioMetrics: payload.audioMetrics ?? null,
      videoMetrics: payload.videoMetrics ?? null,
    });

    // Persist only validated evaluation data.
    const updateQuery = new URLSearchParams({
      id: `eq.${interviewId}`,
      user_id: `eq.${user.id}`,
      status: "eq.completed",
      select: "id",
    });

    const updateResponse = await fetch(
      `${url}/rest/v1/interviews?${updateQuery.toString()}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          overall_score: evaluation.overallScore,
          scores: evaluation.scores,
          ai_feedback: {
            summary: evaluation.summary,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            answerFeedback: evaluation.answerFeedback,
          },
        }),
      }
    );

    const updatedRows = await updateResponse.json().catch(() => []);

    if (!updateResponse.ok) {
      console.error("Save interview evaluation failed:", updatedRows);

      return sendJson(response, 500, {
        message: "The evaluation was generated but could not be saved.",
      });
    }

    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      return sendJson(response, 409, {
        message: "The interview could not be updated. Please refresh and retry.",
      });
    }

    return sendJson(response, 200, {
      evaluation,
      alreadyEvaluated: false,
    });
  }


  // Reject unmatched API routes.
  if (pathname.startsWith("/api/") && !publicAuthRoute) {
    await verifyAuthorizedRequest(request);

    return sendJson(response, 404, {
      message: "API route not found.",
    });
  }

  if (!publicAuthRoute) {
    return sendJson(response, 405, {
      message: "Method not allowed.",
    });
  }

  const payload = await readJson(request);
  const email = normalizeEmail(payload.email);

  if (pathname === "/api/auth/login") {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof payload.password !== "string"
    ) {
      return sendJson(response, 401, {
        message: "Invalid email address or password.",
      });
    }

    const session = await authenticateEmail(email, payload.password);

    await verifyAuthorizedRequest({
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
    });

    return sendJson(response, 200, {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
      user: session.user,
    });
  }

  if (pathname === "/api/auth/send-otp") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(response, 400, {
        message: "Enter a valid email address.",
      });
    }

    await sendOtp(email);

    return sendJson(response, 200, {
      message: "Verification code sent.",
    });
  }

  if (pathname === "/api/auth/verify-otp") {
    await verifyOtp(email, String(payload.otp || "").trim());

    return sendJson(response, 200, {
      message: "Email verified.",
    });
  }

  if (pathname === "/api/auth/register") {
    await registerAccount(
      email,
      String(payload.name || "").trim(),
      payload.password
    );

    return sendJson(response, 201, {
      message: "Account created.",
    });
  }

  return sendJson(response, 404, {
    message: "API route not found.",
  });
}

export function createApiServer() {
  return createServer((request, response) => {
    handle(request, response).catch((error) => {
      const status = error.status || 500;

      if (status >= 500) {
        console.error("API error:", error);
      }

      sendJson(response, status, {
        message: error.message || "Unexpected server error.",
      });
    });
  });
}

await loadLocalEnv();

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const server = createApiServer();

  server.listen(port, () => {
    console.log(
      `Smart Interview API listening on http://localhost:${port}`
    );

    if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
      console.log(
        "Email is not configured yet. Add SMTP_USER and SMTP_APP_PASSWORD to the project-root .env."
      );
    }

    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.log(
        "Supabase is not configured yet. Add Supabase settings to the project-root .env."
      );
    }
  });
}