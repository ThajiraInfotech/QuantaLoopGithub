const express = require("express");

const {
  getPublicInsights,
  getPublicInsight,
} = require("./content-insight.controller");

function createContentInsightsRouter() {
  const router = express.Router();
  router.get("/", getPublicInsights);
  router.get("/:slug", getPublicInsight);
  return router;
}

module.exports = { createContentInsightsRouter };
