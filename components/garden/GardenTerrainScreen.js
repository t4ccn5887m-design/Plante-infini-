import { useCallback, useEffect, useRef, useState } from "react";
import { AREA_RANGES, TIMELINES, UTILITIES } from "@/lib/pro/briefLabels";
import {
  loadGardenTerrainFields,
  saveGardenTerrainFields,
} from "@/lib/gardenTerrainFields";
import {
  GARDEN_TERRAIN_MAX_PHOTOS,
  addGardenTerrainPhotosFromFiles,
  listGardenTerrainPhotos,
  removeGardenTerrainPhoto,
} from "@/lib/gardenTerrainPhotos";
import GardenFlowScreen, { GardenBackButton } from "@/components/garden/GardenFlowScreen";

const GREEN = "#2F5E3F";
const MUTED = "#5B6359";

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: active ? `2px solid ${GREEN}` : "1.5px solid #DDD6CB",
        background: active ? "#E6F0E3" : "#FFFFFF",
        color: active ? GREEN : "#1F2A22",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2A22", marginTop: 8 }}>{children}</div>
  );
}

export default function GardenTerrainScreen({ onBack, onChanged }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [fields, setFields] = useState(() => loadGardenTerrainFields());
  const [busy, setBusy] = useState(false);

  const refreshPhotos = useCallback(async () => {
    const list = await listGardenTerrainPhotos();
    setPhotos(list);
  }, []);

  useEffect(() => {
    refreshPhotos();
    return () => {
      photos.forEach((p) => {
        if (p.objectUrl) URL.revokeObjectURL(p.objectUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistFields = (next) => {
    setFields(next);
    saveGardenTerrainFields(next);
    onChanged?.();
  };

  const toggleField = (key, id) => {
    const next = { ...fields, [key]: fields[key] === id ? null : id };
    persistFields(next);
  };

  const addFiles = async (fileList) => {
    if (busy || photos.length >= GARDEN_TERRAIN_MAX_PHOTOS) return;
    setBusy(true);
    photos.forEach((p) => {
      if (p.objectUrl) URL.revokeObjectURL(p.objectUrl);
    });
    const result = await addGardenTerrainPhotosFromFiles(fileList);
    setBusy(false);
    if (result.added) {
      onChanged?.();
      await refreshPhotos();
    }
  };

  const removePhoto = async (id) => {
    const row = photos.find((p) => p.id === id);
    if (row?.objectUrl) URL.revokeObjectURL(row.objectUrl);
    await removeGardenTerrainPhoto(id);
    onChanged?.();
    await refreshPhotos();
  };

  return (
    <GardenFlowScreen>
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GardenBackButton onBack={onBack} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Mon terrain</h1>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: MUTED }}>
          Photos de votre terrain (1 à {GARDEN_TERRAIN_MAX_PHOTOS}), puis quelques infos facultatives — les
          mêmes questions que pour un brief par lien.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            disabled={photos.length >= GARDEN_TERRAIN_MAX_PHOTOS || busy}
            onClick={() => cameraRef.current?.click()}
            style={actionBtnStyle}
          >
            Caméra
          </button>
          <button
            type="button"
            disabled={photos.length >= GARDEN_TERRAIN_MAX_PHOTOS || busy}
            onClick={() => galleryRef.current?.click()}
            style={actionBtnStyle}
          >
            Galerie
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {photos.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {photos.map((p, i) => (
              <div key={p.id} style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.objectUrl}
                  alt={`Photo terrain ${i + 1}`}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                />
                <button
                  type="button"
                  aria-label="Supprimer la photo"
                  onClick={() => removePhoto(p.id)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: "none",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 16,
              border: "1.5px dashed #DDD6CB",
              padding: 20,
              textAlign: "center",
              fontSize: 14,
              color: MUTED,
            }}
          >
            Jusqu&apos;à {GARDEN_TERRAIN_MAX_PHOTOS} photos · caméra ou galerie
          </div>
        )}

        <div style={{ borderTop: "1.5px solid #EEE9E0", paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.8px" }}>
            VOTRE TERRAIN EN BREF
          </span>
          <SectionLabel>Quelle surface souhaitez-vous aménager ?</SectionLabel>
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
            Pas la taille du terrain — juste la partie à transformer.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AREA_RANGES.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={fields.areaRange === o.id}
                onClick={() => toggleField("areaRange", o.id)}
              />
            ))}
          </div>

          <SectionLabel>Pour quand ?</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIMELINES.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={fields.timeline === o.id}
                onClick={() => toggleField("timeline", o.id)}
              />
            ))}
          </div>

          <SectionLabel>Avez-vous un point d&apos;eau et de l&apos;électricité au jardin ?</SectionLabel>
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Utile pour l&apos;arrosage et l&apos;éclairage.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {UTILITIES.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={fields.utilities === o.id}
                onClick={() => toggleField("utilities", o.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </GardenFlowScreen>
  );
}

const actionBtnStyle = {
  flex: 1,
  minHeight: 46,
  borderRadius: 14,
  border: "1.5px solid #DDD6CB",
  background: "#FFFFFF",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
