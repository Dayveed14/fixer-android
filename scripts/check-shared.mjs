#!/usr/bin/env node
// Checks the logic shared with the web app hasn't drifted.
//   npm run check-shared                    (expects ../fixer-vite)
//   npm run check-shared -- /path/to/fixer-vite
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.resolve(process.argv[2] || path.join(here, "..", "fixer-vite"));
if (!existsSync(path.join(web, "src"))) {
  console.error(`Web repo not found at ${web}. Pass its path: npm run check-shared -- <path>`);
  process.exit(2);
}

const PAIRS = [
  ...["schedule", "shipmentStatus", "diagnosis", "notificationLink", "richText"].map((f) => [`src/core/utils/${f}.js`, `src/utils/${f}.js`]),
  ["src/core/utils/jobs.js", "src/components/technician/jobs.js"],
  ...["bookings", "shipments", "payments", "technician", "pricing", "diagnosis"].map((f) => [`src/core/api/${f}.api.js`, `src/api/${f}.api.js`]),
];

let drift = 0;
for (const [app, site] of PAIRS) {
  const a = path.join(here, app);
  const b = path.join(web, site);
  if (!existsSync(b)) {
    console.log(`?  ${app}: ${site} missing in the web repo`);
    drift += 1;
  } else if (readFileSync(a, "utf8") !== readFileSync(b, "utf8")) {
    console.log(`≠  ${app}  differs from  web:${site}`);
    drift += 1;
  } else {
    console.log(`=  ${app}`);
  }
}
console.log(drift ? `\n${drift} file(s) differ — copy the newer version across.` : "\nAll shared logic matches the web app.");
process.exit(drift ? 1 : 0);
