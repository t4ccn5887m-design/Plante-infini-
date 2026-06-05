import { useState, useEffect, useCallback } from "react";
import { loadStoredLocation, requestLocationPermission } from "@/lib/permissions";
import { fetchNurseriesNearby } from "@/lib/nurseriesNearby";
import { IconSprout } from "@/components/ThemeIcons";

function NurseryCard({ nursery, t, i18nPrefix }) {
  const distance =
    nursery.distanceKm < 1
      ? t(`${i18nPrefix}.nurseries_distance_m`, {
          m: Math.round(nursery.distanceKm * 1000),
        })
      : t(`${i18nPrefix}.nurseries_distance_km`, { km: nursery.distanceKm });

  return (
    <article className="nurseries-card">
      <div className="nurseries-card-head">
        <span className="nurseries-card-emoji" aria-hidden="true">
          <IconSprout size={20} />
        </span>
        <div className="nurseries-card-meta">
          <h3 className="nurseries-card-name">{nursery.name}</h3>
          <p className="nurseries-card-distance">{distance}</p>
        </div>
      </div>
      {nursery.address && (
        <p className="nurseries-card-address">{nursery.address}</p>
      )}
    </article>
  );
}

export default function NurseriesNearbyCard({ t, i18nPrefix = "themes.potager" }) {
  const [nurseries, setNurseries] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    let loc = loadStoredLocation();
    if (!loc?.latitude || !loc?.longitude) {
      const result = await requestLocationPermission();
      if (result.ok) loc = result.location;
    }

    if (!loc?.latitude || !loc?.longitude) {
      setNurseries([]);
      setStatus("no_location");
      return;
    }

    try {
      const list = await fetchNurseriesNearby(loc.latitude, loc.longitude);
      setNurseries(list);
      setStatus(list.length ? "ready" : "empty");
    } catch (e) {
      setNurseries([]);
      setError(e?.message || "error");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="nurseries-nearby" aria-labelledby="nurseries-nearby-heading">
      <div className="nurseries-nearby-head">
        <h2 id="nurseries-nearby-heading" className="nurseries-nearby-title">
          {t(`${i18nPrefix}.nurseries_title`)}
        </h2>
        <p className="nurseries-nearby-subtitle">{t(`${i18nPrefix}.nurseries_subtitle`)}</p>
      </div>

      {status === "no_location" && (
        <div className="nurseries-nearby-muted">
          <p>{t(`${i18nPrefix}.nurseries_no_location`)}</p>
          <button type="button" className="nurseries-nearby-location-btn" onClick={load}>
            {t(`${i18nPrefix}.nurseries_enable_location`)}
          </button>
        </div>
      )}

      {status === "loading" && (
        <p className="nurseries-nearby-loading">{t(`${i18nPrefix}.nurseries_loading`)}</p>
      )}

      {status === "error" && (
        <div className="nurseries-nearby-error-wrap">
          <p className="nurseries-nearby-error">{t(`${i18nPrefix}.nurseries_error`)}</p>
          <button type="button" className="nurseries-nearby-retry" onClick={load}>
            {t(`${i18nPrefix}.nurseries_retry`)}
          </button>
        </div>
      )}

      {status === "empty" && (
        <p className="nurseries-nearby-empty">{t(`${i18nPrefix}.nurseries_empty`)}</p>
      )}

      {status === "ready" && (
        <div className="nurseries-nearby-list">
          {nurseries.map((nursery) => (
            <NurseryCard
              key={nursery.id}
              nursery={nursery}
              t={t}
              i18nPrefix={i18nPrefix}
            />
          ))}
        </div>
      )}
    </section>
  );
}
