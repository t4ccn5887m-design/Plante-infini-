const ACTIVE = "#2F5E3F";
const INACTIVE = "#6B7268";

const ic = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconAccueil({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={ic}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IconIdees({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={ic}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  );
}

function IconPlus({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCoups({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={ic}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function IconDossier({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={ic}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function TabButton({ active, onClick, label, children, fab = false }) {
  if (fab) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Ajouter à mon jardin"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          color: ACTIVE,
          fontSize: 12,
          fontWeight: 700,
          padding: 0,
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            boxSizing: "border-box",
            borderRadius: 999,
            background: ACTIVE,
            border: "4px solid #FFFFFF",
            marginTop: -30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(47,94,63,0.35)",
          }}
        >
          <IconPlus />
        </span>
        Ajouter
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
        minHeight: 44,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        color: active ? ACTIVE : INACTIVE,
        fontSize: 12,
        fontWeight: active ? 700 : 600,
        padding: 0,
      }}
    >
      {children}
      {label}
    </button>
  );
}

export default function WilderTabBar({
  activeNav = "accueil",
  onAccueil,
  onIdees,
  onAdd,
  onCoupsDeCoeur,
  onDossier,
}) {
  return (
    <nav
      className="wilder-v2-tabbar"
      aria-label="Navigation principale"
      style={{
        background: "#FFFFFF",
        borderRadius: 26,
        boxShadow: "0 4px 18px rgba(31,42,34,0.12)",
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        alignItems: "end",
        padding: "8px 4px 10px",
        boxSizing: "border-box",
      }}
    >
      <TabButton active={activeNav === "accueil"} onClick={onAccueil} label="Accueil">
        <IconAccueil />
      </TabButton>

      <TabButton active={activeNav === "idees"} onClick={onIdees} label="Idées">
        <IconIdees />
      </TabButton>

      <TabButton fab onClick={onAdd} />

      <TabButton active={activeNav === "coups-de-coeur"} onClick={onCoupsDeCoeur} label="Coups de cœur">
        <IconCoups />
      </TabButton>

      <TabButton active={activeNav === "dossier"} onClick={onDossier} label="Dossier">
        <IconDossier />
      </TabButton>
    </nav>
  );
}
