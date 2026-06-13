import { useState, useEffect } from "react";
import {
  getGardenAdviceType,
  parseWeatherApiResponse,
  weatherEmoji,
} from "@/lib/potagerWeather";

/** Weather line without geolocation — generic garden tip only. */
export default function PotagerWeatherLine({ t }) {
  const [line, setLine] = useState(null);

  useEffect(() => {
    setLine(t("themes.potager.weather_line_fallback"));
  }, [t]);

  return (
    <div className="potager-weather-block" aria-live="polite">
      <p className="potager-weather-line">{line ?? t("themes.potager.weather_loading_short")}</p>
    </div>
  );
}
