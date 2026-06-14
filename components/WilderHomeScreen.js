import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { buildBiodexCollection, BIODEX_TYPES } from "@/lib/biodex";
import { getNatureStreak } from "@/lib/natureStreak";
import { getDailySpecies, getDailySpeciesIllustration } from "@/lib/dailySpecies";
import { DiscoveryPhotoThumb, DailySpeciesMedia } from "@/components/DiscoveryPhotoThumb";
import { shouldOfferInstallGuide } from "@/lib/installGuide";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import HomeScanCategories from "@/components/HomeScanCategories";
import AccountMenu from "@/components/AccountMenu";
import PremiumHamburgerMenu from "@/components/PremiumHamburgerMenu";

const LONG_PRESS_MS = 520;

function IconCamera() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function typeEmoji(type) {
  return BIODEX_TYPES.find((p) => p.id === type)?.emoji || "🌿";
}

export default function WilderHomeScreen({
  t,
  discoveries = [],
  onStartScan,
  onViewAll,
  onOpenHerbier,
  isLoggedIn = false,
  accountUserEmail = "",
  onAccountCreated,
  onOpenDiscovery,
  onOpenDailyPick,
  onDeleteDiscovery,
  deleteLabels,
  selectedCategory,
  onCategoryChange,
  onOpenInstallGuide,
  onSubscribe,
  showSubscribe = false,
  showPremiumMenu = false,
  premiumUserEmail = "",
  scanCount = 0,
  locale = "fr-FR",
  onNavigateStats,
  onSignOut,
  onCancelSubscription,
}) {
  const [revealedDeleteId, setRevealedDeleteId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const showInstallGuide = shouldOfferInstallGuide();

  const streak = getNatureStreak();
  const speciesCount = useMemo(
    () => buildBiodexCollection(discoveries).caughtCount,
    [discoveries]
  );

  const recent = useMemo(
    () =>
      [...discoveries]
        .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
        .slice(0, 3),
    [discoveries]
  );

  const dailyPick = useMemo(() => getDailySpecies(), []);
  const dailyIllustration = useMemo(
    () => getDailySpeciesIllustration(dailyPick),
    [dailyPick]
  );

  const dayLabel = streak <= 1 ? t("home.day_one") : t("home.day_many");
  const speciesLabel = speciesCount <= 1 ? t("home.species_one") : t("home.species_many");

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!revealedDeleteId) return undefined;
    const onDocPointer = (e) => {
      if (e.target.closest(".wilder-home-recent-thumb-wrap")) return;
      setRevealedDeleteId(null);
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [revealedDeleteId]);

  const handleThumbPointerDown = (discoveryId) => {
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setRevealedDeleteId(discoveryId);
    }, LONG_PRESS_MS);
  };

  const handleThumbPointerUp = () => {
    clearLongPress();
  };

  const handleThumbClick = (d) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (revealedDeleteId === d.id) {
      setRevealedDeleteId(null);
      return;
    }
    if (revealedDeleteId) {
      setRevealedDeleteId(null);
      return;
    }
    onOpenDiscovery?.(d);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) onDeleteDiscovery?.(confirmDeleteId);
    setConfirmDeleteId(null);
    setRevealedDeleteId(null);
  };

  return (
    <div className="wilder-home wilder-home--v2 screen-enter">
      <div className="wilder-home-bg" aria-hidden="true" />
      <div className="wilder-home-aurora" aria-hidden="true" />
      <div className="wilder-home-overlay" aria-hidden="true" />

      <div className="wilder-home-content wilder-home-content--v2">
        <header className="wilder-home-top stagger-1">
          <div className="wilder-home-top-bar">
            <div className="wilder-home-top-left">
              <AccountMenu
                t={t}
                isLoggedIn={isLoggedIn}
                userEmail={accountUserEmail}
                onOpenHerbier={onOpenHerbier}
                onSignOut={onSignOut}
                onAccountCreated={onAccountCreated}
              />
              {showSubscribe && onSubscribe && (
                <button type="button" className="wilder-home-subscribe-btn" onClick={onSubscribe}>
                  {t("home.subscribe")}
                </button>
              )}
            </div>
            <div className="wilder-home-top-right">
              {showPremiumMenu && (
                <PremiumHamburgerMenu
                  t={t}
                  locale={locale}
                  userEmail={premiumUserEmail}
                  discoveries={discoveries}
                  scanCount={scanCount}
                  onNavigateStats={onNavigateStats}
                  onSignOut={onSignOut}
                  onCancelSubscription={onCancelSubscription}
                />
              )}
            </div>
          </div>

          <h1 className="wilder-home-brand-name">Wilder</h1>

          <div className="wilder-home-streak-row" aria-label={t("home.streak_bar_label")}>
            <span className="wilder-home-streak-item">
              🔥 {streak} {dayLabel}
            </span>
            <span className="wilder-home-streak-item">
              🌿 {speciesCount} {speciesLabel}
            </span>
          </div>
        </header>

        <main className="wilder-home-scan-zone stagger-2">
          <HomeScanCategories
            t={t}
            selectedId={selectedCategory}
            onSelect={onCategoryChange}
          />

          <div className="wilder-home-scan-main">
            <div className="home-scan-rings home-scan-rings--landing" aria-hidden="true">
              <span className="home-scan-ring home-scan-ring--1" />
              <span className="home-scan-ring home-scan-ring--2" />
              <span className="home-scan-ring home-scan-ring--3" />
            </div>

            <button
              type="button"
              className="btn-scanner btn-scanner--hero btn-scanner--green wilder-home-scan-btn"
              onClick={() => onStartScan?.()}
            >
              <span className="home-scan-cta-shimmer" aria-hidden="true" />
              <span className="btn-scanner-icon">
                <IconCamera />
              </span>
              <span className="btn-scanner-label">{t("home.scanner")}</span>
            </button>
          </div>

          {showInstallGuide && onOpenInstallGuide && (
            <button
              type="button"
              className="wilder-home-install-link stagger-3"
              onClick={onOpenInstallGuide}
            >
              {t("home.install_cta")}
            </button>
          )}
        </main>

        <button
          type="button"
          className="wilder-home-daily-card stagger-3"
          aria-label={`${t("home.daily_pick_title")} — ${dailyPick.nom}`}
          onClick={() => onOpenDailyPick?.(dailyPick)}
        >
          <h2 className="wilder-home-daily-title">{t("home.daily_pick_title")}</h2>
          <div className="wilder-home-daily-body">
            <DailySpeciesMedia
              species={dailyPick}
              illustration={dailyIllustration}
              photoClassName="wilder-home-daily-photo"
              emojiClassName="wilder-home-daily-photo wilder-home-daily-photo--emoji"
            />
            <div className="wilder-home-daily-text">
              <p className="wilder-home-daily-name">{dailyPick.nom}</p>
              <p className="wilder-home-daily-latin">{dailyPick.latin}</p>
              <p className="wilder-home-daily-fact">{dailyPick.fact}</p>
            </div>
          </div>
        </button>

        <section className="wilder-home-recent stagger-4" aria-label={t("home.recent_finds")}>
          <div className="wilder-home-recent-head">
            <h2 className="wilder-home-recent-title">{t("home.recent_finds")}</h2>
            {recent.length > 0 && (
              <button type="button" className="wilder-home-recent-all" onClick={() => onViewAll?.()}>
                {t("home.view_all")}
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="wilder-home-recent-empty">{t("home.first_scan_cta")}</p>
          ) : (
            <div className="wilder-home-recent-row">
              {recent.map((d) => (
                <div key={d.id} className="wilder-home-recent-thumb-wrap">
                  <button
                    type="button"
                    className={`wilder-home-recent-thumb-btn${revealedDeleteId === d.id ? " wilder-home-recent-thumb-btn--delete-mode" : ""}`}
                    onPointerDown={() => handleThumbPointerDown(d.id)}
                    onPointerUp={handleThumbPointerUp}
                    onPointerLeave={handleThumbPointerUp}
                    onPointerCancel={handleThumbPointerUp}
                    onClick={() => handleThumbClick(d)}
                    aria-label={d.nom}
                  >
                    <DiscoveryPhotoThumb discovery={d} typeEmoji={typeEmoji} />
                  </button>
                  {revealedDeleteId === d.id && (
                    <button
                      type="button"
                      className="wilder-home-recent-delete"
                      aria-label={deleteLabels?.deleteLabel || t("discovery.delete_action")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(d.id);
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {onOpenHerbier && (
          <button type="button" className="wilder-home-herbier-link stagger-4" onClick={onOpenHerbier}>
            🌿 {t("signup_prompt.herbier_link")}
          </button>
        )}
      </div>

      <DeleteConfirmDialog
        open={Boolean(confirmDeleteId)}
        message={deleteLabels?.confirmMessage || t("home.delete_find_confirm")}
        cancelLabel={deleteLabels?.cancelLabel || t("albums.cancel")}
        confirmLabel={deleteLabels?.confirmLabel || t("discovery.delete_action")}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
