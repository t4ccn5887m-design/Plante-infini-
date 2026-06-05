import { useState, useEffect, useCallback } from "react";
import { getCurrentLocation, requestLocationPermission } from "@/lib/permissions";
import { loadNearbyTrailsWithDescriptions } from "@/lib/randosNearby";

function formatTrailDuration(minutes, t) {
  if (minutes == null) return null;
  const totalMin = Math.max(1, Math.round(minutes));
  if (totalMin < 60) {
    return t("themes.randos.duration_minutes", { m: totalMin });
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return t("themes.randos.duration_hours", { h, m });
}

function formatDistance(km, t) {
  if (km == null) return null;
  if (km < 1) {
    return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
  }
  return t("themes.randos.distance_km", { km });
}

function TrailCard({ trail, t, onStartTrail, startingId }) {
  const duration = formatTrailDuration(trail.durationMin, t);
  const distance = formatDistance(trail.distanceKm, t);
  const length =
    trail.lengthKm != null
      ? t("themes.randos.nearby_length", { km: trail.lengthKm })
      : null;
  const isStarting = startingId === trail.id;

  return (
    <article className="randos-nearby-card">
      <div className="randos-nearby-card-head">
        <span className="randos-nearby-card-emoji" aria-hidden="true">
          {trail.emoji || "🥾"}
        </span>
        <h3 className="randos-nearby-card-name">{trail.name}</h3>
      </div>

      <p className="randos-nearby-card-meta">
        {distance && (
          <span>{t("themes.randos.nearby_distance", { km: trail.distanceKm })}</span>
        )}
        {length && (
          <>
            <span aria-hidden="true"> · </span>
            <span>{length}</span>
          </>
        )}
        {duration && (
          <>
            <span aria-hidden="true"> · </span>
            <span>{t("themes.randos.nearby_duration", { duration })}</span>
          </>
        )}
      </p>

      {trail.description && (
        <p className="randos-nearby-card-desc">{trail.description}</p>
      )}
      {trail.conseil && (
        <p className="randos-nearby-card-tip">
          <span aria-hidden="true">💡 </span>
          {trail.conseil}
        </p>
      )}

      <button
        type="button"
        className="randos-nearby-card-start"
        onClick={() => onStartTrail?.(trail)}
        disabled={isStarting}
      >
        {isStarting
          ? t("themes.randos.nearby_starting")
          : t("themes.randos.nearby_start_trail")}
      </button>
    </article>
  );
}

export default function RandosNearbyTrails({ t, lang, onStartTrail, disabled }) {
  const [trails, setTrails] = useState([]);
  const [placeName, setPlaceName] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [startingId, setStartingId] = useState(null);

  const load = useCallback(async ({ refresh = false } = {}) => {
    if (disabled) return;
    setStatus("loading");
    setError(null);

    let location = refresh
      ? (await requestLocationPermission()).location
      : await getCurrentLocation();

    if (!location) {
      setNeedsLocation(true);
      setTrails([]);
      setStatus("needs_location");
      return;
    }
    setNeedsLocation(false);
    try {
      const result = await loadNearbyTrailsWithDescriptions(location, lang);
      setTrails(result.trails);
      setPlaceName(result.placeName);
      setStatus(result.trails.length ? "ready" : "empty");
    } catch (e) {
      setTrails([]);
      setError(e?.message || "error");
      setStatus("error");
    }
  }, [lang, disabled]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnableLocation = () => {
    load({ refresh: true });
  };

  const handleStartTrail = async (trail) => {
    setStartingId(trail.id);
    try {
      await onStartTrail?.(trail);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <section className="randos-nearby" aria-labelledby="randos-nearby-heading">
      <div className="randos-nearby-head">
        <h2 id="randos-nearby-heading" className="randos-nearby-title">
          {t("themes.randos.nearby_title")}
        </h2>
        <p className="randos-nearby-subtitle">
          {placeName
            ? t("themes.randos.nearby_subtitle_place", { place: placeName })
            : t("themes.randos.nearby_subtitle")}
        </p>
      </div>

      {status === "needs_location" && (
        <div className="randos-nearby-location">
          <p>{t("themes.randos.nearby_enable_location")}</p>
          <button type="button" className="randos-nearby-location-btn" onClick={handleEnableLocation}>
            {t("themes.randos.nearby_enable_location_btn")}
          </button>
        </div>
      )}

      {status === "loading" && (
        <p className="randos-nearby-loading">{t("themes.randos.nearby_loading")}</p>
      )}

      {status === "error" && (
        <div className="randos-nearby-error-wrap">
          <p className="randos-nearby-error">{t("themes.randos.nearby_error")}</p>
          <button type="button" className="randos-nearby-retry" onClick={() => load({ refresh: true })}>
            {t("themes.randos.nearby_retry")}
          </button>
        </div>
      )}

      {status === "empty" && !needsLocation && (
        <p className="randos-nearby-empty">{t("themes.randos.nearby_empty")}</p>
      )}

      {status === "ready" && trails.length > 0 && (
        <ul className="randos-nearby-list">
          {trails.map((trail) => (
            <li key={trail.id}>
              <TrailCard
                trail={trail}
                t={t}
                onStartTrail={handleStartTrail}
                startingId={startingId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
