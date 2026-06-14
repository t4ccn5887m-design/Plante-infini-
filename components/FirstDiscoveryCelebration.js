import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createT, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { shareDiscovery } from "@/lib/share";
import {
  markNatureNotifyPromptShown,
  requestNatureNotificationPermission,
  wasNatureNotifyPromptShown,
} from "@/lib/natureNotifications";
import AnimalSoundQuiz from "@/components/AnimalSoundQuiz";
import DiscoveryAnalysisSections, { extractSummarySentence } from "@/components/DiscoveryAnalysisSections";
import DiscoveryFunFact from "@/components/DiscoveryFunFact";

function IconBack({ size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function FirstDiscoveryCelebration({
  result,
  photo,
  discovery,
  t,
  lang,
  onScanAgain,
  onDismissNotify,
  showSignupPrompt = false,
  onCreateAccount,
  onBeforeShare,
}) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [notifyState, setNotifyState] = useState("idle");
  const showNotifyCard = !wasNatureNotifyPromptShown();
  const showCreateAccount = showSignupPrompt && onCreateAccount;

  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  const summary = useMemo(() => extractSummarySentence(result?.description), [result?.description]);

  const handleShare = async () => {
    if (!discovery) return;
    setSharing(true);
    try {
      await shareDiscovery(discovery, t, typeLbl, rarityLbl, "story");
    } catch {
      /* annulé */
    } finally {
      setSharing(false);
    }
  };

  const handleShareClick = () => {
    if (onBeforeShare?.()) return;
    handleShare();
  };

  const handleEnableNotify = async () => {
    setNotifyState("loading");
    const { ok } = await requestNatureNotificationPermission();
    setNotifyState(ok ? "granted" : "denied");
    onDismissNotify?.();
  };

  const handleSkipNotify = () => {
    markNatureNotifyPromptShown();
    onDismissNotify?.();
  };

  return (
    <div className="first-celebration screen-enter-fast">
      <div className="first-celebration-bg" aria-hidden="true" />
      <button
        type="button"
        className="first-celebration-back"
        onClick={() => router.back()}
        aria-label={t("auth.back")}
      >
        <IconBack size={20} color="#f5f3ec" />
      </button>
      <div className="first-celebration-content">
        <p className="first-celebration-eyebrow">{t("first_discovery.eyebrow")}</p>

        <div className="first-celebration-photo-wrap">
          {photo ? (
            <img src={photo} alt="" className="first-celebration-photo" />
          ) : (
            <div className="first-celebration-photo first-celebration-photo--empty">🌿</div>
          )}
          <div className="first-celebration-badge-float" aria-hidden="true">
            <span className="first-celebration-badge-icon">🌱</span>
            <span className="first-celebration-badge-label">{t("badges.first_step.name")}</span>
          </div>
        </div>

        <h1 className="first-celebration-name">{result?.nom}</h1>
        {result?.nom_latin && (
          <p className="first-celebration-latin">{result.nom_latin}</p>
        )}

        <p className="first-celebration-message">{t("first_discovery.message")}</p>

        {showCreateAccount && (
          <p className="first-celebration-signup-hint">{t("signup_prompt.banner_text")}</p>
        )}

        <div className="first-celebration-actions">
          {showCreateAccount && (
            <button
              type="button"
              className="first-celebration-btn first-celebration-btn--primary"
              onClick={onCreateAccount}
            >
              {t("signup_prompt.banner_cta")}
            </button>
          )}
          <button
            type="button"
            className={`first-celebration-btn first-celebration-btn--${showCreateAccount ? "secondary" : "primary"}`}
            onClick={handleShareClick}
            disabled={sharing || !discovery}
          >
            {sharing ? t("discovery.share_generating") : t("first_discovery.share")}
          </button>
          <button
            type="button"
            className="first-celebration-btn first-celebration-btn--tertiary"
            onClick={onScanAgain}
          >
            {t("first_discovery.scan_again")}
          </button>
        </div>

        {result && (
          <div className="first-celebration-detail">
            {summary && <p className="first-celebration-summary">{summary}</p>}
            <DiscoveryFunFact data={result} t={t} />
            <AnimalSoundQuiz data={result} t={t} />
            <DiscoveryAnalysisSections
              data={result}
              t={t}
              lang={lang}
              discoveryId={discovery?.id}
            />
          </div>
        )}

        {showNotifyCard && notifyState !== "granted" && (
          <div className="first-celebration-notify" role="region" aria-label={t("first_discovery.notify_title")}>
            <p className="first-celebration-notify-title">{t("first_discovery.notify_title")}</p>
            <p className="first-celebration-notify-body">{t("first_discovery.notify_body")}</p>
            <div className="first-celebration-notify-actions">
              <button
                type="button"
                className="first-celebration-notify-btn"
                onClick={handleEnableNotify}
                disabled={notifyState === "loading"}
              >
                {notifyState === "loading"
                  ? t("first_discovery.notify_loading")
                  : t("first_discovery.notify_enable")}
              </button>
              <button type="button" className="first-celebration-notify-skip" onClick={handleSkipNotify}>
                {t("first_discovery.notify_later")}
              </button>
            </div>
            {notifyState === "denied" && (
              <p className="first-celebration-notify-denied">{t("first_discovery.notify_denied")}</p>
            )}
          </div>
        )}
        {notifyState === "granted" && (
          <p className="first-celebration-notify-ok" role="status">
            ✓ {t("first_discovery.notify_ok")}
          </p>
        )}
      </div>
    </div>
  );
}
