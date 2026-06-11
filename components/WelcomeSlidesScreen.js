import { useCallback, useRef, useState, useMemo } from "react";
import { createT } from "@/lib/i18n";

const SLIDE_KEYS = ["slide1", "slide2", "slide3"];
const SWIPE_THRESHOLD = 50;
const TAP_THRESHOLD = 12;

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.("button, a, [role='tab']"));
}

export default function WelcomeSlidesScreen({ onComplete}) {
  const t = useMemo(() => createT("fr"), []);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const tapHandledRef = useRef(false);

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

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const onTouchStart = (e) => {
    if (isInteractiveTarget(e.target)) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (e) => {
    if (isInteractiveTarget(e.target)) return;
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const endX = e.changedTouches[0]?.clientX;
    const endY = e.changedTouches[0]?.clientY;
    if (startX == null || endX == null || startY == null || endY == null) return;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) goNext();
      else goPrev();
    } else if (Math.abs(deltaX) < TAP_THRESHOLD && Math.abs(deltaY) < TAP_THRESHOLD) {
      tapHandledRef.current = true;
      goNext();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const onScreenClick = (e) => {
    if (tapHandledRef.current) {
      tapHandledRef.current = false;
      return;
    }
    if (isInteractiveTarget(e.target)) return;
    goNext();
  };

  const slide = slides[index];

  return (
    <div
      className="welcome-slides screen-enter"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onScreenClick}
      role="presentation"
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
