/**
 * Intentional public Insights seed (skips existing slugs).
 * Usage: npm run seed:insights
 */
require("dotenv").config();

const {
  seedContentInsights,
} = require("../modules/content-insights/content-insight.service");
const {
  connectSeedDatabase,
  disconnectSeedDatabase,
} = require("./utils/db");

async function main() {
  await connectSeedDatabase();
  const result = await seedContentInsights();
  console.log(`Content insights seed complete. Inserted: ${result.inserted}`);
  await disconnectSeedDatabase();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectSeedDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
