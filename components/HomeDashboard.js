import { useMemo } from "react";
import { NAV_THEMES, THEME_META } from "@/lib/themes";
import { getNextBadge } from "@/lib/badges";
import { getNatureStreak } from "@/lib/natureStreak";
import { ThemeIcon } from "@/components/ThemeIcons";

function ThemeHubCard({ themeId, label, onNavigate, delay }) {
  if (themeId === "home") return null;
  return (
    <button
      type="button"
      className={`home-hub-card home-hub-card--${themeId}`}
      onClick={() => onNavigate(themeId)}
      style={{ "--stagger": delay }}
    >
      <span className="home-hub-card-icon">
        <ThemeIcon themeId={themeId} size={28} />
      </span>
      <span className="home-hub-card-label">{label}</span>
    </button>
  );
}

export default function HomeDashboard({
  discoveries,
  t,
  locale,
  onNavigate,
  onStartScan,
  onOpenStats,
  onOpenTrophies,
  onOpenDiscovery,
  onOpenScreen,
}) {
  const streak = getNatureStreak();
  const nextBadge = useMemo(() => getNextBadge(discoveries), [discoveries]);
  const recent = useMemo(
    () =>
      [...discoveries]
        .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
        .slice(0, 8),
    [discoveries]
  );

  const themeItems = NAV_THEMES.filter((id) => id !== "home").map((id, i) => ({
    id,
    label: t(THEME_META[id].navKey),
    delay: i,
  }));

  const hubScreens = [
    { id: "wrapped", emoji: "✨", label: t("home.wrapped") },
    { id: "pokedex", emoji: "📖", label: t("home.pokedex") },
    { id: "world-map", emoji: "🌍", label: t("home.world_map") },
    { id: "account", emoji: "☁️", label: t("home.account") },
  ];

  return (
    <div className="home-dashboard">
      {streak > 0 && (
        <div className="home-streak-pill" role="status">
          <span className="home-streak-fire" aria-hidden="true">🔥</span>
          <span>{t("home.streak", { count: streak })}</span>
        </div>
      )}

      {nextBadge && (
        <button type="button" className="home-next-badge" onClick={onOpenTrophies}>
          <span className="home-next-badge-icon" aria-hidden="true">
            {nextBadge.badge.icon}
          </span>
          <div className="home-next-badge-text">
            <span className="home-next-badge-label">{t("home.next_badge")}</span>
            <span className="home-next-badge-name">{t(`badges.${nextBadge.badge.id}.name`)}</span>
            <div className="home-next-badge-bar">
              <div
                className="home-next-badge-fill"
                style={{ width: `${Math.min(100, nextBadge.ratio * 100)}%` }}
              />
            </div>
            <span className="home-next-badge-progress">
              {t("trophies.progress", { current: nextBadge.current, target: nextBadge.target })}
            </span>
          </div>
          <span className="home-next-badge-chevron" aria-hidden="true">›</span>
        </button>
      )}

      <div className="home-hub-grid">
        {themeItems.map(({ id, label, delay }) => (
          <ThemeHubCard key={id} themeId={id} label={label} onNavigate={onNavigate} delay={delay} />
        ))}
      </div>

      <div className="home-tools-row">
        {hubScreens.map((item) => (
          <button
            key={item.id}
            type="button"
            className="home-tool-chip"
            onClick={() => onOpenScreen(item.id)}
          >
            <span aria-hidden="true">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {recent.length > 0 ? (
        <section className="home-recent" aria-label={t("home.recent_title")}>
          <div className="home-recent-head">
            <h2>{t("home.recent_title")}</h2>
            <button type="button" className="home-recent-all" onClick={onOpenStats}>
              {t("home.stats")} →
            </button>
          </div>
          <div className="home-recent-scroll">
            {recent.map((d) => (
              <button
                key={d.id}
                type="button"
                className="home-recent-card"
                onClick={() => onOpenDiscovery(d.id)}
              >
                {d.photo ? (
                  <img src={d.photo} alt="" className="home-recent-photo" />
                ) : (
                  <span className="home-recent-photo home-recent-photo--empty">🌿</span>
                )}
                <span className="home-recent-name">{d.nom}</span>
                {d.discoveredAt && (
                  <span className="home-recent-date">
                    {new Date(d.discoveredAt).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="home-recent-empty">{t("home.recent_empty")}</p>
      )}

      <button type="button" className="btn-scanner btn-scanner--hero home-scan-cta" onClick={onStartScan}>
        <span className="btn-scanner-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </span>
        {t("home.discover")}
      </button>
    </div>
  );
}
