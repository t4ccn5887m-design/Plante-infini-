import { useMemo } from "react";
import { BIODEX_TYPES } from "@/lib/biodex";

const QUICK_SCANS = [
  { id: "plant", emoji: "🌿", labelKey: "home.quick_plant", scan: {} },
  { id: "animal", emoji: "🦊", labelKey: "home.quick_animal", scan: { animalMode: "animal" } },
  { id: "mushroom", emoji: "🍄", labelKey: "home.quick_mushroom", scan: {} },
  { id: "bird", emoji: "🐦", labelKey: "home.quick_bird", scan: { animalMode: "sound" } },
];

const VALUE_PROPS = [
  { icon: "⚡", key: "home.value_speed" },
  { icon: "💚", key: "home.value_health" },
  { icon: "📍", key: "home.value_map" },
];

function DiscoveryCollage({ photos }) {
  if (!photos.length) return null;
  return (
    <div className="home-scan-collage" aria-hidden="true">
      {photos.map((src, i) => (
        <div
          key={src}
          className={`home-scan-collage-tile home-scan-collage-tile--${i}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}

function tapFeedback() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export default function HomeScanHero({ t, onStartScan, isNewUser, discoveries = [] }) {
  const collagePhotos = useMemo(
    () =>
      [...discoveries]
        .filter((d) => d.photo)
        .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0))
        .slice(0, 4)
        .map((d) => d.photo),
    [discoveries]
  );

  return (
    <div className="home-scan-hero">
      <DiscoveryCollage photos={collagePhotos} />

      <div className="home-scan-rings" aria-hidden="true">
        <span className="home-scan-ring home-scan-ring--1" />
        <span className="home-scan-ring home-scan-ring--2" />
        <span className="home-scan-ring home-scan-ring--3" />
      </div>

      <button
        type="button"
        className="btn-scanner btn-scanner--hero home-scan-cta home-scan-cta--premium"
        onClick={() => {
          tapFeedback();
          onStartScan({});
        }}
      >
        <span className="home-scan-cta-shimmer" aria-hidden="true" />
        <span className="btn-scanner-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </span>
        <span className="home-scan-cta-label">{t("home.discover")}</span>
        <span className="home-scan-cta-sub">{t("home.scan_cta_sub")}</span>
      </button>

      <p className="home-scan-hint">{t("home.scan_hint")}</p>

      {isNewUser ? (
        <div className="home-new-pitch">
          <p className="home-new-pitch-title">{t("home.new_pitch_title")}</p>
          <div className="home-new-pitch-steps">
            {["new_pitch_step_1", "new_pitch_step_2", "new_pitch_step_3"].map((key, i) => (
              <span key={key} className="home-new-pitch-step">
                <span className="home-new-pitch-num">{i + 1}</span>
                {t(`home.${key}`)}
              </span>
            ))}
          </div>
          <div className="home-species-orbit" aria-hidden="true">
            {BIODEX_TYPES.map((type, i) => (
              <span
                key={type.id}
                className="home-species-orbit-item"
                style={{ "--orbit-i": i, "--orbit-n": BIODEX_TYPES.length }}
              >
                {type.emoji}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="home-quick-scans">
          {QUICK_SCANS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="home-quick-scan"
              onClick={() => {
                tapFeedback();
                onStartScan(item.scan);
              }}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{t(item.labelKey)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="home-value-strip">
        {VALUE_PROPS.map(({ icon, key }) => (
          <span key={key} className="home-value-item">
            <span aria-hidden="true">{icon}</span>
            {t(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
