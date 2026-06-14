import { useMemo, useState } from "react";
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
import SignupPromptBanner from "@/components/SignupPromptBanner";

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
}) {
  const [sharing, setSharing] = useState(false);
  const [notifyState, setNotifyState] = useState("idle");
  const showNotifyCard = !wasNatureNotifyPromptShown();

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

        {showSignupPrompt && onCreateAccount && (
          <SignupPromptBanner t={t} onCreateAccount={onCreateAccount} />
        )}

        <div className="first-celebration-actions">
          <button
            type="button"
            className="btn-primary first-celebration-btn first-celebration-btn--share"
            onClick={handleShare}
            disabled={sharing || !discovery}
          >
            {sharing ? t("discovery.share_generating") : `📤 ${t("first_discovery.share")}`}
          </button>
          <button
            type="button"
            className="btn-scanner first-celebration-btn first-celebration-btn--scan"
            onClick={onScanAgain}
          >
            📸 {t("first_discovery.scan_again")}
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
                className="btn-primary first-celebration-notify-btn"
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
