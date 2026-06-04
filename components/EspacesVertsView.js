import { useMemo, useState } from "react";
import { getRootAlbums } from "@/lib/themes";
import {
  SPACE_KINDS,
  SPACE_KIND_EMOJI,
  computeEspaceVertScore,
  getScoreTier,
  getSpaceKindEmoji,
} from "@/lib/espaceVertScore";

function IconPlus({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function getAlbumDisplayName(album) {
  return album.nom || album.name || "Espace";
}

function getCoverPhoto(album, discoveries) {
  if (album.coverPhoto) return album.coverPhoto;
  for (const id of album.discoveryIds || []) {
    const d = discoveries.find((x) => x.id === id);
    if (d?.photo) return d.photo;
  }
  return null;
}

function ScoreRing({ score, t }) {
  const tier = getScoreTier(score);
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`ev-score-ring ev-score-ring--${tier}`}
      aria-label={t("themes.jardin.score_out_of", { score })}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="ev-score-ring-bg" cx="32" cy="32" r="26" />
        <circle
          className="ev-score-ring-fill"
          cx="32"
          cy="32"
          r="26"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ev-score-value">{score}</span>
      <span className="ev-score-max">/100</span>
    </div>
  );
}

function getSpaceKindLabel(album, t) {
  const kind = album?.spaceKind;
  if (kind && SPACE_KINDS.includes(kind)) {
    return t(`themes.jardin.space_kind_${kind}`);
  }
  return t("themes.jardin.space_kind_jardin");
}

function EspaceCard({ album, discoveries, t, onOpen }) {
  const name = getAlbumDisplayName(album);
  const cover = getCoverPhoto(album, discoveries);
  const score = computeEspaceVertScore(album, discoveries);
  const emoji = getSpaceKindEmoji(album);
  const kindLabel = getSpaceKindLabel(album, t);
  const count = (album.discoveryIds || []).length;

  return (
    <button type="button" className="ev-card" onClick={() => onOpen(album.id)}>
      <div className="ev-card-cover-wrap">
        {cover ? (
          <img src={cover} alt="" className="ev-card-cover" />
        ) : (
          <div className="ev-card-cover ev-card-cover--placeholder" aria-hidden="true">
            <span className="ev-card-cover-emoji">{emoji}</span>
          </div>
        )}
        <div className="ev-card-cover-shade" aria-hidden="true" />
        <span className="ev-card-kind-badge" aria-hidden="true">
          {emoji}
        </span>
        <div className="ev-card-heading">
          <p className="ev-card-kind">{kindLabel}</p>
          <h3 className="ev-card-title">{name}</h3>
        </div>
      </div>
      <div className="ev-card-footer">
        <div className="ev-card-meta">
          <span className="ev-card-meta-label">{t("themes.jardin.score_label")}</span>
          <span className="ev-card-meta-count">
            {count}{" "}
            {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
          </span>
        </div>
        <ScoreRing score={score} t={t} />
      </div>
    </button>
  );
}

function AddSpaceModal({ t, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("jardin");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, spaceKind: kind });
  };

  return (
    <div className="ev-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="ev-modal"
        role="dialog"
        aria-labelledby="ev-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ev-modal-title" className="ev-modal-title">
          {t("themes.jardin.new_space")}
        </h2>
        <label className="ev-modal-label" htmlFor="ev-space-name">
          {t("themes.jardin.space_name")}
        </label>
        <input
          id="ev-space-name"
          className="modal-input ev-modal-input"
          placeholder={t("themes.jardin.space_name_placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <p className="ev-modal-label">{t("themes.jardin.pick_space_kind")}</p>
        <div className="ev-kind-grid" role="group" aria-label={t("themes.jardin.pick_space_kind")}>
          {SPACE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`ev-kind-btn${kind === k ? " active" : ""}`}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
            >
              <span className="ev-kind-emoji" aria-hidden="true">
                {SPACE_KIND_EMOJI[k]}
              </span>
              <span>{t(`themes.jardin.space_kind_${k}`)}</span>
            </button>
          ))}
        </div>
        <div className="modal-actions ev-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("albums.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            {t("themes.jardin.create_space")}
          </button>
        </div>
      </div>
    </div>
  );
}

