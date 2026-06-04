import { useMemo } from "react";
import { getRootAlbums } from "@/lib/themes";
import { getRandoPlaceName } from "@/lib/randoJournal";

function formatDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getAlbumDisplayName(album) {
  return album.nom || album.name || "Rando";
}

function RandoCard({ album, discoveries, locale, t, onOpen }) {
  const name = getAlbumDisplayName(album);
  const count = (album.discoveryIds || []).length;
  const place =
    getRandoPlaceName(album, discoveries) || t("themes.randos.place_unknown");
  const dateIso = album.endedAt || album.createdAt;

  return (
    <li>
      <button type="button" className="randos-past-card" onClick={() => onOpen(album.id)}>
        <div className="randos-past-card-main">
          <h3 className="randos-past-card-name">{name}</h3>
          <p className="randos-past-card-place">
            <span aria-hidden="true">📍</span> {place}
          </p>
        </div>
        <div className="randos-past-card-meta">
          <time dateTime={dateIso}>{formatDate(dateIso, locale)}</time>
          <span className="randos-past-card-count">
            {count}{" "}
            {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
          </span>
        </div>
      </button>
    </li>
  );
}

export default function RandosView({
  albums,
  discoveries,
  locale,
  t,
  onStartScan,
  onStartRando,
  onOpenAlbum,
  activeRandoAlbumId,
  distanceKm,
  onResumeRando,
  onEndRando,
  onShowMap,
}) {
  const pastRandos = useMemo(
    () =>
      getRootAlbums(albums, "randos")
        .filter((a) => a.id !== activeRandoAlbumId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [albums, activeRandoAlbumId]
  );

  const formatDistance = (km) => {
    if (km == null) return null;
    if (km < 1) {
      return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
    }
    return t("themes.randos.distance_km", { km });
  };

  return (
    <div className="randos-simple">
      <button type="button" className="randos-scan-cta" onClick={() => onStartScan?.()}>
        <span className="randos-scan-cta-emoji" aria-hidden="true">
          📸
        </span>
        <span className="randos-scan-cta-label">{t("themes.randos.scan_cta")}</span>
      </button>

      {activeRandoAlbumId && (
        <div className="randos-active-strip">
          <div className="randos-active-strip-info">
            <span className="randos-active-pulse" aria-hidden="true" />
            <div>
              <p className="randos-active-strip-label">{t("themes.randos.active")}</p>
              {distanceKm != null && (
                <p className="randos-active-strip-distance">{formatDistance(distanceKm)}</p>
              )}
            </div>
          </div>
          <div className="randos-active-strip-actions">
            {onShowMap && (
              <button
                type="button"
                className="randos-active-strip-map"
                onClick={onShowMap}
                aria-label={t("themes.randos.show_map")}
              >
                🗺️
              </button>
            )}
            <button type="button" className="randos-active-strip-resume" onClick={onResumeRando}>
              {t("themes.randos.resume")}
            </button>
            <button type="button" className="randos-active-strip-end" onClick={onEndRando}>
              {t("themes.randos.end")}
            </button>
          </div>
        </div>
      )}

      <section className="randos-past-section" aria-label={t("themes.randos.past_list")}>
        {pastRandos.length > 0 && (
          <h2 className="randos-past-heading">{t("themes.randos.past_section")}</h2>
        )}

        {pastRandos.length === 0 && !activeRandoAlbumId ? (
          <p className="randos-past-empty">{t("themes.randos.empty_hint")}</p>
        ) : pastRandos.length === 0 ? null : (
          <ul className="randos-past-list">
            {pastRandos.map((album) => (
              <RandoCard
                key={album.id}
                album={album}
                discoveries={discoveries}
                locale={locale}
                t={t}
                onOpen={onOpenAlbum}
              />
            ))}
          </ul>
        )}
      </section>

      {!activeRandoAlbumId && (
        <button type="button" className="randos-start-cta" onClick={onStartRando}>
          <span className="randos-start-cta-emoji" aria-hidden="true">
            🥾
          </span>
          {t("themes.randos.start")}
        </button>
      )}
    </div>
  );
}
