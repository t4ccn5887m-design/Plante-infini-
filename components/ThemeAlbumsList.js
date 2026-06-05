import { useMemo } from "react";
import { getRootAlbums } from "@/lib/themes";
import { getAlbumDisplayName, getFirstDiscoveryPhoto } from "@/lib/albumUtils";
import SwipeToDelete from "@/components/SwipeToDelete";

function IconAlbums({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 15l5-4 4 3 5-6 4 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlus({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export default function ThemeAlbumsList({
  themeId,
  themeEmoji,
  albums,
  discoveries,
  locale,
  t,
  creatingAlbum,
  setCreatingAlbum,
  newAlbumName,
  setNewAlbumName,
  onCreateAlbum,
  onOpenAlbum,
  onDeleteAlbum,
  swipeLabels,
  defaultAlbumName,
  showDate = true,
  excludeAlbumIds = [],
}) {
  const exclude = useMemo(() => new Set(excludeAlbumIds), [excludeAlbumIds]);

  const rootAlbums = useMemo(
    () =>
      getRootAlbums(albums, themeId)
        .filter((a) => !exclude.has(a.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [albums, themeId, exclude]
  );

  const formatDate = (iso) => {
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
  };

  return (
    <section className="albums-list theme-albums-list" aria-label={t("albums.title")}>
      {rootAlbums.length === 0 && !creatingAlbum ? (
        <div className="albums-empty theme-albums-empty">
          <div className="theme-albums-empty-icon" aria-hidden="true">
            <IconAlbums size={36} />
          </div>
          <p>{t("albums.empty")}</p>
          <p className="album-examples">{t(`themes.${themeId}.empty_examples`)}</p>
        </div>
      ) : (
        rootAlbums.map((album) => {
          const count = (album.discoveryIds || []).length;
          const coverPhoto = getFirstDiscoveryPhoto(album, discoveries);
          const card = (
            <button
              type="button"
              className="album-card"
              onClick={() => onOpenAlbum(album.id)}
            >
              {coverPhoto ? (
                <img src={coverPhoto} alt="" className="album-cover" />
              ) : (
                <div className="album-cover album-cover-placeholder">
                  <IconAlbums size={28} />
                </div>
              )}
              <div className="album-info">
                <h3>{getAlbumDisplayName(album)}</h3>
                <p>
                  {count}{" "}
                  {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
                  {showDate && album.createdAt ? ` · ${formatDate(album.createdAt)}` : ""}
                </p>
              </div>
            </button>
          );

          if (!onDeleteAlbum) {
            return <div key={album.id}>{card}</div>;
          }

          return (
            <SwipeToDelete
              key={album.id}
              onDelete={() => onDeleteAlbum(album.id)}
              {...swipeLabels}
            >
              {card}
            </SwipeToDelete>
          );
        })
      )}

      {creatingAlbum ? (
        <>
          <input
            className="modal-input"
            placeholder={defaultAlbumName}
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setCreatingAlbum(false)}>
              {t("albums.cancel")}
            </button>
            <button type="button" className="btn-primary" onClick={() => onCreateAlbum(themeId)}>
              {t("albums.create")}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="btn-create-album" onClick={() => setCreatingAlbum(true)}>
          <IconPlus size={18} /> {t("albums.create")}
        </button>
      )}
    </section>
  );
}
