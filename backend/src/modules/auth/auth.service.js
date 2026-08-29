const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const { User, toPublicJSON } = require("../users/user.model");
const { AppError } = require("../../utils/AppError");
const { signAccessToken } = require("../../utils/jwt");
const {
  userNeedsOnboarding,
  userNeedsAccountSetup,
} = require("../../utils/onboardingStatus");
const {
  sendPasswordResetOtpEmail,
  sendEmailVerificationEmail,
} = require("../../services/email/email.service");
const {
  userHasPaidMembership,
} = require("../subscriptions/paid-participants");

const SALT_ROUNDS = 12;
const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;

const { normalizeCategoryList } = require("../../utils/materialCategories");

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function buildAuthPayload(user) {
  const publicUser = toPublicJSON(user);
  const isGoogleAccount =
    publicUser.authProvider === "google" || Boolean(publicUser.googleEmailVerified);
  return {
    user: publicUser,
    needsOnboarding: userNeedsOnboarding(user),
    needsAccountSetup: userNeedsAccountSetup(user),
    // Google identity is already trusted — never require email OTP.
    needsEmailVerification: !isGoogleAccount && publicUser.emailVerified === false,
  };
}

async function issueSession(user, jwtSecret, jwtExpiresIn) {
  const accessToken = signAccessToken(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    jwtExpiresIn
  );

  return {
    ...buildAuthPayload(user),
    accessToken,
  };
}

function generateEmailVerificationOtp() {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

async function createEmailVerificationOtp(user) {
  const otp = generateEmailVerificationOtp();
  user.emailVerificationToken = hashToken(otp);
  user.emailVerificationExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  return otp;
}

async function sendVerificationEmailForUser(user, env) {
  const otp = await createEmailVerificationOtp(user);
  await sendEmailVerificationEmail(env, {
    to: user.email,
    otp,
  });
}

async function discardUnpaidAccountForReregister(existing) {
  if (!existing) return;
  try {
    await cancelUnpaidSignup(existing._id);
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.code === "SUBSCRIPTION_ALREADY_PAID" ||
        error.code === "ADMIN_ACCOUNT")
    ) {
      throw new AppError("Email already registered", 409, "EMAIL_IN_USE");
    }
    throw error;
  }
}

async function registerUser(input, jwtSecret, jwtExpiresIn, env) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    await discardUnpaidAccountForReregister(existing);
  }

  const role = input.role ?? "material_provider";
  const preferredMaterialCategories =
    role === "material_provider"
      ? normalizeCategoryList(
          input.preferredMaterialCategories ?? input.materialTypes ?? []
        )
      : [];
  const requiredMaterialCategories =
    role === "verified_buyer"
      ? normalizeCategoryList(
          input.requiredMaterialCategories ?? input.materialTypes ?? []
        )
      : [];
  const materialTypes =
    role === "verified_buyer"
      ? requiredMaterialCategories
      : preferredMaterialCategories;
  const city = (input.city ?? input.location ?? "").toString().trim();
  const country =
    (input.country ?? "IN").toString().trim().toUpperCase() || "IN";
  const state = (input.state ?? "").toString().trim();
  const stateCode = (input.stateCode ?? "").toString().trim();
  const operationalLocation =
    country !== "IN"
      ? country
      : state && city
        ? `${state} · ${city}`
        : state || city;

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    companyName: input.companyName,
    email: input.email,
    password: hashed,
    authProvider: "local",
    hasLocalPassword: true,
    emailVerified: false,
    googleEmailVerified: false,
    role,
    industryType: input.industryType ?? "",
    materialTypes,
    preferredMaterialCategories,
    requiredMaterialCategories,
    location: city,
    country,
    state,
    stateCode,
    operationalLocation,
    termsAcceptedAt: new Date(),
    termsVersion: input.termsVersion || null,
  });

  // Create OTP in DB quickly, then send email in the background so register
  // returns immediately and the client can open the OTP screen without SMTP lag.
  try {
    const otp = await createEmailVerificationOtp(user);
    void sendEmailVerificationEmail(env, { to: user.email, otp }).catch(
      (err) => {
        process.stderr.write(
          `Verification email failed for ${user.email}: ${err?.message || err}\n`
        );
      }
    );
  } catch (err) {
    process.stderr.write(
      `Verification OTP create failed for ${user.email}: ${err?.message || err}\n`
    );
  }

  return issueSession(user, jwtSecret, jwtExpiresIn);
}

