import { getTimePeriod, getSeason, SEASON_EMOJI } from "@/lib/homeAmbience";

export default function HomeGreeting({ t }) {
  const period = getTimePeriod();
  const season = getSeason();

  return (
    <div className="home-greeting">
      <p className="home-greeting-text">{t(`home.greeting_${period}`)}</p>
      <span className="home-season-badge">
        <span className="home-season-emoji" aria-hidden="true">
          {SEASON_EMOJI[season]}
        </span>
        {t(`home.season_${season}`)}
      </span>
    </div>
  );
}
