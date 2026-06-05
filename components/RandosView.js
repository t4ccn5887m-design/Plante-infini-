import ThemeAlbumsList from "@/components/ThemeAlbumsList";
import RandosNearbyTrails from "@/components/RandosNearbyTrails";

export default function RandosView({
  albums,
  discoveries,
  locale,
  t,
  lang,
  themeEmoji,
  onStartScan,
  onStartRando,
  onStartRandoFromTrail,
  onOpenAlbum,
  onDeleteAlbum,
  activeRandoAlbumId,
  distanceKm,
  onResumeRando,
  onEndRando,
  onShowMap,
  creatingAlbum,
  setCreatingAlbum,
  newAlbumName,
  setNewAlbumName,
  onCreateAlbum,
  swipeLabels,
  defaultAlbumName,
}) {
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

      <RandosNearbyTrails
        t={t}
        lang={lang}
        onStartTrail={onStartRandoFromTrail}
        disabled={!!activeRandoAlbumId}
      />

      <ThemeAlbumsList
        themeId="randos"
        themeEmoji={themeEmoji}
        albums={albums}
        discoveries={discoveries}
        locale={locale}
        t={t}
        creatingAlbum={creatingAlbum}
        setCreatingAlbum={setCreatingAlbum}
        newAlbumName={newAlbumName}
        setNewAlbumName={setNewAlbumName}
        onCreateAlbum={onCreateAlbum}
        onOpenAlbum={onOpenAlbum}
        onDeleteAlbum={onDeleteAlbum}
        swipeLabels={swipeLabels}
        defaultAlbumName={defaultAlbumName}
        excludeAlbumIds={activeRandoAlbumId ? [activeRandoAlbumId] : []}
      />

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