async function loginUser({ email, password }, jwtSecret, jwtExpiresIn) {
  const user = await User.findOne({
    email: String(email || "")
      .toLowerCase()
      .trim(),
  }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  if (!user.hasLocalPassword || !user.password) {
    throw new AppError(
      "This account uses Google Sign-In. Continue with Google or set a password from the sign-in page.",
      401,
      "GOOGLE_ONLY_ACCOUNT"
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  if (user.accountStatus === "suspended") {
    throw new AppError("Account suspended", 403, "ACCOUNT_SUSPENDED");
  }

  user.loginCount = (user.loginCount ?? 0) + 1;
  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user, jwtSecret, jwtExpiresIn);
}

async function verifyGoogleIdToken(credential, env) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google sign-in is not configured", 503, "GOOGLE_NOT_CONFIGURED");
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError("Invalid Google credential", 401, "INVALID_GOOGLE_TOKEN");
  }

  if (!payload?.email || !payload.email_verified) {
    throw new AppError("Google account email is not verified", 401, "GOOGLE_EMAIL_UNVERIFIED");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: (payload.name ?? payload.email.split("@")[0]).trim(),
  };
}

async function previewGoogleCredential({ credential }, env) {
  const { googleId, email, name } = await verifyGoogleIdToken(credential, env);

  const existing =
    (await User.findOne({ googleId })) ||
    (await User.findOne({ email }));

  if (existing) {
    const paid =
      existing.role === "admin" ||
      (await userHasPaidMembership(existing._id));
    if (paid) {
      throw new AppError(
        "An account already exists for this Google email. Sign in instead.",
        409,
        "GOOGLE_ACCOUNT_EXISTS",
        { email }
      );
    }
  }

  return { email, name };
}

async function registerWithGoogle(input, env, jwtSecret, jwtExpiresIn) {
  const { googleId, email } = await verifyGoogleIdToken(
    input.credential,
    env
  );

  const existing =
    (await User.findOne({ googleId })) ||
    (await User.findOne({ email }));

  if (existing) {
    await discardUnpaidAccountForReregister(existing);
  }

  const role = input.role ?? "material_provider";
  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name.trim(),
    companyName: input.companyName.trim(),
    email,
    password: hashed,
    authProvider: "google",
    googleId,
    hasLocalPassword: true,
    emailVerified: true,
    googleEmailVerified: true,
    role,
    termsAcceptedAt: new Date(),
    termsVersion: input.termsVersion || null,
  });

  return issueSession(user, jwtSecret, jwtExpiresIn);
}

async function googleAuthUser(
  { credential, mode = "login" },
  env,
  jwtSecret,
  jwtExpiresIn
) {
  const { googleId, email, name: displayName } = await verifyGoogleIdToken(
    credential,
    env
  );

  let user =
    (await User.findOne({ googleId })) ||
    (await User.findOne({ email }));

  if (user) {
    if (user.accountStatus === "suspended") {
      throw new AppError("Account suspended", 403, "ACCOUNT_SUSPENDED");
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    user.googleEmailVerified = true;
    user.emailVerified = true;
    user.loginCount = (user.loginCount ?? 0) + 1;
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    if (mode === "login") {
      throw new AppError(
        "No account found for this Google email. Complete onboarding to create your account.",
        404,
        "GOOGLE_ACCOUNT_NOT_FOUND",
        { email }
      );
    }

    throw new AppError(
      "Use the sign-up form to create an account with Google.",
      400,
      "GOOGLE_SIGNUP_REQUIRES_FORM"
    );
  }

  return issueSession(user, jwtSecret, jwtExpiresIn);
}

async function requestPasswordReset(email, env) {
  const genericMessage =
    "If an account exists for that email, a one-time code has been sent.";

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordResetToken +passwordResetExpiresAt"
  );

  if (!user) {
    return { message: genericMessage };
  }

  const otp = generateEmailVerificationOtp();
  user.passwordResetToken = hashToken(otp);
  user.passwordResetExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  const deliveryEmail =
    user.role === "admin" && env.ADMIN_OTP_FORWARD_EMAIL
      ? env.ADMIN_OTP_FORWARD_EMAIL
      : user.email;

  await sendPasswordResetOtpEmail(env, {
    to: deliveryEmail,
    otp,
  });

  return {
    message: genericMessage,
    otpSentTo: deliveryEmail,
  };
}

