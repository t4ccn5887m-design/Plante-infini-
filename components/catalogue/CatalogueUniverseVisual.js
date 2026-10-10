import { CATALOGUE_PHOTO_SURFACE } from "@/lib/cataloguePhotoConstants";

const PLACEHOLDER = {
  mineral: { bg: "#C9C4BC", Icon: IconStone },
  amenagements: { bg: "#F0D4C4", Icon: IconBench },
  deco: { bg: "#F0D4C4", Icon: IconBench },
};

function icStroke(stroke) {
  return {
    stroke,
    strokeWidth: 2,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
}

function IconStone({ stroke = "#FFFFFF" }) {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" style={icStroke(stroke)} aria-hidden="true">
      <polygon points="6 3 18 3 21 9 12 21 3 9" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function IconBench({ stroke = "#FFFFFF" }) {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" style={icStroke(stroke)} aria-hidden="true">
      <path d="M4 10h16v3H4z" />
      <path d="M6 13v4M18 13v4M8 10V7h8v3" />
    </svg>
  );
}

/**
 * @param {"mineral"|"amenagements"|"deco"} universe
 * @param {"cover"|"contain"} photoFit — cover pour minéral, contain pour aménagements
 */
export default function CatalogueUniverseVisual({
  photo_url,
  universe = "mineral",
  height = 118,
  photoFit = "contain",
  photoDetouree = false,
}) {
  const key = universe === "mineral" ? "mineral" : "amenagements";
  const { bg, Icon } = PLACEHOLDER[key] || PLACEHOLDER.mineral;

  if (photo_url) {
    const surface =
      photoDetouree === "oui" || photoDetouree === true ? "#FFFFFF" : CATALOGUE_PHOTO_SURFACE;
    const fit = photoFit === "cover" ? "cover" : "contain";
    return (
      <div
        style={{
          height,
          position: "relative",
          background: surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={photo_url}
          alt=""
          style={{
            width: fit === "cover" ? "100%" : "auto",
            height: fit === "cover" ? "100%" : "auto",
            maxWidth: fit === "contain" ? "100%" : undefined,
            maxHeight: fit === "contain" ? "100%" : undefined,
            objectFit: fit,
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon stroke="rgba(255,255,255,0.92)" />
    </div>
  );
}
