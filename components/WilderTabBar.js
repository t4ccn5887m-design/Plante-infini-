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

function IconPartenaires({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={ic}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TabButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`atelier-tabbar__item${active ? " is-active" : ""}`}
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
  onCoupsDeCoeur,
  onDossier,
  onPartenaires,
}) {
  return (
    <nav
      className="wilder-v2-tabbar atelier-tabbar"
      aria-label="Navigation principale"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        alignItems: "end",
        boxSizing: "border-box",
      }}
    >
      <TabButton active={activeNav === "accueil"} onClick={onAccueil} label="Accueil">
        <IconAccueil />
      </TabButton>

      <TabButton active={activeNav === "idees"} onClick={onIdees} label="Idées">
        <IconIdees />
      </TabButton>

      <TabButton active={activeNav === "coups-de-coeur"} onClick={onCoupsDeCoeur} label="Cœurs">
        <IconCoups />
      </TabButton>

      <TabButton active={activeNav === "dossier"} onClick={onDossier} label="Dossier">
        <IconDossier />
      </TabButton>

      <TabButton active={activeNav === "partenaires"} onClick={onPartenaires} label="Partenaires">
        <IconPartenaires />
      </TabButton>
    </nav>
  );
}
