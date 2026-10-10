import { getCategoriePlaceholderColor } from "@/lib/cataloguePlants";

function IconLeaf({ size = 28, stroke = "#FFFFFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 21c0-3 1.85-5.36 5.08-6"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CataloguePlantVisual({
  photo_url,
  categorie,
  height = 118,
  leafStroke = "rgba(255,255,255,0.85)",
}) {
  const bg = getCategoriePlaceholderColor(categorie);

  if (photo_url) {
    return (
      <div style={{ height, position: "relative", background: "#DDD7CC" }}>
        <img
          src={photo_url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
      <IconLeaf stroke={leafStroke} />
    </div>
  );
}
