import { FileText, Heart, Home, Plus, Sparkles } from "lucide-react";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

function tabLabelStyle(fontSize = 12) {
  return {
    fontSize,
    fontWeight: 600,
    lineHeight: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
  };
}

export default function WilderTabBar({
  activeNav = "accueil",
  onAccueil,
  onIdees,
  onAdd,
  onCoupsDeCoeur,
  onDossier,
}) {
  const tabStyle = (on) => ({
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
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
        padding: "6px 4px 8px",
        boxSizing: "border-box",
      }}
    >
      <button type="button" style={tabStyle(activeNav === "accueil")} onClick={onAccueil}>
        <Home size={18} strokeWidth={2} aria-hidden />
        <span style={tabLabelStyle(12)}>Accueil</span>
      </button>

      <button type="button" style={tabStyle(activeNav === "idees")} onClick={onIdees}>
        <Sparkles size={18} strokeWidth={2} aria-hidden />
        <span style={tabLabelStyle(12)}>Idées</span>
      </button>

      <button
        type="button"
        onClick={onAdd}
        aria-label="Ajouter à mon jardin"
        style={{
          flex: "0.82 1 0",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: COLORS.muted,
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
          <Plus size={24} strokeWidth={2.4} aria-hidden />
        </div>
        <span style={{ ...tabLabelStyle(12), visibility: "hidden", height: 0, overflow: "hidden" }} aria-hidden>
          Ajouter
        </span>
      </button>

      <button
        type="button"
        style={{ ...tabStyle(activeNav === "coups-de-coeur"), flex: "1.14 1 0" }}
        onClick={onCoupsDeCoeur}
        aria-label="Coups de cœur"
      >
        <Heart size={18} strokeWidth={2} aria-hidden />
        <span style={tabLabelStyle(11)}>Coups de cœur</span>
      </button>

      <button type="button" style={tabStyle(activeNav === "dossier")} onClick={onDossier}>
        <FileText size={18} strokeWidth={2} aria-hidden />
        <span style={tabLabelStyle(12)}>Dossier</span>
      </button>
    </nav>
  );
}
