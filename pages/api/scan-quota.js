import { getScanQuota, resolveScanIdentity } from "@/lib/scanQuotaServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const identity = await resolveScanIdentity(req);
  if (!identity.ok) {
    return res.status(400).json({ erreur: "Identifiant visiteur manquant" });
  }

  const quota = await getScanQuota(identity);
  if (!quota.ok) {
    return res.status(503).json({ erreur: quota.error || "Quota indisponible" });
  }

  return res.status(200).json({
    count: quota.count,
    limit: quota.limit,
    isPremium: quota.isPremium,
    canScan: quota.canScan,
    premiumPlan: quota.premiumPlan,
    premiumRenewalAt: quota.premiumRenewalAt,
  });
}
