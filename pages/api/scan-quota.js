/** Quota scans : accès illimité pour tous. */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  return res.status(200).json({
    count: 0,
    limit: null,
    isPremium: false,
    canScan: true,
    premiumPlan: null,
    premiumRenewalAt: null,
  });
}
