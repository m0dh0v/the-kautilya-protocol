import { scryptSync, timingSafeEqual, createHmac, randomBytes } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";

// users.json lives at the project root, OUTSIDE /public, server-side only.
// Format: { "USERNAME": "salt:scryptHashHex" }  (see scripts/hash-users.mjs)
const USERS_PATH = path.join(process.cwd(), "data", "users.json");

interface UserStore {
  [username: string]: string;
}

let cachedUsers: UserStore | null = null;
let runtimeSessionSecret: string | null = null;

function loadUsers(): UserStore {
  if (cachedUsers) return cachedUsers;
  const raw = readFileSync(USERS_PATH, "utf-8");
  cachedUsers = JSON.parse(raw);
  return cachedUsers!;
}

export function verifyCredentials(username: string, password: string): boolean {
  const users = loadUsers();
  const entry = users[username];
  if (!entry) return false;

  const [salt, storedHashHex] = entry.split(":");
  if (!salt || !storedHashHex) return false;

  const computedHash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(storedHashHex, "hex");

  if (computedHash.length !== storedHash.length) return false;
  return timingSafeEqual(computedHash, storedHash);
}

// ---- Signed session cookie ----
// Token shape: base64url(payloadJSON) + "." + base64url(hmacSignature)

export const SESSION_COOKIE_NAME = "kp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim();
  if (configuredSecret && configuredSecret.length >= 16) {
    return configuredSecret;
  }

  // Keep local development usable when the optional environment setting is absent.
  // Production deployments should always provide SESSION_SECRET for restart-stable sessions.
  if (!runtimeSessionSecret) {
    runtimeSessionSecret = randomBytes(32).toString("hex");
    console.warn("SESSION_SECRET is not configured; using a temporary runtime session secret.");
  }
  return runtimeSessionSecret;
}

function toBase64Url(input: Buffer): string {
  return input.toString("base64url");
}

interface SessionPayload {
  sub: string;
  exp: number;
}

export function createSessionToken(username: string): string {
  const payload: SessionPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadBuf = Buffer.from(JSON.stringify(payload), "utf-8");
  const signature = createHmac("sha256", getSecret()).update(payloadBuf).digest();
  return `${toBase64Url(payloadBuf)}.${toBase64Url(signature)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const payloadBuf = Buffer.from(parts[0], "base64url");
    const signatureBuf = Buffer.from(parts[1], "base64url");

    const expectedSig = createHmac("sha256", getSecret()).update(payloadBuf).digest();
    if (signatureBuf.length !== expectedSig.length) return null;
    if (!timingSafeEqual(signatureBuf, expectedSig)) return null;

    const payload: SessionPayload = JSON.parse(payloadBuf.toString("utf-8"));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired

    return payload.sub;
  } catch {
    return null;
  }
}

// Minimal cookie reader — avoids adding the cookie-parser dependency for one value.
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function getSessionUsername(req: Request): string | null {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

// Express middleware — blocks any route it's applied to unless the session cookie is valid.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const username = getSessionUsername(req);
  if (!username) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  (req as any).username = username;
  next();
}