async function resetPasswordWithOtp({ email, code, password }) {
  const hashedOtp = hashToken(String(code).trim());
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.findOneAndUpdate(
    {
      email: normalizedEmail,
      passwordResetToken: hashedOtp,
      passwordResetExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        password: hashedPassword,
        hasLocalPassword: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    },
    { new: true }
  ).select("+password");

  if (!user) {
    throw new AppError(
      "Invalid or expired reset code",
      400,
      "INVALID_RESET_CODE"
    );
  }

  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    throw new AppError(
      "Password could not be updated. Please try again.",
      500,
      "PASSWORD_UPDATE_FAILED"
    );
  }

  return {
    message: "Your password has been updated successfully.",
  };
}

async function verifyEmailWithOtp(code) {
  const hashedOtp = hashToken(String(code).trim());

  const user = await User.findOne({
    emailVerificationToken: hashedOtp,
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpiresAt");

  if (!user) {
    throw new AppError(
      "Invalid or expired verification code",
      400,
      "INVALID_VERIFICATION_CODE"
    );
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  return {
    message: "Your email has been verified successfully.",
    user: toPublicJSON(user),
  };
}

async function completeAccountSetup(
  userId,
  input,
  jwtSecret,
  jwtExpiresIn
) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (user.hasLocalPassword) {
    throw new AppError(
      "Account already has a password set",
      409,
      "PASSWORD_ALREADY_SET"
    );
  }

  if (userNeedsOnboarding(user)) {
    throw new AppError(
      "Complete material categories and location before finishing account setup",
      400,
      "ONBOARDING_INCOMPLETE"
    );
  }

  user.name = input.name.trim();
  user.companyName = input.companyName.trim();
  user.role = input.role;

  if (input.role === "verified_buyer") {
    const categories = normalizeCategoryList(
      user.requiredMaterialCategories ?? user.materialTypes ?? []
    );
    user.requiredMaterialCategories = categories;
    user.materialTypes = categories;
  } else {
    const categories = normalizeCategoryList(
      user.preferredMaterialCategories ?? user.materialTypes ?? []
    );
    user.preferredMaterialCategories = categories;
    user.materialTypes = categories;
  }

  user.password = await bcrypt.hash(input.password, SALT_ROUNDS);
  user.hasLocalPassword = true;
  if (!user.termsAcceptedAt) {
    user.termsAcceptedAt = new Date();
    user.termsVersion = input.termsVersion || user.termsVersion || null;
  }
  await user.save();

  return issueSession(user, jwtSecret, jwtExpiresIn);
}

async function resendVerificationEmail(userId, env) {
  const user = await User.findById(userId).select(
    "+emailVerificationToken +emailVerificationExpiresAt"
  );

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (user.emailVerified) {
    return { message: "Email is already verified." };
  }

  if (user.googleEmailVerified) {
    user.emailVerified = true;
    await user.save();
    return { message: "Email is already verified." };
  }

  await sendVerificationEmailForUser(user, env);
  return {
    message: "If your account requires verification, a new email has been sent.",
  };
}

/**
 * Discards a signup that never paid, so the person can start over from the
 * first onboarding screen. Refuses once money has moved: a member who paid must
 * never lose their account through the abandon-signup path.
 */
async function cancelUnpaidSignup(userId) {
  const { Subscription } = require("../subscriptions/subscription.model");
  const {
    findPaidSubscription,
  } = require("../subscriptions/paid-participants");

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  if (user.role === "admin") {
    throw new AppError(
      "Admin accounts cannot be removed here",
      403,
      "ADMIN_ACCOUNT"
    );
  }

  const paidSubscription = await findPaidSubscription(user._id);

  if (paidSubscription) {
    throw new AppError(
      "This membership has been paid for and cannot be discarded",
      409,
      "SUBSCRIPTION_ALREADY_PAID"
    );
  }

  await Subscription.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });

  return { message: "Signup discarded. You can start again any time." };
}

module.exports = {
  registerUser,
  loginUser,
  cancelUnpaidSignup,
  googleAuthUser,
  previewGoogleCredential,
  registerWithGoogle,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyEmailWithOtp,
  resendVerificationEmail,
  completeAccountSetup,
};
