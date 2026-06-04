import { useEffect, useRef, useState, useCallback } from "react";
import { distanceKm } from "@/lib/randos";

const MIN_MOVE_KM = 0.4;
const MIN_INTERVAL_MS = 90_000;
const DEBOUNCE_MS = 600;

/**
 * Poll iNaturalist-backed nature alerts when GPS position changes during a hike.
 */
export function useRandoNatureAlerts(position, enabled) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef(null);
  const abortRef = useRef(null);

  const fetchAlerts = useCallback(async (lat, lng) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const month = new Date().getMonth() + 1;
      const res = await fetch(
        `/api/nature-alerts?lat=${lat}&lng=${lng}&month=${month}`,
        { signal: controller.signal }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!controller.signal.aborted) {
        setContext(data);
        lastFetchRef.current = { lat, lng, time: Date.now() };
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        /* ignore transient network errors */
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || position?.latitude == null || position?.longitude == null) {
      setContext(null);
      return undefined;
    }

    const { latitude, longitude } = position;
    const last = lastFetchRef.current;
    if (last) {
      const moved = distanceKm(last.lat, last.lng, latitude, longitude);
      const elapsed = Date.now() - last.time;
      if (moved < MIN_MOVE_KM && elapsed < MIN_INTERVAL_MS) return undefined;
    }

    const timer = setTimeout(() => {
      fetchAlerts(latitude, longitude);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, position?.latitude, position?.longitude, fetchAlerts]);

  useEffect(() => {
    if (!enabled) {
      setContext(null);
      lastFetchRef.current = null;
      abortRef.current?.abort();
    }
  }, [enabled]);

  return { context, loading };
}

export function buildNatureAlerts(context, t) {
  if (!context) return [];

  const alerts = [];

  for (const zone of context.protectedZones || []) {
    alerts.push({
      id: `zone-${zone.id}`,
      type: "protected_zone",
      icon: "🛡️",
      title: t("themes.randos.alert_protected_title"),
      message: t("themes.randos.alert_protected_body", { place: zone.displayName || zone.name }),
    });
  }

  if (context.sensitiveArea && !(context.protectedZones || []).length) {
    alerts.push({
      id: "sensitive-area",
      type: "protected_zone",
      icon: "🛡️",
      title: t("themes.randos.alert_sensitive_title"),
      message: t("themes.randos.alert_sensitive_body"),
    });
  }

  if (context.nestingSeason && (context.birdCount > 0 || (context.protectedZones || []).length)) {
    const birds = (context.nestBirds || [])
      .slice(0, 2)
      .map((s) => s.commonName)
      .join(", ");
    alerts.push({
      id: "nesting-season",
      type: "nesting",
      icon: "🪺",
      title: t("themes.randos.alert_nesting_title"),
      message: birds
        ? t("themes.randos.alert_nesting_body_species", { species: birds })
        : t("themes.randos.alert_nesting_body"),
      species: context.nestBirds,
    });
  }

  for (const sp of (context.rareSpecies || []).slice(0, 2)) {
    alerts.push({
      id: `rare-${sp.id}`,
      type: "rare_species",
      icon: "✨",
      title: t("themes.randos.alert_rare_title"),
      message: t("themes.randos.alert_rare_body", {
        name: sp.commonName,
        count: sp.count,
      }),
      species: sp,
    });
  }

  return alerts;
}
