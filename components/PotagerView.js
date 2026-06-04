import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HEALTH,
  POTAGER_EMOJI_PICKER,
  guessEmojiForPlant,
  inferHealthFromEtatSante,
} from "@/lib/potagerHealth";
import {
  POTAGER_BED_COUNT,
  loadPotagerPlants,
  savePotagerPlants,
} from "@/lib/potagerStorage";
import PotagerWeatherCard from "@/components/PotagerWeatherCard";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function IconPlus({ size = 24 }) {
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

function HealthDot({ health, t }) {
  const label =
    health === HEALTH.critical
      ? t("themes.potager.health_critical")
      : health === HEALTH.warning
        ? t("themes.potager.health_warning")
        : t("themes.potager.health_good");
  return (
    <span
      className={`potager-health-dot potager-health-dot--${health}`}
      title={label}
      aria-label={label}
    />
  );
}

function PotagerPlantCard({ plant, onClick, t }) {
  return (
    <button type="button" className="potager-plant-card" onClick={onClick}>
      <span className="potager-plant-emoji" aria-hidden="true">
        {plant.emoji}
      </span>
      <span className="potager-plant-name">{plant.name}</span>
      <HealthDot health={plant.health} t={t} />
    </button>
  );
}

function PotagerAddModal({
  t,
  initialBed,
  editing,
  onClose,
  onSave,
  onDelete,
  onScan,
}) {
  const [name, setName] = useState(editing?.name || "");
  const [emoji, setEmoji] = useState(editing?.emoji || "🌱");
  const [health, setHealth] = useState(editing?.health || HEALTH.good);
  const [bedId, setBedId] = useState(
    editing?.bedId ?? (initialBed != null ? initialBed : 0)
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      id: editing?.id || generateId(),
      name: trimmed,
      emoji,
      health,
      bedId,
      discoveryId: editing?.discoveryId || null,
      addedAt: editing?.addedAt || new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay potager-modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content potager-modal">
        <h2>{editing ? t("themes.potager.edit_plant") : t("themes.potager.add_plant")}</h2>

        <label className="potager-modal-label">{t("themes.potager.plant_name")}</label>
        <input
          className="modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("themes.potager.plant_name_placeholder")}
          autoFocus
        />

        <label className="potager-modal-label">{t("themes.potager.pick_emoji")}</label>
        <div className="potager-emoji-picker" role="listbox" aria-label={t("themes.potager.pick_emoji")}>
          {POTAGER_EMOJI_PICKER.map((e) => (
            <button
              key={e}
              type="button"
              role="option"
              aria-selected={emoji === e}
              className={`potager-emoji-btn${emoji === e ? " selected" : ""}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="potager-modal-label">{t("discovery.health")}</label>
        <div className="potager-health-picker" role="group" aria-label={t("discovery.health")}>
          {[
            { id: HEALTH.good, className: "good" },
            { id: HEALTH.warning, className: "warning" },
            { id: HEALTH.critical, className: "critical" },
          ].map(({ id, className }) => (
            <button
              key={id}
              type="button"
              className={`potager-health-btn potager-health-btn--${className}${health === id ? " active" : ""}`}
              onClick={() => setHealth(id)}
            >
              <span className={`potager-health-dot potager-health-dot--${id}`} aria-hidden="true" />
              {t(`themes.potager.health_${id}`)}
            </button>
          ))}
        </div>

        <label className="potager-modal-label">{t("themes.potager.pick_bed")}</label>
        <div className="potager-bed-picker">
          {Array.from({ length: POTAGER_BED_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`potager-bed-pick${bedId === i ? " active" : ""}`}
              onClick={() => setBedId(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {!editing && (
          <button type="button" className="potager-scan-link" onClick={onScan}>
            📷 {t("themes.potager.scan_plant")}
          </button>
        )}

        <div className="modal-actions">
          {editing && (
            <button type="button" className="btn-secondary potager-btn-delete" onClick={onDelete}>
              {t("themes.potager.delete_plant")}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("albums.cancel")}
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {editing ? t("themes.potager.save") : t("themes.potager.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PotagerView({ discoveries, onOpenDiscovery, onStartScan, t }) {
  const [plants, setPlants] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    setPlants(loadPotagerPlants());
  }, []);

  const persist = useCallback((next) => {
    setPlants(next);
    savePotagerPlants(next);
  }, []);

  const plantsByBed = useMemo(() => {
    const beds = Array.from({ length: POTAGER_BED_COUNT }, () => []);
    for (const p of plants) {
      const idx = Math.min(Math.max(0, p.bedId ?? 0), POTAGER_BED_COUNT - 1);
      beds[idx].push(p);
    }
    return beds;
  }, [plants]);

  const stats = useMemo(() => {
    const good = plants.filter((p) => p.health === HEALTH.good).length;
    return { total: plants.length, good };
  }, [plants]);

  const openAdd = (bedId = null) => setModal({ mode: "add", bedId });
  const openEdit = (plant) => setModal({ mode: "edit", plant });

  const handleSave = (record) => {
    const exists = plants.some((p) => p.id === record.id);
    const next = exists
      ? plants.map((p) => (p.id === record.id ? { ...p, ...record } : p))
      : [...plants, record];
    persist(next);
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal?.plant) return;
    persist(plants.filter((p) => p.id !== modal.plant.id));
    setModal(null);
  };

  const handlePlantClick = (plant) => {
    if (plant.discoveryId) {
      const d = discoveries.find((x) => x.id === plant.discoveryId);
      if (d) {
        onOpenDiscovery(d);
        return;
      }
    }
    openEdit(plant);
  };

  return (
    <div className="potager-view">
      <PotagerWeatherCard t={t} />

      <div className="potager-stats" aria-live="polite">
        <span className="potager-stat">
          <strong>{stats.total}</strong> {t("themes.potager.plants_count")}
        </span>
        {stats.total > 0 && (
          <span className="potager-stat potager-stat--good">
            <span className="potager-health-dot potager-health-dot--good" aria-hidden="true" />
            {stats.good} {t("themes.potager.healthy_count")}
          </span>
        )}
      </div>

      <div className="potager-beds-grid">
        {plantsByBed.map((bedPlants, bedIndex) => (
          <section
            key={bedIndex}
            className="potager-bed"
            aria-label={t("themes.potager.bed_label", { n: bedIndex + 1 })}
          >
            <div className="potager-bed-plank" aria-hidden="true">
              <span className="potager-bed-number">{bedIndex + 1}</span>
            </div>
            <div className="potager-bed-soil">
              {bedPlants.length === 0 ? (
                <button
                  type="button"
                  className="potager-bed-empty"
                  onClick={() => openAdd(bedIndex)}
                >
                  <span className="potager-bed-empty-icon">+</span>
                  <span>{t("themes.potager.empty_bed")}</span>
                </button>
              ) : (
                <div className="potager-bed-plants">
                  {bedPlants.map((plant) => (
                    <PotagerPlantCard
                      key={plant.id}
                      plant={plant}
                      t={t}
                      onClick={() => handlePlantClick(plant)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="potager-fab"
        onClick={() => openAdd()}
        aria-label={t("themes.potager.add_plant")}
      >
        <IconPlus size={28} />
      </button>

      {modal && (
        <PotagerAddModal
          t={t}
          initialBed={modal.bedId}
          editing={modal.mode === "edit" ? modal.plant : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onScan={() => {
            setModal(null);
            onStartScan?.();
          }}
        />
      )}
    </div>
  );
}

export function createPotagerPlantFromDiscovery(discovery) {
  return {
    id: generateId(),
    name: discovery.nom || "Plante",
    emoji: guessEmojiForPlant(discovery.nom, discovery.type),
    health: inferHealthFromEtatSante(discovery.etat_sante),
    bedId: 0,
    discoveryId: discovery.id,
    addedAt: new Date().toISOString(),
  };
}
