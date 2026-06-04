import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SwipeToDelete from "@/components/SwipeToDelete";
import { getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { computeRandoDistanceKm, computeRandoDurationMs, formatRandoDuration } from "@/lib/randos";
import {
  buildTrackSvg,
  getAlbumDisplayName,
  getRandoJournalDiscoveries,
  getRandoPlaceName,
  printRandoJournal,
  shareRandoJournal,
} from "@/lib/randoJournal";

const RandoMap = dynamic(() => import("@/components/RandoMap"), { ssr: false });

function formatJournalDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDistance(km, t) {
  if (km == null) return t("themes.randos.distance_unknown");
  if (km < 1) {
    return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
  }
  return t("themes.randos.distance_km", { km });
}

function IconShare({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function RandoJournal({
  album,
  discoveries,
  locale,
  t,
  onClose,
  onDeleteDiscovery,
  swipeLabels,
}) {
  const [sharing, setSharing] = useState(false);

  const items = useMemo(
    () => getRandoJournalDiscoveries(album, discoveries),
    [album, discoveries]
  );

  const placeName = useMemo(
    () => getRandoPlaceName(album, discoveries),
    [album, discoveries]
  );

  const distanceKm = useMemo(
    () => computeRandoDistanceKm(album, discoveries),
    [album, discoveries]
  );

  const durationLabel = useMemo(() => {
    const ms = computeRandoDurationMs(album);
    return formatRandoDuration(ms, t);
  }, [album, t]);

  const track = album?.gpsTrack || [];
  const hasMap =
    track.length > 0 || items.some((d) => d.latitude != null && d.longitude != null);

  const trackSvg = useMemo(
    () => buildTrackSvg(track, items),
    [track, items]
  );

  const typeLabel = useCallback((type) => getTypeLabel(t, type || "plante"), [t]);
  const rarityLabel = useCallback((r) => getRarityLabel(t, r || "commun"), [t]);

  const dateIso = album?.endedAt || album?.createdAt;
  const name = getAlbumDisplayName(album);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareRandoJournal({
        album,
        items,
        discoveries,
        t,
        locale,
        getTypeLabel: typeLabel,
        getRarityLabel: rarityLabel,
      });
    } catch (err) {
      if (err?.name !== "AbortError") console.error("[Wilder] journal share:", err);
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    printRandoJournal();
  };

  return (
    <div className="rando-journal-overlay" role="presentation">
      <div
        className="rando-journal rando-journal--summary"
        role="dialog"
        aria-labelledby="rando-journal-title"
        aria-modal="true"
      >
        <div className="rando-journal-toolbar no-print">
          <button
            type="button"
            className="rando-journal-toolbar-btn"
            onClick={onClose}
            aria-label={t("themes.randos.journal_close")}
          >
            ✕
          </button>
          <button
            type="button"
            className="rando-journal-toolbar-btn rando-journal-toolbar-btn--ghost"
            onClick={handlePrint}
          >
            {t("themes.randos.journal_print")}
          </button>
        </div>

        <div className="rando-journal-scroll">
          <header className="rando-journal-header rando-journal-header--summary">
            <span className="rando-journal-emoji" aria-hidden="true">
              🥾
            </span>
            <p className="rando-journal-kicker">{t("themes.randos.summary_title")}</p>
            <h1 id="rando-journal-title" className="rando-journal-name">
              {name}
            </h1>
            <time className="rando-journal-date" dateTime={dateIso}>
              {formatJournalDate(dateIso, locale)}
            </time>
            {placeName && (
              <p className="rando-journal-place">
                <span aria-hidden="true">📍</span> {placeName}
              </p>
            )}
            <div className="rando-journal-stats rando-journal-stats--summary">
              {durationLabel && (
                <span className="rando-journal-stat">
                  <span className="rando-journal-stat-label">{t("themes.randos.duration_label")}</span>
                  {durationLabel}
                </span>
              )}
              {distanceKm != null && (
                <span className="rando-journal-stat">{formatDistance(distanceKm, t)}</span>
              )}
              <span className="rando-journal-stat rando-journal-stat--highlight">
                {items.length}{" "}
                {items.length !== 1
                  ? t("albums.discoveries_plural")
                  : t("albums.discoveries")}
              </span>
            </div>
          </header>

          <button
            type="button"
            className="rando-journal-share-cta no-print"
            onClick={handleShare}
            disabled={sharing}
          >
            <IconShare size={22} />
            {sharing ? t("themes.randos.journal_share_generating") : t("themes.randos.journal_share_cta")}
          </button>

          {items.length > 0 && (
            <section className="rando-journal-gallery" aria-label={t("themes.randos.journal_discoveries_title")}>
              <div className="rando-journal-gallery-grid">
                {items.map((d) => (
                  <figure key={d.id} className="rando-journal-gallery-item">
                    {d.photo ? (
                      <img src={d.photo} alt="" className="rando-journal-gallery-photo" />
                    ) : (
                      <div className="rando-journal-gallery-photo rando-journal-gallery-photo--empty" aria-hidden="true">
                        🌿
                      </div>
                    )}
                    <figcaption className="rando-journal-gallery-caption">{d.nom}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {hasMap && (
            <section className="rando-journal-map-section no-print">
              <h2 className="rando-journal-section-title">
                {t("themes.randos.journal_map_title")}
              </h2>
              <div className="rando-journal-map-live">
                <RandoMap
                  track={track}
                  discoveries={items}
                  live={false}
                  theme="light"
                  className="rando-map-container--journal"
                />
              </div>
              {trackSvg && (
                <div
                  className="rando-journal-map-print only-print"
                  dangerouslySetInnerHTML={{ __html: trackSvg }}
                />
              )}
            </section>
          )}

          {items.length === 0 ? (
            <p className="rando-journal-empty">{t("themes.randos.journal_empty_discoveries")}</p>
          ) : (
            <section className="rando-journal-discoveries-section only-print">
              <h2 className="rando-journal-section-title">
                {t("themes.randos.journal_discoveries_title")}
              </h2>
              <div className="rando-journal-discovery-list">
                {items.map((d, i) => {
                  const article = (
                    <article className="rando-journal-discovery">
                      <div className="rando-journal-discovery-num" aria-hidden="true">
                        {i + 1}
                      </div>
                      <div className="rando-journal-discovery-content">
                        {d.photo && (
                          <img src={d.photo} alt="" className="rando-journal-discovery-photo" />
                        )}
                        <div className="rando-journal-discovery-text">
                          <h3 className="rando-journal-discovery-name">{d.nom}</h3>
                          {d.description && (
                            <p className="rando-journal-discovery-desc">{d.description}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                  if (!onDeleteDiscovery) {
                    return <div key={d.id}>{article}</div>;
                  }
                  return (
                    <div key={d.id} className="rando-journal-discovery-wrap">
                      <SwipeToDelete
                        onDelete={() => onDeleteDiscovery(d.id)}
                        {...swipeLabels}
                      >
                        {article}
                      </SwipeToDelete>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <footer className="rando-journal-footer">
            <span className="rando-journal-footer-brand">Wilder</span>
            <p>{t("themes.randos.journal_footer")}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
