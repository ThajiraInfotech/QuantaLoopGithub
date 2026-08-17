/**
 * E2E verification: auth + onboarding API flows (email + Google error paths).
 * Usage: node src/scripts/verify-auth-onboarding-e2e.js
 *
 * Prerequisite: API server running on PORT from .env (default 5000).
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { loadEnv } = require("../config/env");
const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");
const { User } = require("../modules/users/user.model");
const {
  previewGoogleCredential,
  registerWithGoogle,
  googleAuthUser,
} = require("../modules/auth/auth.service");

const RUN_ID = Date.now().toString(36);
const PASSWORD = "FlowTest123!";
const API = `http://localhost:${process.env.PORT || 5000}/api/v1`;

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  process.stdout.write(`  ✓ ${label}\n`);
}

function fail(label, err) {
  failed += 1;
  process.stderr.write(`  ✗ ${label}: ${err}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function countParticipants() {
  return User.countDocuments({
    role: { $in: ["material_provider", "verified_buyer"] },
  });
}

async function countAdmins() {
  return User.countDocuments({ role: "admin" });
}

async function cleanupTestUsers(emails) {
  if (!emails.length) return;
  await User.deleteMany({ email: { $in: emails } });
}

async function testHttpEmailOnboardingFlow(testEmails) {
  process.stdout.write("\n── HTTP: email register → login → profile (onboarding) ──\n");

  const email = `e2e-flow-${RUN_ID}@test.local`;
  testEmails.push(email);

  const reg = await api("POST", "/auth/register", {
    name: "Flow Test User",
    companyName: `Flow Co ${RUN_ID}`,
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    role: "material_provider",
  });
  assert(reg.status === 201, `register expected 201, got ${reg.status}`);
  assert(reg.json?.success, "register success flag");
  assert(reg.json?.data?.accessToken, "register returns token");
  ok("POST /auth/register creates account");

  const token = reg.json.data.accessToken;

  const profilePatch = await api(
    "PATCH",
    "/profile/me",
    {
      preferredMaterialCategories: ["Plastic Waste"],
      materialsHandled: ["Plastic Waste"],
      state: "Tamil Nadu",
      stateCode: "TN",
      city: "Chennai",
      location: "Chennai",
    },
    token
  );
  assert(profilePatch.status === 200, `profile patch got ${profilePatch.status}`);
  ok("PATCH /profile/me saves onboarding-style profile");

  const login = await api("POST", "/auth/login", {
    email,
    password: PASSWORD,
  });
  assert(login.status === 200, `login expected 200, got ${login.status}`);
  assert(login.json?.data?.accessToken, "login returns token");
  ok("POST /auth/login works for registered user");

  const badLogin = await api("POST", "/auth/login", {
    email,
    password: "wrong-password",
  });
  assert(badLogin.status === 401, `bad login expected 401, got ${badLogin.status}`);
  ok("POST /auth/login rejects wrong password");

  const dup = await api("POST", "/auth/register", {
    name: "Dup",
    companyName: "Dup Co",
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    role: "material_provider",
  });
  assert(dup.status === 409, `duplicate register expected 409, got ${dup.status}`);
  ok("POST /auth/register rejects duplicate email");

  await cleanupTestUsers([email]);
  testEmails.pop();
  ok("cleaned up email flow test user");
}

async function testHttpGoogleLoginPaths() {
  process.stdout.write("\n── HTTP: Google login / preview error paths ──\n");

  const invalid = await api("POST", "/auth/google", {
    credential: "not-a-real-google-jwt",
    mode: "login",
  });
  assert(
    invalid.status === 401,
    `invalid google login expected 401, got ${invalid.status}`
  );
  ok("POST /auth/google (login) rejects invalid credential");

  const preview = await api("POST", "/auth/google/preview", {
    credential: "not-a-real-google-jwt",
  });
  assert(
    preview.status === 401,
    `invalid preview expected 401, got ${preview.status}`
  );
  ok("POST /auth/google/preview rejects invalid credential");

  const reg = await api("POST", "/auth/google/register", {
    credential: "not-a-real-google-jwt",
    name: "X",
    companyName: "Y",
    password: PASSWORD,
    confirmPassword: PASSWORD,
    role: "material_provider",
  });
  assert(reg.status === 401, `invalid google register expected 401, got ${reg.status}`);
  ok("POST /auth/google/register rejects invalid credential");
}

async function testServiceGoogleRegisterFlow(env, testEmails) {
  process.stdout.write("\n── Service: Google register (simulated verified token) ──\n");

  const { OAuth2Client } = require("google-auth-library");
  const email = `e2e-google-${RUN_ID}@test.local`;
  testEmails.push(email);

  const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;

  OAuth2Client.prototype.verifyIdToken = async function mockVerify() {
    return {
      getPayload: () => ({
        sub: `google-e2e-${RUN_ID}`,
        email,
        email_verified: true,
        name: "Google Flow User",
      }),
    };
  };

  try {
    const beforeCount = await countParticipants();
    const preview = await previewGoogleCredential(
      { credential: "mock-credential" },
      env
    );
    assert(preview.email === email, "preview returns email");
    assert(preview.name === "Google Flow User", "preview returns name");
    ok("previewGoogleCredential returns profile without creating user");

    const afterPreviewCount = await countParticipants();
    assert(
      afterPreviewCount === beforeCount,
      "google preview must not create a participant"
    );

    const session = await registerWithGoogle(
      {
        credential: "mock-credential",
        name: "Google Flow User",
        companyName: `Google Co ${RUN_ID}`,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        role: "verified_buyer",
      },
      env,
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN
    );
    assert(session.accessToken, "google register issues session");
    assert(session.user.email === email, "google register user email");
    assert(session.user.hasLocalPassword !== false, "google register sets password");
    ok("registerWithGoogle creates account with password (no auto-skip)");

    const loginAttempt = await googleAuthUser(
      { credential: "mock-credential", mode: "login" },
      env,
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN
    );
    assert(loginAttempt.user.email === email, "google login finds existing user");
    ok("googleAuthUser (login) signs in existing Google account");

    const previewAgain = await previewGoogleCredential(
      { credential: "mock-credential" },
      env
    ).catch((e) => e);
    assert(
      previewAgain?.code === "GOOGLE_ACCOUNT_EXISTS",
      "preview rejects existing account"
    );
    ok("previewGoogleCredential rejects when account already exists");

    await cleanupTestUsers([email]);
    testEmails.pop();
    ok("cleaned up google register test user");
  } finally {
    OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
  }
}

async function testGoogleLoginNoAccount(env) {
  process.stdout.write("\n── Service: Google login without account ──\n");

  const { OAuth2Client } = require("google-auth-library");
  const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
  const unknownEmail = `e2e-unknown-${RUN_ID}@test.local`;

  OAuth2Client.prototype.verifyIdToken = async function mockVerify() {
    return {
      getPayload: () => ({
        sub: `google-unknown-${RUN_ID}`,
        email: unknownEmail,
        email_verified: true,
        name: "Unknown User",
      }),
    };
  };

  try {
    const err = await googleAuthUser(
      { credential: "mock-unknown", mode: "login" },
      env,
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN
    ).catch((e) => e);

    assert(err?.code === "GOOGLE_ACCOUNT_NOT_FOUND", "login mode returns NOT_FOUND");
    assert(err?.details?.email === unknownEmail, "NOT_FOUND includes email for redirect");
    ok("googleAuthUser (login) returns GOOGLE_ACCOUNT_NOT_FOUND with email");

    const count = await User.countDocuments({ email: unknownEmail });
    assert(count === 0, "login mode does not auto-create user");
    ok("googleAuthUser (login) does not create account");
  } finally {
    OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
  }
}

async function main() {
  const testEmails = [];
  const env = loadEnv();

  process.stdout.write("\n══════════════════════════════════════════\n");
  process.stdout.write("  Auth & onboarding E2E verification\n");
  process.stdout.write("══════════════════════════════════════════\n");

  try {
    await fetch(`${API}/health`).catch(() => null);
  } catch {
    // health may not exist
  }

  try {
    const ping = await fetch(`${API.replace("/api/v1", "")}/`).catch(() => null);
    if (!ping) {
      process.stderr.write(
        "\nWarning: API may not be reachable at localhost. Start backend: npm run dev\n\n"
      );
    }
  } catch {
    /* ignore */
  }

  await connectSeedDatabase();

  const adminsBefore = await countAdmins();
  const participantsBefore = await countParticipants();
  process.stdout.write(
    `\nDB before tests: ${adminsBefore} admin(s), ${participantsBefore} participant(s)\n`
  );

  try {
    await testHttpEmailOnboardingFlow(testEmails);
    await testHttpGoogleLoginPaths();
    await testServiceGoogleRegisterFlow(env, testEmails);
    await testGoogleLoginNoAccount(env);
  } catch (err) {
    fail("unexpected", err.message);
  } finally {
    process.stdout.write("\n── Cleanup test users ──\n");
    await cleanupTestUsers(testEmails);
    ok(`removed ${testEmails.length} test email(s)`);

    const participantsAfter = await countParticipants();
    const adminsAfter = await countAdmins();
    process.stdout.write(
      `\nDB after cleanup: ${adminsAfter} admin(s), ${participantsAfter} participant(s)\n`
    );

    await disconnectSeedDatabase();
  }

  process.stdout.write("\n══════════════════════════════════════════\n");
  process.stdout.write(`  Results: ${passed} passed, ${failed} failed\n`);
  process.stdout.write("══════════════════════════════════════════\n\n");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err.message}\n`);
  process.exit(1);
});
