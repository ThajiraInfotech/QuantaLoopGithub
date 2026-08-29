const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/AppError");
const {
  registerBodySchema,
  loginBodySchema,
  googleAuthBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
  resendVerificationBodySchema,
  completeAccountSetupBodySchema,
  googlePreviewBodySchema,
  googleRegisterBodySchema,
  parseBody,
} = require("../../validations/auth.validation");
const {
  registerUser,
  loginUser,
  googleAuthUser,
  previewGoogleCredential,
  registerWithGoogle,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyEmailWithOtp,
  resendVerificationEmail,
  completeAccountSetup,
  cancelUnpaidSignup,
} = require("./auth.service");

const ACCESS_COOKIE = "ql_at";
const COOKIE_MAX_AGE_DEFAULT_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_MAX_AGE_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

function resolveSessionDuration(env, rememberMe) {
  if (rememberMe) {
    return {
      cookieMaxAge: COOKIE_MAX_AGE_REMEMBER_MS,
      jwtExpiresIn: env.JWT_REMEMBER_EXPIRES_IN,
    };
  }

  return {
    cookieMaxAge: COOKIE_MAX_AGE_DEFAULT_MS,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  };
}

function setAuthCookie(res, token, isProduction, maxAge) {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

function clearAuthCookie(res, isProduction) {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function sendAuthSuccess(res, session, isProduction, rememberMe, env) {
  const { cookieMaxAge, jwtExpiresIn } = resolveSessionDuration(env, rememberMe);
  setAuthCookie(res, session.accessToken, isProduction, cookieMaxAge);

  res.json({
    success: true,
    data: {
      user: session.user,
      accessToken: session.accessToken,
      needsOnboarding: session.needsOnboarding,
      needsAccountSetup: session.needsAccountSetup,
      needsEmailVerification: session.needsEmailVerification,
      expiresIn: jwtExpiresIn,
    },
  });
}

function createAuthController(env) {
  const jwtSecret = env.JWT_SECRET;
  const isProduction = env.NODE_ENV === "production";

  const register = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(registerBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const session = await registerUser(
      parsed.data,
      jwtSecret,
      env.JWT_EXPIRES_IN,
      env
    );
    setAuthCookie(
      res,
      session.accessToken,
      isProduction,
      COOKIE_MAX_AGE_DEFAULT_MS
    );

    res.status(201).json({
      success: true,
      data: {
        user: session.user,
        accessToken: session.accessToken,
        needsOnboarding: session.needsOnboarding,
        needsEmailVerification: session.needsEmailVerification,
      },
    });
  });

  const login = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(loginBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const { rememberMe, ...credentials } = parsed.data;
    const { cookieMaxAge, jwtExpiresIn } = resolveSessionDuration(
      env,
      rememberMe
    );

    const session = await loginUser(credentials, jwtSecret, jwtExpiresIn);
    sendAuthSuccess(res, session, isProduction, rememberMe, env);
  });

  const googleAuth = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(googleAuthBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const { rememberMe, credential, mode } = parsed.data;
    const { jwtExpiresIn } = resolveSessionDuration(env, rememberMe);

    const session = await googleAuthUser(
      { credential, mode },
      env,
      jwtSecret,
      jwtExpiresIn
    );
    sendAuthSuccess(res, session, isProduction, rememberMe, env);
  });

  const googlePreview = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(googlePreviewBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const profile = await previewGoogleCredential(parsed.data, env);
    res.json({ success: true, data: profile });
  });

  const googleRegister = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(googleRegisterBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const session = await registerWithGoogle(
      parsed.data,
      env,
      jwtSecret,
      env.JWT_EXPIRES_IN
    );

    res.status(201).json({
      success: true,
      data: {
        user: session.user,
        accessToken: session.accessToken,
        needsOnboarding: session.needsOnboarding,
        needsEmailVerification: session.needsEmailVerification,
      },
    });
  });

  const forgotPassword = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(forgotPasswordBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const result = await requestPasswordReset(parsed.data.email, env);
    res.json({ success: true, data: result });
  });

  const resetPassword = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(resetPasswordBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const result = await resetPasswordWithOtp(parsed.data);
    res.json({ success: true, data: result });
  });

  const verifyEmail = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(verifyEmailBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const result = await verifyEmailWithOtp(parsed.data.code);
    res.json({ success: true, data: result });
  });

  const resendVerification = asyncHandler(async (req, res, next) => {
    if (req.user?.id) {
      const result = await resendVerificationEmail(req.user.id, env);
      res.json({ success: true, data: result });
      return;
    }

    const parsed = parseBody(resendVerificationBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const user = await require("../users/user.model").User.findOne({
      email: parsed.data.email.toLowerCase().trim(),
    });

    if (user) {
      await resendVerificationEmail(user._id.toString(), env);
    }

    res.json({
      success: true,
      data: {
        message:
          "If your account requires verification, a new email has been sent.",
      },
    });
  });

  const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res, isProduction);
    res.status(204).send();
  });

  const completeAccountSetupHandler = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(completeAccountSetupBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const session = await completeAccountSetup(
      req.user.id,
      parsed.data,
      jwtSecret,
      env.JWT_EXPIRES_IN
    );
    sendAuthSuccess(res, session, isProduction, false, env);
  });

  const cancelSignup = asyncHandler(async (req, res) => {
    const result = await cancelUnpaidSignup(req.user.id);
    clearAuthCookie(res, isProduction);
    res.json({ success: true, data: result });
  });

  return {
    register,
    login,
    cancelSignup,
    googleAuth,
    googlePreview,
    googleRegister,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    logout,
    completeAccountSetup: completeAccountSetupHandler,
  };
}

module.exports = { createAuthController };
