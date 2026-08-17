const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { overview, requestIntroduction } = require("./network.controller");

function createNetworkRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/overview", requireAuth, overview);
  router.post("/introduction-requests", requireAuth, requestIntroduction);

  return router;
}

module.exports = { createNetworkRouter };
