import WilderTabBar from "@/components/WilderTabBar";
import { WILDER_COLORS } from "@/lib/themes";

const screenWrap = {
  minHeight: "100vh",
  background: WILDER_COLORS.shellBg,
  display: "flex",
  justifyContent: "center",
  padding: "16px",
  color: WILDER_COLORS.ink,
};

const cardWrap = {
  width: "100%",
  maxWidth: 380,
  background: WILDER_COLORS.screen,
  borderRadius: 24,
  overflow: "hidden",
  alignSelf: "flex-start",
  display: "flex",
  flexDirection: "column",
  minHeight: "min(92vh, 680px)",
};

export default function WilderMainLayout({
  activeNav,
  onNavAccueil,
  onNavJardin,
  onNavBrief,
  onNavScans,
  onNavCatalogue,
  children,
  className = "",
}) {
  return (
    <div className={`wilder-v2-shell wilder-v2-main-layout ${className}`.trim()} style={screenWrap}>
      <div className="wilder-v2-card wilder-v2-main-layout-card" style={cardWrap}>
        <div className="wilder-v2-main-layout-content">{children}</div>
        <WilderTabBar
          activeNav={activeNav}
          onAccueil={onNavAccueil}
          onJardin={onNavJardin}
          onBrief={onNavBrief}
          onScans={onNavScans}
          onCatalogue={onNavCatalogue}
        />
      </div>
    </div>
  );
}
