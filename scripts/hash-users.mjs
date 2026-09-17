// Regenerate data/users.json from a plaintext "USERNAME,PASSWORD" CSV.
// Usage: node scripts/hash-users.mjs path/to/users_credentials.csv
//
// Run this once, commit/deploy only the resulting data/users.json, then
// delete the plaintext CSV. Never keep both around.

import { randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/hash-users.mjs path/to/users_credentials.csv");
  process.exit(1);
}

const csv = readFileSync(csvPath, "utf-8").trim();
const lines = csv.split("\n").slice(1); // skip header row

const users = {};
for (const line of lines) {
  const [username, password] = line.split(",").map((s) => s.trim());
  if (!username || !password) continue;
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  users[username] = `${salt}:${hash}`;
}

const outPath = path.join(process.cwd(), "data", "users.json");
writeFileSync(outPath, JSON.stringify(users, null, 2));
console.log(`Wrote ${Object.keys(users).length} hashed users to ${outPath}`);
