import { useEffect } from "react";

function IconClose() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="#4D554B"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3" stroke="#FFFFFF" strokeWidth={2} />
    </svg>
  );
}

function GridTile({ bg, border, title, titleColor, subtitle, subtitleColor, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
        borderRadius: 22,
        background: bg,
        border: border || "none",
        textDecoration: "none",
        color: "#1F2A22",
        minHeight: 120,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: border ? "#F2EEE7" : "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: titleColor || "#1F2A22" }}>{title}</span>
      <span style={{ fontSize: 13, color: subtitleColor || "#5B6359", lineHeight: 1.35 }}>{subtitle}</span>
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
        background: "rgba(91, 96, 90, 0.92)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "12px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
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
          background: "#FFFFFF",
          borderRadius: 30,
          padding: "10px 18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box",
          maxHeight: "min(88vh, 620px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            alignSelf: "center",
            width: 44,
            height: 5,
            borderRadius: 999,
            background: "#DDD7CC",
            flexShrink: 0,
          }}
          aria-hidden
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span id="ajouter-sheet-title" style={{ fontSize: 22, fontWeight: 700, color: "#1F2A22" }}>
              Ajouter à mon jardin
            </span>
            <span style={{ fontSize: 14, color: "#5B6359" }}>
              Tout ce que vous aimez enrichit votre dossier.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "#F2EEE7",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
        </div>

        {soonMessage ? (
          <p
            role="status"
            style={{
              margin: 0,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#F2F5EF",
              fontSize: 14,
              fontWeight: 600,
              color: "#5B6359",
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
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 18,
            borderRadius: 22,
            background: "#2F5E3F",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            width: "100%",
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconCamera />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Scanner une plante</span>
            <span style={{ fontSize: 14, color: "#D7E7D9" }}>
              Vous en croisez une qui vous plaît ? Photo, c&apos;est noté.
            </span>
          </span>
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <GridTile
            bg="#ECE6F5"
            title="Piocher une idée"
            subtitle="Dans le catalogue"
            subtitleColor="#5E4C8C"
            onClick={onIdees}
            icon={
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"
                  stroke="#6A5896"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <GridTile
            bg="#F6E7D8"
            title="Mon terrain"
            subtitle="Photos du jardin actuel"
            subtitleColor="#8A4A22"
            onClick={onTerrain}
            icon={
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect width={18} height={18} x={3} y={3} rx={2} stroke="#C0652E" strokeWidth={2} />
                <circle cx={9} cy={9} r={2} stroke="#C0652E" strokeWidth={2} />
                <path
                  d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"
                  stroke="#C0652E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <GridTile
            bg="#E6F0E3"
            title="Une inspiration"
            subtitle="Capture, Pinterest, magazine"
            subtitleColor="#3F6443"
            onClick={onInspiration}
            icon={
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  stroke="#4E7B52"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  stroke="#4E7B52"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <GridTile
            bg="#FFFFFF"
            border="1.5px solid #EEE9E0"
            title="Un mot"
            subtitle="Pour mon paysagiste"
            onClick={onMot}
            icon={
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="#4D554B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
