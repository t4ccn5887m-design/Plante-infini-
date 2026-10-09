import { useEffect } from "react";
import { Camera, Lightbulb, MapPin, MessageSquare, Sparkles, X } from "lucide-react";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

function GridTile({ bg, border, ink, title, subtitle, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 6,
        padding: "14px 12px",
        borderRadius: 16,
        border: border || "none",
        background: bg,
        color: ink || COLORS.ink,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        minHeight: 88,
      }}
    >
      <span style={{ opacity: 0.85 }} aria-hidden>
        {icon}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{title}</span>
      <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.82, lineHeight: 1.35 }}>{subtitle}</span>
    </button>
  );
}

export default function AjouterAuJardinSheet({
  open,
  onClose,
  onScan,
  onIdees,
  onTerrain,
  onInspiration,
  onMot,
  soonMessage = null,
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(30, 43, 35, 0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 12px calc(10px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajouter-sheet-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: COLORS.screen,
          borderRadius: "22px 22px 20px 20px",
          padding: "18px 16px 20px",
          boxShadow: "0 -8px 40px rgba(0,0,0,.18)",
          maxHeight: "min(92vh, 640px)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 id="ajouter-sheet-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: COLORS.ink }}>
              Ajouter à mon jardin
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 500, color: COLORS.muted, lineHeight: 1.4 }}>
              Tout ce que vous aimez enrichit votre dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 12,
              border: `0.5px solid ${COLORS.border}`,
              background: "#fff",
              color: COLORS.secondary,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {soonMessage ? (
          <p
            role="status"
            style={{
              margin: "14px 0 0",
              padding: "10px 12px",
              borderRadius: 12,
              background: COLORS.hint,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.secondary,
              textAlign: "center",
            }}
          >
            {soonMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onScan}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "18px 16px",
            borderRadius: 18,
            border: "none",
            background: "#2F5E3F",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Camera size={22} strokeWidth={2} aria-hidden />
          </span>
          <span>
            <span style={{ display: "block", fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>
              Scanner une plante
            </span>
            <span style={{ display: "block", marginTop: 6, fontSize: 13, fontWeight: 500, opacity: 0.92, lineHeight: 1.4 }}>
              Vous en croisez une qui vous plaît ? Photo, c&apos;est noté.
            </span>
          </span>
        </button>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <GridTile
            bg="#ECE6F5"
            ink="#7A67A6"
            title="Piocher une idée"
            subtitle="Dans le catalogue"
            icon={<Sparkles size={20} strokeWidth={2} />}
            onClick={onIdees}
          />
          <GridTile
            bg="#F6E7D8"
            ink="#DB7E44"
            title="Mon terrain"
            subtitle="Photos du jardin actuel"
            icon={<MapPin size={20} strokeWidth={2} />}
            onClick={onTerrain}
          />
          <GridTile
            bg="#E6F0E3"
            ink="#4E7B52"
            title="Une inspiration"
            subtitle="Capture, Pinterest, magazine"
            icon={<Lightbulb size={20} strokeWidth={2} />}
            onClick={onInspiration}
          />
          <GridTile
            bg="#fff"
            border={`0.5px solid ${COLORS.borderStrong}`}
            title="Un mot"
            subtitle="Pour mon paysagiste"
            icon={<MessageSquare size={20} strokeWidth={2} />}
            onClick={onMot}
          />
        </div>
      </div>
    </div>
  );
}
