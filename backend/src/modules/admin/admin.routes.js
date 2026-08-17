const express = require("express");

const { authenticate, authorize } = require("../../middleware/auth");
const {
  getDashboard,
  getParticipants,
  getParticipant,
  patchParticipant,
  getReports,
  getReport,
  getMaterials,
  getMaterial,
  patchMaterial,
  postMaterialsBulk,
  getInterests,
  getInterest,
} = require("./admin.controller");

function createAdminRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  const adminOnly = authorize("admin");

  router.get("/dashboard", requireAuth, adminOnly, getDashboard);
  router.get("/participants", requireAuth, adminOnly, getParticipants);
  router.get(
    "/participants/:userId",
    requireAuth,
    adminOnly,
    getParticipant
  );
  router.patch(
    "/participants/:userId",
    requireAuth,
    adminOnly,
    patchParticipant
  );
  router.get("/reports", requireAuth, adminOnly, getReports);
  router.get("/reports/:reportId", requireAuth, adminOnly, getReport);
  router.get("/materials", requireAuth, adminOnly, getMaterials);
  router.post("/materials/bulk", requireAuth, adminOnly, postMaterialsBulk);
  router.get("/materials/:materialId", requireAuth, adminOnly, getMaterial);
  router.patch("/materials/:materialId", requireAuth, adminOnly, patchMaterial);
  router.get("/interests", requireAuth, adminOnly, getInterests);
  router.get("/interests/:interestId", requireAuth, adminOnly, getInterest);

  return router;
}

module.exports = { createAdminRouter };
