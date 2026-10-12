import { buildCataloguePhotoCreditParts } from "@/lib/cataloguePhotoCredit";

const linkStyle = { color: "#6B7268" };
const linkStyleOnDark = { color: "rgba(255,255,255,0.92)" };

export default function CataloguePhotoCredit({ plant, onDark = false }) {
  const parts = buildCataloguePhotoCreditParts(plant);
  if (!parts) return null;

  const ls = onDark ? linkStyleOnDark : linkStyle;
  const creditShell = onDark
    ? {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: "8px 12px",
        fontSize: 11,
        color: "rgba(255,255,255,0.88)",
        background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
      }
    : {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: "8px 12px",
        fontSize: 11,
        color: "#6B7268",
        background: "linear-gradient(transparent, rgba(247,245,240,0.95))",
      };

  if (parts.kind === "wikimedia") {
    return (
      <p style={creditShell}>
        Photo :{" "}
        {parts.fileUrl ? (
          <a href={parts.fileUrl} target="_blank" rel="noopener noreferrer" style={ls}>
            {parts.author}
          </a>
        ) : (
          parts.author
        )}
        ,{" "}
        {parts.licenseUrl ? (
          <a href={parts.licenseUrl} target="_blank" rel="noopener noreferrer" style={ls}>
            {parts.license}
          </a>
        ) : (
          parts.license
        )}{" "}
        /{" "}
        <a
          href="https://commons.wikimedia.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={ls}
        >
          Wikimedia Commons
        </a>
        {parts.modifiedSuffix}
      </p>
    );
  }

  return (
    <p style={creditShell}>
      Photo :{" "}
      {parts.pageUrl ? (
        <a href={parts.pageUrl} target="_blank" rel="noopener noreferrer" style={ls}>
          {parts.author}
        </a>
      ) : (
        parts.author
      )}{" "}
      / Pixabay
    </p>
  );
}
