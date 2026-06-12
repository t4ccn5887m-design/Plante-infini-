import { requireAdmin } from "@/lib/adminAuth";
import { fetchAdminStats } from "@/lib/adminStats";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const stats = await fetchAdminStats();
    return res.status(200).json(stats);
  } catch (e) {
    console.error("[Wilder] admin stats:", e);
    return res.status(500).json({ error: "stats_failed", message: e.message });
  }
}
