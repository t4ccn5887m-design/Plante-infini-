import { useState, useEffect } from "react";
import { getDiscoveryPhotoUrl } from "@/lib/discoveryPhoto";

function isRenderablePhoto(img) {
  return Boolean(img?.naturalWidth && img.naturalHeight);
}

export function DiscoveryPhotoThumb({
  discovery,
  typeEmoji,
  className = "wilder-home-recent-thumb",
  emptyClassName = "wilder-home-recent-thumb wilder-home-recent-thumb--empty",
}) {
  const photoSrc = getDiscoveryPhotoUrl(discovery);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoSrc]);

  const showPhoto = Boolean(photoSrc) && !failed;
  const emoji = typeEmoji?.(discovery?.type) || "🌿";

  if (showPhoto) {
    return (
      <img
        src={photoSrc}
        alt=""
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if (!isRenderablePhoto(e.currentTarget)) setFailed(true);
        }}
      />
    );
  }

  return (
    <span className={emptyClassName} aria-hidden="true">
      {emoji}
    </span>
  );
}

export function DiscoveryHeroPhoto({ discovery, nom, fallbackEmoji = "🌿" }) {
  const photoSrc = getDiscoveryPhotoUrl(discovery);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoSrc]);

  if (photoSrc && !failed) {
    return (
      <img
        src={photoSrc}
        alt={nom || ""}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if (!isRenderablePhoto(e.currentTarget)) setFailed(true);
        }}
      />
    );
  }

  return (
    <div className="discovery-photo-placeholder discovery-photo-placeholder--emoji" aria-hidden="true">
      {fallbackEmoji}
    </div>
  );
}

export function DailySpeciesMedia({
  species,
  illustration,
  photoClassName,
  emojiClassName,
}) {
  const [failed, setFailed] = useState(false);
  const illustrationClass = `${photoClassName} wilder-home-daily-photo--illustration`;
  const showImage = Boolean(illustration) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [illustration]);

  if (showImage) {
    return (
      <img
        src={illustration}
        alt=""
        className={illustrationClass}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if (!isRenderablePhoto(e.currentTarget)) setFailed(true);
        }}
      />
    );
  }

  return (
    <span className={emojiClassName} aria-hidden="true">
      {species?.emoji || "🌿"}
    </span>
  );
}

export function DailySpeciesHero({ species, illustration, nom, emoji }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(illustration) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [illustration]);

  if (showImage) {
    return (
      <img
        src={illustration}
        alt={nom}
        className="discovery-hero-illustration"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if (!isRenderablePhoto(e.currentTarget)) setFailed(true);
        }}
      />
    );
  }

  return (
    <div className="discovery-photo-placeholder discovery-photo-placeholder--emoji" aria-hidden="true">
      {emoji || species?.emoji || "🌿"}
    </div>
  );
}
