import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SwipeToDelete from "@/components/SwipeToDelete";
import { getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { computeRandoDistanceKm } from "@/lib/randos";
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

function IconPrint({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconShare({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function JournalDiscovery({ discovery, index, t, typeLabel, rarityLabel, locale }) {
  const time = discovery.discoveredAt
    ? new Date(discovery.discoveredAt).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <article className="rando-journal-discovery">
      <div className="rando-journal-discovery-num" aria-hidden="true">
        {index + 1}
      </div>
      <div className="rando-journal-discovery-content">
        {discovery.photo && (
          <img src={discovery.photo} alt="" className="rando-journal-discovery-photo" />
        )}
        <div className="rando-journal-discovery-text">
          <h3 className="rando-journal-discovery-name">{discovery.nom}</h3>
          {discovery.nom_latin && (
            <p className="rando-journal-discovery-latin">{discovery.nom_latin}</p>
          )}
          {time && <p className="rando-journal-discovery-time">{time}</p>}
          <div className="rando-journal-discovery-chips">
            {discovery.type && (
              <span className="rando-journal-chip">{typeLabel(discovery.type)}</span>
            )}
            {(discovery.rarete === "rare" || discovery.rarete === "tres_rare") && (
              <span className="rando-journal-chip rando-journal-chip--rare">
                {rarityLabel(discovery.rarete)}
              </span>
            )}
          </div>
          {discovery.description && (
            <p className="rando-journal-discovery-desc">{discovery.description}</p>
          )}
          {discovery.habitat && (
            <p className="rando-journal-discovery-meta">
              <span className="rando-journal-meta-label">{t("discovery.habitat")}</span>
              {discovery.habitat}
            </p>
          )}
          {discovery.fun_fact && (
            <p className="rando-journal-discovery-fun">
              💡 {discovery.fun_fact}
            </p>
          )}
          {discovery.anecdotes && (
            <p className="rando-journal-discovery-meta">{discovery.anecdotes}</p>
          )}
        </div>
      </div>
    </article>
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
        className="rando-journal"
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
          <div className="rando-journal-toolbar-actions">
            <button
              type="button"
              className="rando-journal-toolbar-btn rando-journal-toolbar-btn--primary"
              onClick={handlePrint}
            >
              <IconPrint size={17} />
              {t("themes.randos.journal_print")}
            </button>
            <button
              type="button"
              className="rando-journal-toolbar-btn rando-journal-toolbar-btn--primary"
              onClick={handleShare}
              disabled={sharing}
            >
              <IconShare size={17} />
              {sharing ? t("themes.randos.journal_share_generating") : t("themes.randos.journal_share")}
            </button>
          </div>
        </div>

        <div className="rando-journal-scroll">
          <header className="rando-journal-header">
            <span className="rando-journal-emoji" aria-hidden="true">
              🥾
            </span>
            <p className="rando-journal-kicker">{t("themes.randos.journal_title")}</p>
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
            <div className="rando-journal-stats">
              <span className="rando-journal-stat">{formatDistance(distanceKm, t)}</span>
              <span className="rando-journal-stat">
                {items.length}{" "}
                {items.length !== 1
                  ? t("albums.discoveries_plural")
                  : t("albums.discoveries")}
              </span>
            </div>
          </header>

          {hasMap && (
            <section className="rando-journal-map-section">
              <h2 className="rando-journal-section-title">
                {t("themes.randos.journal_map_title")}
              </h2>
              <div className="rando-journal-map-live no-print">
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

          <section className="rando-journal-discoveries-section">
            <h2 className="rando-journal-section-title">
              {t("themes.randos.journal_discoveries_title")}
            </h2>
            {items.length === 0 ? (
              <p className="rando-journal-empty">{t("themes.randos.journal_empty_discoveries")}</p>
            ) : (
              <div className="rando-journal-discovery-list">
                {items.map((d, i) => {
                  const article = (
                    <JournalDiscovery
                      discovery={d}
                      index={i}
                      t={t}
                      typeLabel={typeLabel}
                      rarityLabel={rarityLabel}
                      locale={locale}
                    />
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
            )}
          </section>

          <footer className="rando-journal-footer">
            <span className="rando-journal-footer-brand">Wilder</span>
            <p>{t("themes.randos.journal_footer")}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
