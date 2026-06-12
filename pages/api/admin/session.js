import {
  createAdminSessionToken,
  isAdminConfigured,
  isAdminRequest,
  requireAdmin,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export default function handler(req, res) {
  if (req.method === "GET") {
    if (!isAdminConfigured()) {
      return res.status(503).json({ authenticated: false, configured: false });
    }
    return res.status(200).json({ authenticated: isAdminRequest(req), configured: true });
  }

  if (req.method === "POST") {
    if (!isAdminConfigured()) {
      return res.status(503).json({ error: "admin_not_configured" });
    }

    const password = req.body?.password;
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: "invalid_password" });
    }

    const token = createAdminSessionToken();
    setAdminSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "1kb" } },
};