function HerbariumGrid({ plants, locale, t, onOpenDiscovery }) {
  if (plants.length === 0) {
    return (
      <div className="albums-empty herbarium-empty">
        <span className="herbarium-empty-icon" aria-hidden="true">
          📖
        </span>
        <p>{t("themes.jardin.herbarium_empty")}</p>
      </div>
    );
  }

  return (
    <div className="herbarium-grid">
      {plants.map((d) => (
        <button
          key={d.id}
          type="button"
          className="herbarium-card"
          onClick={() => onOpenDiscovery(d)}
        >
          <div className="herbarium-card-frame">
            <img src={d.photo} alt={d.nom} />
          </div>
          <h3>{d.nom}</h3>
          <p className="herbarium-latin">{d.nom_latin || "—"}</p>
          <p className="herbarium-date">
            {new Date(d.discoveredAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </button>
      ))}
    </div>
  );
}

export default function EspacesVertsView({
  albums,
  discoveries,
  herbariumPlants,
  jardinTab,
  setJardinTab,
  onOpenAlbum,
  onCreateSpace,
  onOpenDiscovery,
  t,
  locale,
}) {
  const [showAddModal, setShowAddModal] = useState(false);

  const espaces = useMemo(
    () =>
      getRootAlbums(albums, "jardin").sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [albums]
  );

  const handleCreate = (data) => {
    onCreateSpace(data);
    setShowAddModal(false);
  };

  return (
    <div className="ev-view">
      <div className="jardin-tabs ev-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={jardinTab === "albums"}
          className={`jardin-tab${jardinTab === "albums" ? " active" : ""}`}
          onClick={() => setJardinTab("albums")}
        >
          🌿 {t("themes.jardin.tab_spaces")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={jardinTab === "herbier"}
          className={`jardin-tab${jardinTab === "herbier" ? " active" : ""}`}
          onClick={() => setJardinTab("herbier")}
        >
          📖 {t("themes.jardin.herbarium")}
        </button>
      </div>

      {jardinTab === "herbier" ? (
        <>
          <p className="theme-herbarium-intro">{t("themes.jardin.herbarium_subtitle")}</p>
          <HerbariumGrid
            plants={herbariumPlants}
            locale={locale}
            t={t}
            onOpenDiscovery={onOpenDiscovery}
          />
        </>
      ) : (
        <>
          {espaces.length === 0 ? (
            <div className="ev-empty">
              <span className="ev-empty-icon" aria-hidden="true">
                🌿
              </span>
              <p className="ev-empty-title">{t("themes.jardin.empty_title")}</p>
              <p className="ev-empty-hint">{t("themes.jardin.empty_examples")}</p>
              <button
                type="button"
                className="ev-add-btn ev-add-btn--inline"
                onClick={() => setShowAddModal(true)}
              >
                <IconPlus size={20} />
                {t("themes.jardin.add_space")}
              </button>
            </div>
          ) : (
            <ul className="ev-list" aria-label={t("themes.jardin.spaces_list")}>
              {espaces.map((album) => (
                <li key={album.id}>
                  <EspaceCard
                    album={album}
                    discoveries={discoveries}
                    t={t}
                    onOpen={onOpenAlbum}
                  />
                </li>
              ))}
            </ul>
          )}

          {espaces.length > 0 && (
            <div className="ev-add-bar">
              <button
                type="button"
                className="ev-add-btn"
                onClick={() => setShowAddModal(true)}
              >
                <IconPlus size={20} />
                {t("themes.jardin.add_space")}
              </button>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddSpaceModal
          t={t}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
