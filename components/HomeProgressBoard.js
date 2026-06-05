export default function HomeProgressBoard({
  t,
  progress,
  wildScore,
  onOpenStats,
  onOpenTrophies,
  onOpenPokedex,
  onOpenWrapped,
  showWrapped,
}) {
  const { pokedex, badges, rank, monthly } = progress;

  return (
    <section className="home-progress-board" aria-label={t("home.stats")}>
      <button type="button" className="home-rank-banner" onClick={onOpenStats}>
        <span className="home-rank-emoji" aria-hidden="true">🏅</span>
        <div className="home-rank-text">
          <span className="home-rank-label">{t(`home.rank_${rank.key}`)}</span>
          {rank.nextAt != null && (
            <div className="home-rank-bar">
              <div
                className="home-rank-fill"
                style={{ width: `${Math.min(100, rank.progress * 100)}%` }}
              />
            </div>
          )}
          {rank.nextAt != null && (
            <span className="home-rank-next">
              {t("home.rank_next", { count: rank.nextAt - rank.current })}
            </span>
          )}
        </div>
        <span className="home-rank-score">{wildScore}</span>
      </button>

      <div className="home-progress-grid">
        <button type="button" className="home-progress-card" onClick={onOpenPokedex}>
          <div className="home-progress-ring-wrap">
            <svg viewBox="0 0 40 40" className="home-progress-ring-svg" aria-hidden="true">
              <circle className="home-progress-ring-track" cx="20" cy="20" r="16" pathLength="100" />
              <circle
                className="home-progress-ring-fill home-progress-ring-fill--green"
                cx="20"
                cy="20"
                r="16"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - pokedex.completionPct}
              />
            </svg>
            <span className="home-progress-ring-val">{pokedex.completionPct}%</span>
          </div>
          <span className="home-progress-card-label">{t("home.pokedex_progress")}</span>
          <span className="home-progress-card-sub">
            {pokedex.caughtCount} {t("home.species_label")}
          </span>
        </button>

        <button type="button" className="home-progress-card" onClick={onOpenTrophies}>
          <span className="home-progress-card-icon" aria-hidden="true">🏆</span>
          <span className="home-progress-card-label">{t("home.trophies")}</span>
          <span className="home-progress-card-sub">
            {t("home.trophies_unlocked", {
              count: badges.unlocked,
              total: badges.total,
            })}
          </span>
        </button>

        <button type="button" className="home-progress-card home-progress-card--wide" onClick={onOpenStats}>
          <span className="home-progress-card-icon" aria-hidden="true">📅</span>
          <div className="home-progress-card-col">
            <span className="home-progress-card-label">{t("home.monthly_challenge")}</span>
            <span className="home-progress-card-sub">
              {t("home.monthly_progress", {
                current: monthly.current,
                target: monthly.target,
              })}
            </span>
            <div className="home-monthly-bar">
              <div
                className={`home-monthly-fill${monthly.done ? " done" : ""}`}
                style={{ width: `${monthly.ratio * 100}%` }}
              />
            </div>
          </div>
        </button>
      </div>

      {showWrapped && (
        <button type="button" className="home-wrapped-cta" onClick={onOpenWrapped}>
          <span className="home-wrapped-sparkle" aria-hidden="true">✨</span>
          <div>
            <span className="home-wrapped-title">{t("home.wrapped_cta")}</span>
            <span className="home-wrapped-sub">{t("home.wrapped_cta_sub")}</span>
          </div>
          <span className="home-wrapped-arrow" aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}
