import { useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

const RarityColors = {
  commun: "#3D7A5C",
  peu_commun: "#5A9E78",
  rare: "#E07A3A",
  tres_rare: "#C45C8A",
};

function WorldMapLeaflet({ discoveries, t, onSelectDiscovery }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const geoDiscoveries = useMemo(
    () =>
      discoveries.filter(
        (d) => d.latitude != null && d.longitude != null && Number.isFinite(Number(d.latitude))
      ),
    [discoveries]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, { zoomControl: true });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = [];
      for (const d of geoDiscoveries) {
        const lat = Number(d.latitude);
        const lon = Number(d.longitude);
        const color = RarityColors[d.rarete] || RarityColors.commun;
        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: color,
          color: "#F5F2EB",
          weight: 2,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindPopup(`<strong>${d.nom || "—"}</strong>`);
        marker.on("click", () => onSelectDiscovery?.(d));
        markersRef.current.push(marker);
        bounds.push([lat, lon]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 11);
      } else {
        map.setView([46.6, 2.5], 5);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoDiscoveries, onSelectDiscovery]);

  return (
    <div className="world-map-wrap">
      <p className="world-map-stats">
        {geoDiscoveries.length > 0
          ? t("world_map.count", { count: geoDiscoveries.length })
          : t("world_map.empty")}
      </p>
      <div ref={mapRef} className="world-map-container" />
    </div>
  );
}

const WorldMapDynamic = dynamic(() => Promise.resolve(WorldMapLeaflet), { ssr: false });

export default function WorldDiscoveriesMap(props) {
  return <WorldMapDynamic {...props} />;
}
