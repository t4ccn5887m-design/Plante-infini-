import { FileText, Heart, Home, Plus, Sparkles } from "lucide-react";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const labelStyle = {
  fontSize: 8,
  fontWeight: 600,
  lineHeight: 1.05,
  textAlign: "center",
  maxWidth: "100%",
  whiteSpace: "normal",
  wordBreak: "break-word",
  hyphens: "auto",
};

export default function WilderTabBar({
  activeNav = "accueil",
  onAccueil,
  onIdees,
  onAdd,
  onCoupsDeCoeur,
  onDossier,
}) {
  const tabStyle = (on) => ({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    color: on ? COLORS.active : COLORS.muted,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "0 1px",
  });

  return (
    <nav
      className="wilder-v2-tabbar"
      aria-label="Navigation principale"
      style={{
        display: "flex",
        alignItems: "flex-end",
        padding: "7px 2px 9px",
      }}
    >
      <button type="button" style={tabStyle(activeNav === "accueil")} onClick={onAccueil}>
        <Home size={20} strokeWidth={2} aria-hidden />
        <span style={labelStyle}>Accueil</span>
      </button>

      <button type="button" style={tabStyle(activeNav === "idees")} onClick={onIdees}>
        <Sparkles size={20} strokeWidth={2} aria-hidden />
        <span style={labelStyle}>Idées</span>
      </button>

      <button
        type="button"
        onClick={onAdd}
        aria-label="Scanner une plante"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
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
        <span style={{ ...labelStyle, visibility: "hidden", height: 0, overflow: "hidden" }} aria-hidden>
          Ajouter
        </span>
      </button>

      <button type="button" style={tabStyle(activeNav === "coups-de-coeur")} onClick={onCoupsDeCoeur}>
        <Heart size={20} strokeWidth={2} aria-hidden />
        <span style={labelStyle}>Coups de cœur</span>
      </button>

      <button type="button" style={tabStyle(activeNav === "dossier")} onClick={onDossier}>
        <FileText size={20} strokeWidth={2} aria-hidden />
        <span style={labelStyle}>Dossier</span>
      </button>
    </nav>
  );
}
