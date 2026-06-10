import {
  activateScanPremiumServer,
  getScanQuota,
  resolveScanIdentity,
} from "@/lib/scanQuotaServer";

export default async function handler(req, res) {
  const identity = await resolveScanIdentity(req);
  if (!identity.ok) {
    return res.status(400).json({ erreur: "Identifiant visiteur manquant" });
  }

  if (req.method === "GET") {
    const quota = await getScanQuota(identity);
    if (!quota.ok) {
      return res.status(503).json({ erreur: quota.error || "Quota indisponible" });
    }
    return res.status(200).json({
      count: quota.count,
      limit: quota.limit,
      isPremium: quota.isPremium,
      canScan: quota.canScan,
    });
  }

  if (req.method === "POST") {
    const { action } = req.body || {};
    if (action === "activate_premium") {
      const result = await activateScanPremiumServer(identity);
      if (!result.ok) {
        return res.status(503).json({ erreur: result.error || "Activation impossible" });
      }
      return res.status(200).json({
        count: result.count,
        limit: result.limit,
        isPremium: result.isPremium,
        canScan: result.canScan,
      });
    }
    return res.status(400).json({ erreur: "Action invalide" });
  }

  return res.status(405).end();
}
