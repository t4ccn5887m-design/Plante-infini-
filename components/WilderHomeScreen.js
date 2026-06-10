import WilderLogo from "@/components/WilderLogo";

function IconCamera() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function WilderHomeScreen({ t, slogan, onStartScan }) {
  return (
    <div className="wilder-home screen-enter">
      <div className="wilder-home-bg" aria-hidden="true" />
      <div className="wilder-home-aurora" aria-hidden="true" />
      <div className="wilder-home-overlay" aria-hidden="true" />

      <div className="wilder-home-content">
        <header className="wilder-home-header stagger-1">
          <WilderLogo size={56} className="wilder-home-logo" />
          <h1 className="wilder-logo-title">Wilder</h1>
          <p className="wilder-logo-slogan">{slogan}</p>
        </header>

        <main className="wilder-home-main wilder-home-main--landing stagger-2">
          <div className="home-scan-rings home-scan-rings--landing" aria-hidden="true">
            <span className="home-scan-ring home-scan-ring--1" />
            <span className="home-scan-ring home-scan-ring--2" />
            <span className="home-scan-ring home-scan-ring--3" />
          </div>

          <button
            type="button"
            className="btn-scanner btn-scanner--hero btn-scanner--round home-landing-cta"
            onClick={() => onStartScan?.()}
          >
            <span className="home-scan-cta-shimmer" aria-hidden="true" />
            <span className="btn-scanner-icon">
              <IconCamera />
            </span>
            <span className="btn-scanner-label">{t("home.discover")}</span>
          </button>
        </main>
      </div>
    </div>
  );
}
