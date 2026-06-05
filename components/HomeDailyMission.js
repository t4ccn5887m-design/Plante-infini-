export default function HomeDailyMission({ t, mission, streak, onStartScan }) {
  if (mission.done && streak.status !== "at_risk") {
    return (
      <div className="home-mission home-mission--done" role="status">
        <span className="home-mission-check" aria-hidden="true">✓</span>
        <div className="home-mission-body">
          <span className="home-mission-label">{t("home.mission_title")}</span>
          <span className="home-mission-text">{t("home.mission_done")}</span>
        </div>
        {streak.status === "safe" && streak.streak > 0 && (
          <span className="home-mission-streak">🔥 {streak.streak}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="home-mission"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
        onStartScan();
      }}
    >
      <span className="home-mission-icon" aria-hidden="true">
        {streak.status === "at_risk" ? "⏳" : "🎯"}
      </span>
      <div className="home-mission-body">
        <span className="home-mission-label">{t("home.mission_title")}</span>
        <span className="home-mission-text">
          {streak.status === "at_risk"
            ? t("home.streak_at_risk", { count: streak.streak })
            : t("home.mission_scan")}
        </span>
        <div className="home-mission-bar">
          <div
            className="home-mission-fill"
            style={{ width: `${mission.current * 100}%` }}
          />
        </div>
      </div>
      <span className="home-mission-cta" onClick={(e) => e.stopPropagation()}>
        {streak.streak > 0 ? (
          <span className="home-mission-streak-badge">🔥 {streak.streak}</span>
        ) : (
          <span className="home-mission-go">→</span>
        )}
      </span>
    </button>
  );
}
