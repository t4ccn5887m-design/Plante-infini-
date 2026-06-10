import { useMemo } from "react";
import { buildPokedexCollection, POKEDEX_TYPES } from "@/lib/pokedex";
import { getNatureStreak } from "@/lib/natureStreak";

const DAILY_PICK = {
  nom: "La Pâquerette",
  photo: "https://images.unsplash.com/photo-1490682143684-43ec2efb3d60?w=240&q=80",
};

function IconCamera() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function typeEmoji(type) {
  return POKEDEX_TYPES.find((p) => p.id === type)?.emoji || "🌿";
}

export default function WilderHomeScreen({
  t,
  discoveries = [],
  onStartScan,
  onViewAll,
  onOpenDiscovery,
}) {
  const streak = getNatureStreak();
  const speciesCount = useMemo(
    () => buildPokedexCollection(discoveries).caughtCount,
    [discoveries]
  );

  const recent = useMemo(
    () =>
      [...discoveries]
        .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
        .slice(0, 3),
    [discoveries]
  );

  const dayLabel = streak <= 1 ? t("home.day_one") : t("home.day_many");
  const speciesLabel = speciesCount <= 1 ? t("home.species_one") : t("home.species_many");

  return (
    <div className="wilder-home wilder-home--v2 screen-enter">
      <div className="wilder-home-bg" aria-hidden="true" />
      <div className="wilder-home-aurora" aria-hidden="true" />
      <div className="wilder-home-overlay" aria-hidden="true" />

      <div className="wilder-home-content wilder-home-content--v2">
        <div className="wilder-home-streak-bar stagger-1" aria-label={t("home.streak_bar_label")}>
          <span className="wilder-home-streak-item">
            🔥 {streak} {dayLabel}
          </span>
          <span className="wilder-home-streak-item">
            🌿 {speciesCount} {speciesLabel}
          </span>
        </div>

        <main className="wilder-home-scan-zone stagger-2">
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
        </main>

        <section className="wilder-home-daily-card stagger-3" aria-label={t("home.daily_pick_title")}>
          <h2 className="wilder-home-daily-title">{t("home.daily_pick_title")}</h2>
          <div className="wilder-home-daily-body">
            <img
              src={DAILY_PICK.photo}
              alt=""
              className="wilder-home-daily-photo"
              loading="lazy"
            />
            <p className="wilder-home-daily-name">{DAILY_PICK.nom}</p>
          </div>
        </section>

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
                <button
                  key={d.id}
                  type="button"
                  className="wilder-home-recent-thumb-btn"
                  onClick={() => onOpenDiscovery?.(d)}
                  aria-label={d.nom}
                >
                  {d.photo ? (
                    <img src={d.photo} alt="" className="wilder-home-recent-thumb" />
                  ) : (
                    <span className="wilder-home-recent-thumb wilder-home-recent-thumb--empty">
                      {typeEmoji(d.type)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
