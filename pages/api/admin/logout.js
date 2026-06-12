import { clearAdminSessionCookie, requireAdmin } from "@/lib/adminAuth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!requireAdmin(req, res)) return;

  clearAdminSessionCookie(res);
  return res.status(200).json({ ok: true });
}
