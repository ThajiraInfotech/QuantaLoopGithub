const express = require("express");
const rateLimit = require("express-rate-limit");

const { authenticate } = require("../../middleware/auth");
const { createSupportController } = require("./support.controller");

function optionalAuthenticate(env) {
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  return (req, res, next) => {
    const header = req.headers.authorization;
    const bearer =
      header && header.startsWith("Bearer ") ? header.slice(7) : null;
    const cookieToken = req.cookies?.ql_at;
    if (!bearer && !cookieToken) {
      next();
      return;
    }
    requireAuth(req, res, (err) => {
      // Invalid/expired tokens should not block public support submissions
      if (err) {
        next();
        return;
      }
      next();
    });
  };
}

function createSupportRouter(env) {
  const router = express.Router();
  const controller = createSupportController();

  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many support requests. Please try again later.",
      data: null,
      error: {
        message: "Too many support requests. Please try again later.",
        code: "RATE_LIMITED",
      },
    },
  });

  router.post(
    "/contact",
    contactLimiter,
    optionalAuthenticate(env),
    controller.submitContact
  );

  return router;
}

module.exports = { createSupportRouter };
