const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  requireActiveSubscription,
} = require("../../middleware/requireActiveSubscription");
const {
  getMyProfile,
  patchMyProfile,
  getProfileById,
} = require("./profile.controller");

function createProfileRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  const requirePaidForOtherProfile = (req, res, next) => {
    if (String(req.params.id) === String(req.user.id)) {
      next();
      return;
    }
    requireActiveSubscription(req, res, next);
  };

  router.get("/me", requireAuth, getMyProfile);
  router.patch("/me", requireAuth, patchMyProfile);
  router.get(
    "/:id",
    requireAuth,
    requirePaidForOtherProfile,
    getProfileById
  );

  return router;
}

module.exports = { createProfileRouter };
