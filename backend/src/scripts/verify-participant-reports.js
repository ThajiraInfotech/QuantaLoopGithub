/**
 * E2E verification: participant report flow (buyer + provider → admin hub).
 * Usage: node src/scripts/verify-participant-reports.js
 */
require("dotenv").config();

const BASE = process.env.API_BASE || "http://localhost:5000/api/v1";
const PASSWORD = process.env.SEED_DEMO_PASSWORD || "SeedDemo123!";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

async function login(email) {
  const { ok, status, json } = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  if (!ok) {
    throw new Error(`Login failed for ${email}: ${status} ${JSON.stringify(json)}`);
  }
  return {
    token: json.data.accessToken,
    user: json.data.user,
  };
}

async function createParticipantReport(token, targetUserId, label) {
  const { ok, status, json } = await request("/reports", {
    method: "POST",
    token,
    body: {
      targetType: "participant",
      targetUserId,
      reason: "inactive_participant",
      details: `E2E participant report verification — ${label}`,
    },
  });
  if (!ok) {
    throw new Error(`Create report failed (${label}): ${status} ${JSON.stringify(json)}`);
  }
  return json.data.report;
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  process.stdout.write(`  ✓ ${message}\n`);
}

async function main() {
  process.stdout.write("\n=== Participant Report E2E Verification ===\n\n");

  const buyer = await login("buyer1@demo.quantaloop.local");
  const provider = await login("provider1@demo.quantaloop.local");
  const admin = await login("admin1@demo.quantaloop.local");

  process.stdout.write("1. Create participant report from Buyer side\n");
  const buyerReport = await createParticipantReport(
    buyer.token,
    provider.user.id,
    "buyer→provider"
  );
  assert(buyerReport.targetType === "participant", "Buyer report targetType = participant");
  assert(buyerReport.status === "open", "Buyer report status = open");

  process.stdout.write("\n2. Create participant report from Provider side\n");
  const providerReport = await createParticipantReport(
    provider.token,
    buyer.user.id,
    "provider→buyer"
  );
  assert(providerReport.targetType === "participant", "Provider report targetType = participant");
  assert(providerReport.status === "open", "Provider report status = open");

  process.stdout.write("\n3. Confirm both appear in Admin Reports (participant filter)\n");
  const listBefore = await request(
    `/admin/reports?status=open&targetType=participant&sort=newest&page=1&limit=50`,
    { token: admin.token }
  );
  assert(listBefore.ok, "Admin list reports API succeeds");
  const items = listBefore.json.data.items;
  const ids = new Set(items.map((i) => i.id));
  assert(ids.has(buyerReport.id), "Buyer-created report visible in admin open participant list");
  assert(ids.has(providerReport.id), "Provider-created report visible in admin open participant list");
  items
    .filter((i) => [buyerReport.id, providerReport.id].includes(i.id))
    .forEach((i) => assert(i.targetType === "participant", `Report ${i.id} shows targetType participant`));

  const summaryBefore = listBefore.json.data.summary;
  process.stdout.write(
    `   KPI before resolve: total=${summaryBefore.total} open=${summaryBefore.open} resolved=${summaryBefore.resolved} participant=${summaryBefore.participant}\n`
  );

  process.stdout.write("\n4. Open report detail and verify sections\n");
  const detailRes = await request(`/admin/reports/${buyerReport.id}`, {
    token: admin.token,
  });
  assert(detailRes.ok, "Admin report detail API succeeds");
  const detail = detailRes.json.data;
  assert(detail.reporter?.id === buyer.user.id, "Reporter Information matches buyer");
  assert(detail.target?.type === "participant", "Target Information type = participant");
  assert(detail.target?.id === provider.user.id, "Target Information points to reported provider");
  assert(
    detail.history?.some((h) => h.type === "created"),
    "Resolution history includes Report submitted"
  );

  process.stdout.write("\n5. Resolve buyer report from admin API\n");
  const resolveRes = await request(`/reports/${buyerReport.id}/resolve`, {
    method: "PATCH",
    token: admin.token,
    body: { status: "resolved" },
  });
  assert(resolveRes.ok, "Resolve report succeeds");
  assert(resolveRes.json.data.report.status === "resolved", "Report status = resolved");

  const detailAfter = await request(`/admin/reports/${buyerReport.id}`, {
    token: admin.token,
  });
  const history = detailAfter.json.data.history;
  assert(
    history.some((h) => h.type === "resolved"),
    "Resolution history includes Resolved by Administrator"
  );
  assert(
    history.some((h) => h.type === "status_changed" && h.detail === "Open → Resolved"),
    "Resolution history includes Status changed Open → Resolved"
  );

  process.stdout.write("\n6. Verify Resolved filter + KPI counts\n");
  const openList = await request(
    `/admin/reports?status=open&targetType=participant&sort=newest&page=1&limit=50`,
    { token: admin.token }
  );
  const openIds = new Set(openList.json.data.items.map((i) => i.id));
  assert(!openIds.has(buyerReport.id), "Resolved report absent from Open filter");
  assert(openIds.has(providerReport.id), "Unresolved provider report still in Open filter");

  const resolvedList = await request(
    `/admin/reports?status=resolved&targetType=participant&sort=newest&page=1&limit=50`,
    { token: admin.token }
  );
  const resolvedIds = new Set(resolvedList.json.data.items.map((i) => i.id));
  assert(resolvedIds.has(buyerReport.id), "Resolved report appears in Resolved filter");
  const resolvedRow = resolvedList.json.data.items.find((i) => i.id === buyerReport.id);
  assert(!!resolvedRow?.resolvedAt, "Resolved filter shows resolved timestamp");

  const summaryAfter = resolvedList.json.data.summary;
  assert(
    summaryAfter.open === summaryBefore.open - 1,
    `KPI open count decreased by 1 (${summaryBefore.open} → ${summaryAfter.open})`
  );
  assert(
    summaryAfter.resolved === summaryBefore.resolved + 1,
    `KPI resolved count increased by 1 (${summaryBefore.resolved} → ${summaryAfter.resolved})`
  );

  process.stdout.write("\n=== ALL PARTICIPANT REPORT CHECKS PASSED ===\n\n");
  process.stdout.write(`Buyer report ID:    ${buyerReport.id} (resolved)\n`);
  process.stdout.write(`Provider report ID: ${providerReport.id} (still open)\n`);
}

main().catch((err) => {
  process.stderr.write(`\n${err.message}\n\n`);
  process.exit(1);
});
