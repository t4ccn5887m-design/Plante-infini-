import { useCallback, useRef, useState, useMemo } from "react";
import { createT } from "@/lib/i18n";

const SLIDE_KEYS = ["slide1", "slide2", "slide3"];

export default function WelcomeSlidesScreen({ onComplete }) {
  const t = useMemo(() => createT("fr"), []);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const slides = SLIDE_KEYS.map((key) => ({
    emoji: t(`welcome.${key}_emoji`),
    title: t(`welcome.${key}_title`),
    text: t(`welcome.${key}_text`),
  }));

  const isLast = index >= slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete?.();
      return;
    }
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [isLast, onComplete, slides.length]);

  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null) return;
    const delta = end - start;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
    touchStartX.current = null;
  };

  const slide = slides[index];

  return (
    <div
      className="welcome-slides screen-enter"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="welcome-slides-bg" aria-hidden="true" />
      <div className="welcome-slides-content">
        <div className="welcome-slide-card" key={index}>
          <span className="welcome-slide-emoji" aria-hidden="true">
            {slide.emoji}
          </span>
          <h1 className="welcome-slide-title">{slide.title}</h1>
          <p className="welcome-slide-text">{slide.text}</p>
        </div>

        <div className="welcome-slides-footer">
          <p className="welcome-slide-french-badge">{t("welcome.french_app_badge")}</p>

          <div className="welcome-dots" role="tablist" aria-label={t("welcome.progress")}>
            {slides.map((_, i) => (
              <button
                key={SLIDE_KEYS[i]}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1} / ${slides.length}`}
                className={`welcome-dot${i === index ? " welcome-dot--active" : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          {isLast ? (
            <button type="button" className="welcome-cta" onClick={goNext}>
              {t("welcome.cta")}
            </button>
          ) : (
            <div className="welcome-cta-spacer" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}
