import { useMemo, useState } from "react";
import { NAV_THEMES, THEME_META } from "@/lib/themes";
import { getNextBadge } from "@/lib/badges";
import { BIODEX_TYPES } from "@/lib/biodex";
import { computeWildScore, getTipIndex } from "@/lib/homeAmbience";
import { getHomeProgress } from "@/lib/homeEngagement";
import { ThemeIcon } from "@/components/ThemeIcons";
import HomeDailyMission from "@/components/HomeDailyMission";
import HomeProgressBoard from "@/components/HomeProgressBoard";

const HUB_DESC_KEYS = {
  potager: "home.hub_potager",
  randos: "home.hub_randos",
  jardin: "home.hub_jardin",
  juniors: "home.hub_juniors",
};

function ThemeHubCard({ themeId, label, desc, onNavigate, delay }) {
  if (themeId === "home") return null;
  return (
    <button
      type="button"
      className={`home-hub-card home-hub-card--${themeId}`}
      onClick={() => onNavigate(themeId)}
      style={{ "--stagger": delay }}
    >
      <span className="home-hub-card-icon">
        <ThemeIcon themeId={themeId} size={26} />
      </span>
      <span className="home-hub-card-label">{label}</span>
      <span className="home-hub-card-desc">{desc}</span>
    </button>
  );
}

export default function HomeDashboard({
  discoveries,
  stats,
  t,
  locale,
  onNavigate,
  onStartScan,
  onOpenStats,
  onOpenTrophies,
  onOpenDiscovery,
  onOpenScreen,
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const nextBadge = useMemo(() => getNextBadge(discoveries), [discoveries]);
  const wildScore = useMemo(() => computeWildScore(stats), [stats]);
  const progress = useMemo(() => getHomeProgress(discoveries, stats), [discoveries, stats]);
  const tipIndex = getTipIndex();
  const isNewUser = discoveries.length === 0;
  const showWrapped = discoveries.length >= 3;

  const recent = useMemo(
    () =>
      [...discoveries]
        .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
        .slice(0, 10),
    [discoveries]
  );

  const featured = useMemo(
    () =>
      [...discoveries]
        .filter((d) => d.photo && (d.rarete === "rare" || d.rarete === "tres_rare"))
        .slice(0, 3)
        .concat(
          [...discoveries]
            .filter((d) => d.photo)
            .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
            .slice(0, 6)
        )
        .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
        .slice(0, 6),
    [discoveries]
  );

  const themeItems = NAV_THEMES.filter((id) => id !== "home").map((id, i) => ({
    id,
    label: t(THEME_META[id].navKey),
    desc: t(HUB_DESC_KEYS[id]),
    delay: i,
  }));

  const hubScreens = [
    { id: "wrapped", emoji: "✨", label: t("home.wrapped") },
    { id: "biodex", emoji: "📖", label: t("home.biodex") },
    { id: "world-map", emoji: "🌍", label: t("home.world_map") },
    { id: "account", emoji: "☁️", label: t("home.account") },
  ];

  return (
    <div className="home-dashboard">
      <HomeDailyMission
        t={t}
        mission={progress.mission}
        streak={progress.streak}
        onStartScan={() => onStartScan({})}
      />

      {!isNewUser && (
        <HomeProgressBoard
          t={t}
          progress={progress}
          wildScore={wildScore}
          onOpenStats={onOpenStats}
          onOpenTrophies={onOpenTrophies}
          onOpenBiodex={() => onOpenScreen("biodex")}
          onOpenWrapped={() => onOpenScreen("wrapped")}
          showWrapped={showWrapped}
        />
      )}

      {(isNewUser || discoveries.length < 5) && (
        <div className="home-tip-card" role="note">
          <span className="home-tip-icon" aria-hidden="true">💡</span>
          <p>{t(`home.tip_${tipIndex}`)}</p>
        </div>
      )}

      {nextBadge && !isNewUser && (
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

      {discoveries.length >= 1 && (
        <button
          type="button"
          className="home-cloud-nudge"
          onClick={() => onOpenScreen("account")}
        >
          <span className="home-cloud-nudge-icon" aria-hidden="true">☁️</span>
          <div>
            <span className="home-cloud-nudge-title">{t("home.cloud_nudge")}</span>
            <span className="home-cloud-nudge-cta">{t("home.cloud_nudge_cta")} →</span>
          </div>
        </button>
      )}

      <div className="home-hub-grid">
        {themeItems.map(({ id, label, desc, delay }) => (
          <ThemeHubCard
            key={id}
            themeId={id}
            label={label}
            desc={desc}
            onNavigate={onNavigate}
            delay={delay}
          />
        ))}
      </div>

      <div className="home-explorer-more">
        <button
          type="button"
          className="home-explorer-toggle"
          onClick={() => setToolsOpen((o) => !o)}
          aria-expanded={toolsOpen}
        >
          <span>{toolsOpen ? t("home.explorer_less") : t("home.explorer_more")}</span>
          <span className={`home-explorer-chevron${toolsOpen ? " open" : ""}`} aria-hidden="true">
            ›
          </span>
        </button>
        {toolsOpen && (
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
        )}
      </div>

      {featured.length >= 3 && (
        <section className="home-discovery-wall" aria-label={t("home.discovery_wall_title")}>
          <h2 className="home-discovery-wall-title">{t("home.discovery_wall_title")}</h2>
          <div className="home-discovery-wall-grid">
            {featured.map((d, i) => (
              <button
                key={d.id}
                type="button"
                className={`home-discovery-wall-tile${i === 0 && featured.length >= 4 ? " home-discovery-wall-tile--hero" : ""}`}
                onClick={() => onOpenDiscovery(d)}
              >
                <img src={d.photo} alt="" />
                {(d.rarete === "rare" || d.rarete === "tres_rare") && (
                  <span className="home-discovery-wall-rare" aria-hidden="true">◆</span>
                )}
                <span className="home-discovery-wall-name">{d.nom}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="home-recent" aria-label={t("home.recent_title")}>
          <div className="home-recent-head">
            <h2>{t("home.recent_title")}</h2>
            <button type="button" className="home-recent-all" onClick={onOpenStats}>
              {t("home.stats")} →
            </button>
          </div>
          <div className="home-recent-scroll">
            {recent.map((d) => {
              const emoji = BIODEX_TYPES.find((p) => p.id === d.type)?.emoji || "🌿";
              return (
                <button
                  key={d.id}
                  type="button"
                  className="home-recent-card"
                  onClick={() => onOpenDiscovery(d)}
                >
                  {d.photo ? (
                    <img src={d.photo} alt="" className="home-recent-photo" />
                  ) : (
                    <span className="home-recent-photo home-recent-photo--empty">{emoji}</span>
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
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
