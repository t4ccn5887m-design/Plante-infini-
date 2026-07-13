import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconLeaf({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function IconBrief({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconHome({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function IconScans({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="1" />
      <rect x="14" y="4" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconCatalogue({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

export default function WilderTabBar({
  activeNav = "accueil",
  onAccueil,
  onJardin,
  onBrief,
  onScans,
  onCatalogue,
}) {
  const tabStyle = (on) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    color: on ? COLORS.active : COLORS.muted,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  });

  return (
    <nav
      className="wilder-v2-tabbar"
      aria-label="Navigation principale"
      style={{
        display: "flex",
        alignItems: "flex-end",
        borderTop: `0.5px solid ${COLORS.border}`,
        background: COLORS.screen,
        padding: "7px 3px 9px",
      }}
    >
      <button type="button" style={tabStyle(activeNav === "accueil")} onClick={onAccueil}>
        <IconHome />
        <span style={{ fontSize: 9, fontWeight: 500 }}>Accueil</span>
      </button>
      <button type="button" style={tabStyle(activeNav === "jardin")} onClick={onJardin}>
        <IconLeaf size={20} />
        <span style={{ fontSize: 9, fontWeight: 500 }}>Mon jardin</span>
      </button>
      <button
        type="button"
        onClick={onBrief}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: activeNav === "brief" ? COLORS.active : COLORS.muted,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: COLORS.active,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: -16,
            boxShadow: "0 4px 10px rgba(47,90,60,.35)",
            border: "3px solid #fff",
          }}
        >
          <IconBrief size={22} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 500 }}>Brief</span>
      </button>
      <button type="button" style={tabStyle(activeNav === "mes-scans")} onClick={onScans}>
        <IconScans />
        <span style={{ fontSize: 9, fontWeight: 500 }}>Mes scans</span>
      </button>
      <button type="button" style={tabStyle(activeNav === "catalogue")} onClick={onCatalogue}>
        <IconCatalogue />
        <span style={{ fontSize: 9, fontWeight: 500 }}>Catalogue</span>
      </button>
    </nav>
  );
}
