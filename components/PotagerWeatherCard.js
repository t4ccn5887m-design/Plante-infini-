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

export default function PotagerWeatherCard({ t }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let loc = loadStoredLocation();
      if (!loc?.latitude || !loc?.longitude) {
        const result = await requestLocationPermission();
        if (cancelled) return;
        if (result.ok) {
          loc = result.location;
        }
      }

      if (!loc?.latitude || !loc?.longitude) {
        setState({ status: "no_location" });
        return;
      }

      setState({ status: "loading", placeName: loc.placeName });

      try {
        const forecast = await fetchForecast(loc.latitude, loc.longitude);
        if (cancelled) return;
        const adviceType = getGardenAdviceType(forecast);
        setState({
          status: "ready",
          placeName: loc.placeName,
          forecast,
          adviceType,
        });
      } catch {
        if (!cancelled) setState({ status: "error", placeName: loc.placeName });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <section className="potager-weather" aria-busy="true" aria-label={t("themes.potager.weather_title")}>
        <p className="potager-weather-loading">{t("themes.potager.weather_loading")}</p>
      </section>
    );
  }

  if (state.status === "no_location") {
    return (
      <section className="potager-weather potager-weather--muted" aria-label={t("themes.potager.weather_title")}>
        <p>{t("themes.potager.weather_no_location")}</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="potager-weather potager-weather--muted" aria-label={t("themes.potager.weather_title")}>
        <p>{t("themes.potager.weather_error")}</p>
      </section>
    );
  }

  const { forecast, adviceType, placeName } = state;
  const tempNow = forecast.current.temperature_2m;
  const tempMax = forecast.daily.temperature_2m_max?.[0];
  const tempMin = forecast.daily.temperature_2m_min?.[0];
  const code = forecast.current.weather_code;
  const emoji = weatherEmoji(code);

  const adviceKey = adviceType
    ? `themes.potager.weather_advice_${adviceType}`
    : null;

  return (
    <section className="potager-weather" aria-label={t("themes.potager.weather_title")}>
      <div className="potager-weather-main">
        <span className="potager-weather-emoji" aria-hidden="true">
          {emoji}
        </span>
        <div className="potager-weather-temps">
          <p className="potager-weather-now">
            {tempNow != null ? `${Math.round(tempNow)}°` : "—"}
          </p>
          {tempMin != null && tempMax != null && (
            <p className="potager-weather-range">
              {t("themes.potager.weather_range", {
                min: Math.round(tempMin),
                max: Math.round(tempMax),
              })}
            </p>
          )}
        </div>
        <div className="potager-weather-meta">
          <h3 className="potager-weather-heading">{t("themes.potager.weather_today")}</h3>
          {placeName && <p className="potager-weather-place">{placeName}</p>}
        </div>
      </div>
      {adviceKey && (
        <p className={`potager-weather-advice potager-weather-advice--${adviceType}`}>
          {t(adviceKey)}
        </p>
      )}
    </section>
  );
}
