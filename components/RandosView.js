import { useMemo } from "react";
import { getRootAlbums } from "@/lib/themes";
import { computeRandoDistanceKm } from "@/lib/randos";

function IconRoute({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a1 1 0 0 0 .74-.33l4.15-4.65a1 1 0 0 0 .26-.74V5a1 1 0 0 0-1-1H14" />
      <path d="m9 16 3-6 4 2 3-7" />
    </svg>
  );
}

function IconLeaf({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    </svg>
  );
}

function IconAlbums({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

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

function getCoverPhoto(album, discoveries) {
  if (album.coverPhoto) return album.coverPhoto;
  for (const id of album.discoveryIds || []) {
    const d = discoveries.find((x) => x.id === id);
    if (d?.photo) return d.photo;
  }
  return null;
}

function formatDistance(km, t) {
  if (km == null) return t("themes.randos.distance_unknown");
  if (km < 1) {
    return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
  }
  return t("themes.randos.distance_km", { km });
}

function RandoCard({ album, discoveries, locale, t, onOpen }) {
  const name = getAlbumDisplayName(album);
  const cover = getCoverPhoto(album, discoveries);
  const count = (album.discoveryIds || []).length;
  const distanceKm = computeRandoDistanceKm(album, discoveries);

  return (
    <button type="button" className="rando-card" onClick={() => onOpen(album.id)}>
      <div className="rando-card-cover-wrap">
        {cover ? (
          <img src={cover} alt="" className="rando-card-cover" />
        ) : (
          <div className="rando-card-cover rando-card-cover--placeholder" aria-hidden="true">
            <span className="rando-card-cover-emoji">🥾</span>
            <IconAlbums size={32} />
          </div>
        )}
        <div className="rando-card-cover-shade" aria-hidden="true" />
        <h3 className="rando-card-title">{name}</h3>
      </div>
      <div className="rando-card-meta">
        <span className="rando-card-meta-item">
          <span className="rando-card-meta-label">{t("themes.randos.date_label")}</span>
          <time dateTime={album.createdAt}>{formatDate(album.createdAt, locale)}</time>
        </span>
        <span className="rando-card-meta-item rando-card-meta-item--distance">
          <IconRoute size={15} />
          <span>{formatDistance(distanceKm, t)}</span>
        </span>
        <span className="rando-card-meta-item rando-card-meta-item--discoveries">
          <IconLeaf size={14} />
          <span>
            {count}{" "}
            {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function RandosView({ albums, discoveries, locale, t, onOpenAlbum }) {
  const pastRandos = useMemo(
    () =>
      getRootAlbums(albums, "randos").sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [albums]
  );

  return (
    <div className="randos-view">
      {pastRandos.length === 0 ? (
        <div className="randos-empty">
          <span className="randos-empty-icon" aria-hidden="true">
            🥾
          </span>
          <p className="randos-empty-title">{t("themes.randos.empty_title")}</p>
          <p className="randos-empty-hint">{t("themes.randos.empty_examples")}</p>
        </div>
      ) : (
        <ul className="randos-list" aria-label={t("themes.randos.past_list")}>
          {pastRandos.map((album) => (
            <li key={album.id}>
              <RandoCard
                album={album}
                discoveries={discoveries}
                locale={locale}
                t={t}
                onOpen={onOpenAlbum}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RandosStartButton({ t, onStartRando }) {
  return (
    <div className="randos-start-bar">
      <button type="button" className="randos-start-btn" onClick={onStartRando}>
        <span className="randos-start-btn-icon" aria-hidden="true">
          🥾
        </span>
        {t("themes.randos.start")}
      </button>
    </div>
  );
}

export function RandosActiveBar({ t, distanceKm, onResume, onEnd, onShowMap }) {
  return (
    <div className="randos-active-bar">
      <div className="randos-active-info">
        <span className="randos-active-pulse" aria-hidden="true" />
        <div>
          <p className="randos-active-label">{t("themes.randos.active")}</p>
          {distanceKm != null && (
            <p className="randos-active-distance">
              {distanceKm < 1
                ? t("themes.randos.distance_m", { m: Math.max(1, Math.round(distanceKm * 1000)) })
                : t("themes.randos.distance_km", { km: distanceKm })}
            </p>
          )}
        </div>
      </div>
      <div className="randos-active-actions">
        <button type="button" className="randos-active-map-btn" onClick={onShowMap}>
          🗺️
        </button>
        <button type="button" className="randos-active-resume-btn" onClick={onResume}>
          {t("themes.randos.resume")}
        </button>
        <button type="button" className="randos-active-end-btn" onClick={onEnd}>
          {t("themes.randos.end")}
        </button>
      </div>
    </div>
  );
}
