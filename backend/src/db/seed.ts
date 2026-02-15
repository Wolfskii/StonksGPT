/**
 * Optional seed. Run with: npm run db:seed
 * Currently a no-op; add default watchlist/settings if needed.
 */
import { db } from "./index.js";

async function seed() {
  // Example: await db.insert(watchlist).values([{ symbol: "AAPL", type: "stock", exchange: "US" }]);
  console.log("Seed completed (no data added by default).");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
