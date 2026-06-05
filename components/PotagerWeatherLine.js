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

function formatRainfallLine(t, mm) {
  const amount = mm != null ? Number(mm) : 0;
  if (!Number.isFinite(amount) || amount < 0.1) {
    return t("themes.potager.rain_yesterday_none");
  }
  const rounded = Math.round(amount * 10) / 10;
  return t("themes.potager.rain_yesterday", { mm: rounded });
}

/** Weather + yesterday rainfall for the potager home screen */
export default function PotagerWeatherLine({ t }) {
  const [line, setLine] = useState(null);
  const [rainLine, setRainLine] = useState(null);

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
        setRainLine(null);
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
        setRainLine(formatRainfallLine(t, forecast.yesterdayPrecipitation));
      } catch {
        if (!cancelled) {
          setLine(t("themes.potager.weather_line_fallback"));
          setRainLine(null);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="potager-weather-block" aria-live="polite">
      <p className="potager-weather-line">
        {line ?? t("themes.potager.weather_loading_short")}
      </p>
      {rainLine && <p className="potager-rain-line">{rainLine}</p>}
    </div>
  );
}
