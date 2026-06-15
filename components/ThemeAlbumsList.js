import { useMemo } from "react";
import { getRootAlbums } from "@/lib/themes";
import { getAlbumDisplayName, getFirstDiscoveryPhoto } from "@/lib/albumUtils";
import SwipeToDelete from "@/components/SwipeToDelete";
import WilderEmptyState from "@/components/WilderEmptyState";
import { IconAlbums } from "@/components/ThemeIcons";

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
        <WilderEmptyState
          icon={<IconAlbums size={32} color="currentColor" />}
          message={t("albums.empty")}
          hint={t(`themes.${themeId}.empty_examples`)}
          ctaLabel={t("albums.create")}
          onCta={() => setCreatingAlbum(true)}
          className="theme-albums-empty"
        />
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
            className="wilder-field-light"
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
