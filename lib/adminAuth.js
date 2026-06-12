import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "wilder_admin_session";
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function getAdminSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

function signPayload(payloadB64) {
  return createHmac("sha256", getAdminSecret()).update(payloadB64).digest("base64url");
}

export function isAdminConfigured() {
  return Boolean(getAdminSecret());
}

export function createAdminSessionToken() {
  const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  const payloadB64 = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyAdminSessionToken(token) {
  if (!token || !getAdminSecret()) return false;

  const [payloadB64, sig] = String(token).split(".");
  if (!payloadB64 || !sig) return false;

  const expected = signPayload(payloadB64);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password) {
  const expected = getAdminSecret();
  if (!expected || typeof password !== "string") return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function readAdminCookie(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function isAdminRequest(req) {
  const token = readAdminCookie(req);
  return verifyAdminSessionToken(token);
}

export function setAdminSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SEC}${secure}`
  );
}

export function clearAdminSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
  );
}

export function requireAdmin(req, res) {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "admin_not_configured" });
    return false;
  }
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
