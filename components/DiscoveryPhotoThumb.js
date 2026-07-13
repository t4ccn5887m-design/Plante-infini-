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
