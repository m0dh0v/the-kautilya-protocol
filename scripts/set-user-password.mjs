import { randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const username = process.argv[2];
if (!username) {
  console.error("Usage: node scripts/set-user-password.mjs USERNAME");
  process.exit(1);
}

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Run this command in an interactive terminal to enter the password securely.");
  process.exit(1);
}

function readHidden(prompt) {
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.setEncoding("utf8");
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    const finish = (error) => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Password update cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = Array.from(value).slice(0, -1).join("");
        } else if (character >= " ") {
          value += character;
        }
      }
    };

    process.stdin.on("data", onData);
  });
}

const usersPath = path.join(process.cwd(), "data", "users.json");
let users;
try {
  users = JSON.parse(readFileSync(usersPath, "utf8"));
} catch (error) {
  console.error(`Could not read ${usersPath}:`, error.message);
  process.exit(1);
}

if (!Object.hasOwn(users, username)) {
  console.error(`No account found for "${username}". Password was not changed.`);
  process.exit(1);
}

try {
  const password = await readHidden("New password (input hidden): ");
  const confirmation = await readHidden("Confirm new password (input hidden): ");

  if (!password) {
    console.error("Password cannot be empty. Password was not changed.");
    process.exitCode = 1;
  } else if (password !== confirmation) {
    console.error("Passwords do not match. Password was not changed.");
    process.exitCode = 1;
  } else {
    const salt = randomBytes(16).toString("hex");
    users[username] = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    writeFileSync(usersPath, `${JSON.stringify(users, null, 2)}\n`, "utf8");
    console.log(`Password updated for ${username}. Restart the server for the change to take effect.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (process.stdin.isRaw) process.stdin.setRawMode(false);
  process.stdin.pause();
}
