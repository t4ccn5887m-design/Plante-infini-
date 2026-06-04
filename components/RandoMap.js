import { useEffect, useRef, useState } from "react";

const DISCOVERY_MARKER_HTML = `<div class="rando-discovery-marker" aria-hidden="true">🌿</div>`;

const USER_MARKER_HTML = `<div class="rando-user-marker" aria-hidden="true"><span class="rando-user-dot"></span><span class="rando-user-pulse"></span></div>`;

function getTileUrl(theme) {
  if (theme === "light") {
    return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  }
  return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
}

function getAttribution() {
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
}

export default function RandoMap({
  track = [],
  discoveries = [],
  live = false,
  theme = "dark",
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const glowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const discoveryMarkersRef = useRef([]);
  const hasFitRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let map = null;
    let cancelled = false;
    let resizeObserver = null;

    const invalidateMapSize = () => {
      if (map && !cancelled) map.invalidateSize();
    };

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(getTileUrl(theme), {
        attribution: getAttribution(),
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      glowRef.current = L.polyline([], {
        color: "#3D7A5C",
        weight: 8,
        opacity: 0.25,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      polylineRef.current = L.polyline([], {
        color: "#6BCF8E",
        weight: 4,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      const userIcon = L.divIcon({
        className: "rando-user-marker-wrap",
        html: USER_MARKER_HTML,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([0, 0], {
        icon: userIcon,
        zIndexOffset: 1000,
      });

      mapRef.current = map;
      setMapReady(true);
      requestAnimationFrame(invalidateMapSize);
      setTimeout(invalidateMapSize, 120);
      setTimeout(invalidateMapSize, 400);

      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(invalidateMapSize);
        resizeObserver.observe(containerRef.current);
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      polylineRef.current = null;
      glowRef.current = null;
      userMarkerRef.current = null;
      discoveryMarkersRef.current = [];
      hasFitRef.current = false;
    };
  }, [theme]);

  useEffect(() => {
    if (!mapReady) return undefined;

    let cancelled = false;
    const map = mapRef.current;
    const polyline = polylineRef.current;
    const glow = glowRef.current;
    const userMarker = userMarkerRef.current;
    if (!map || !polyline || !glow) return undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      discoveryMarkersRef.current.forEach((m) => map.removeLayer(m));
      const discoveryIcon = L.divIcon({
        className: "rando-discovery-marker-wrap",
        html: DISCOVERY_MARKER_HTML,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      discoveryMarkersRef.current = discoveries
        .filter((d) => d.latitude != null && d.longitude != null)
        .map((d) =>
          L.marker([d.latitude, d.longitude], { icon: discoveryIcon }).addTo(map)
        );

      const latlngs = track.map((p) => [p.latitude, p.longitude]);

      if (latlngs.length > 0) {
        polyline.setLatLngs(latlngs);
        glow.setLatLngs(latlngs);

        const last = latlngs[latlngs.length - 1];
        if (live && userMarker) {
          userMarker.setLatLng(last);
          if (!map.hasLayer(userMarker)) userMarker.addTo(map);
          if (latlngs.length === 1) {
            map.setView(last, 16);
          } else if (latlngs.length > 1) {
            map.panTo(last, { animate: true, duration: 0.4 });
          }
        } else if (userMarker && map.hasLayer(userMarker)) {
          map.removeLayer(userMarker);
        }

        if (!hasFitRef.current || live) {
          const bounds = latlngs.slice();
          discoveries.forEach((d) => {
            if (d.latitude != null && d.longitude != null) {
              bounds.push([d.latitude, d.longitude]);
            }
          });
          if (bounds.length === 1) {
            map.setView(bounds[0], 16);
          } else if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [48, 48], maxZoom: live ? 17 : 15 });
          }
          if (!live) hasFitRef.current = true;
        }
      } else if (live && userMarker && map.hasLayer(userMarker)) {
        map.removeLayer(userMarker);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, track, discoveries, live]);

  return (
    <div
      ref={containerRef}
      className={`rando-map-container${className ? ` ${className}` : ""}`}
      aria-hidden={track.length === 0 && discoveries.length === 0 ? "true" : undefined}
    />
  );
}
