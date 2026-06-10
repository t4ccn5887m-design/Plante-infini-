import { FREE_SCAN_LIMIT, shouldShowScanQuotaNotice } from "@/lib/freemium";

export default function ScanQuotaNotice({ t, scanCount }) {
  if (!shouldShowScanQuotaNotice(scanCount)) return null;

  const remaining = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  return (
    <div className="scan-quota-notice" role="status" aria-live="polite">
      <span className="scan-quota-notice-icon" aria-hidden="true">
        🌿
      </span>
      <p className="scan-quota-notice-text">
        {t("freemium.quota_notice", { remaining })}
      </p>
    </div>
  );
}
