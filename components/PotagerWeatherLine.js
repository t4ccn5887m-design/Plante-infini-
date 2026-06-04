import { useState, useEffect } from "react";
import { loadStoredLocation, requestLocationPermission } from "@/lib/permissions";
import {
  getGardenAdviceType,
  parseWeatherApiResponse,
  weatherEmoji,
} from "@/lib/potagerWeather";

async function fetchForecast(latitude, longitude) {
  const res = await fetch(
    `/api/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
  );
  if (!res.ok) throw new Error("weather_fetch_failed");
  const data = await res.json();
  return parseWeatherApiResponse(data);
}

/** Single weather line for the potager home screen: "☀️ 21° — Arrosez ce soir" */
export default function PotagerWeatherLine({ t }) {
  const [line, setLine] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let loc = loadStoredLocation();
      if (!loc?.latitude || !loc?.longitude) {
        const result = await requestLocationPermission();
        if (cancelled) return;
        if (result.ok) loc = result.location;
      }
      if (!loc?.latitude || !loc?.longitude) {
        setLine(t("themes.potager.weather_line_fallback"));
        return;
      }

      try {
        const forecast = await fetchForecast(loc.latitude, loc.longitude);
        if (cancelled) return;
        const adviceType = getGardenAdviceType(forecast);
        const temp = forecast.current.temperature_2m;
        const code = forecast.current.weather_code;
        const emoji = weatherEmoji(code);
        const adviceKey = adviceType
          ? `themes.potager.weather_advice_${adviceType}`
          : "themes.potager.weather_advice_default";
        const tempStr = temp != null ? `${Math.round(temp)}°` : "—";
        setLine(
          t("themes.potager.weather_line", {
            emoji,
            temp: tempStr,
            advice: t(adviceKey),
          })
        );
      } catch {
        if (!cancelled) setLine(t("themes.potager.weather_line_fallback"));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <p className="potager-weather-line" aria-live="polite">
      {line ?? t("themes.potager.weather_loading_short")}
    </p>
  );
}
