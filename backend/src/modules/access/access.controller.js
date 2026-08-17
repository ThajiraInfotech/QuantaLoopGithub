const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const PLANS = {
  tiers: [
    {
      id: "early_access",
      name: "Early access",
      positioning: "Founding participant positioning on the network.",
      highlight: "Invitation-based rollout",
    },
    {
      id: "network_access",
      name: "Network access",
      positioning:
        "India and global material discovery, matching, and recovery opportunity access.",
      highlight: "India + global network",
    },
    {
      id: "enterprise_access",
      name: "Enterprise access",
      positioning: "Reserved for policy depth and integration scope.",
      highlight: "Future-ready",
    },
  ],
  anchor: {
    headline: "Recover value from what your operations already produce",
    subtext:
      "Access industrial demand and relevant recovery opportunities across India and global markets.",
    annualInr: 6999,
    dailyInrApprox: 19.2,
    rationale:
      "One successful recovery opportunity can cover years of access.",
  },
};

const getPlans = asyncHandler(async (req, res) => {
  sendSuccess(res, PLANS, "Access positioning retrieved");
});

module.exports = { getPlans };
