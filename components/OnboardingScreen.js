import { useState } from "react";
import { requestAllPermissions } from "@/lib/permissions";

function IconCamera({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function OnboardingScreen({ t, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAllow = async () => {
    setLoading(true);
    setError("");
    try {
      const { camera } = await requestAllPermissions();
      if (!camera.ok) {
        setError(t("onboarding.error_camera"));
        setLoading(false);
        return;
      }
      onComplete();
    } catch {
      setError(t("onboarding.error_generic"));
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-screen screen-enter">
      <div className="onboarding-bg" />
      <div className="onboarding-overlay" />
      <div className="onboarding-content">
        <div className="onboarding-logo" aria-hidden="true">
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" fill="rgba(27, 61, 47, 0.85)" stroke="rgba(245, 242, 235, 0.25)" strokeWidth="1.5" />
            <path d="M28 52c-2-8 2-18 12-22 4-2 8-1 10 2 2-6 8-10 16-8 6 2 10 8 10 16 0 12-10 20-22 22-8 1-14-2-16-10z" fill="#3D7A5C" stroke="#F5F2EB" strokeWidth="1.2" strokeLinejoin="round" />
            <ellipse cx="34" cy="38" rx="5" ry="6" fill="#E07A3A" opacity="0.9" transform="rotate(-25 34 38)" />
          </svg>
        </div>

        <h1 className="onboarding-title">{t("onboarding.title")}</h1>
        <p className="onboarding-description">{t("onboarding.description")}</p>

        <ul className="onboarding-features">
          <li>
            <span className="onboarding-feature-icon"><IconCamera size={22} /></span>
            <span>{t("onboarding.camera_detail")}</span>
          </li>
          <li>
            <span className="onboarding-feature-icon" aria-hidden="true">📍</span>
            <span>{t("onboarding.location_detail")}</span>
          </li>
        </ul>

        {error && <p className="onboarding-error">{error}</p>}

        <button
          type="button"
          className="btn-primary onboarding-btn"
          onClick={handleAllow}
          disabled={loading}
        >
          {loading ? t("onboarding.loading") : t("onboarding.allow")}
        </button>

        <p className="onboarding-note">{t("onboarding.note")}</p>
      </div>
    </div>
  );
}
