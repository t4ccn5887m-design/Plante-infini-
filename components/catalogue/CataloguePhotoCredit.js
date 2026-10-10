import { buildCataloguePhotoCreditParts } from "@/lib/cataloguePhotoCredit";

const linkStyle = { color: "#6B7268" };

export default function CataloguePhotoCredit({ plant }) {
  const parts = buildCataloguePhotoCreditParts(plant);
  if (!parts) return null;

  if (parts.kind === "wikimedia") {
    return (
      <p
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: "8px 12px",
          fontSize: 11,
          color: "#6B7268",
          background: "linear-gradient(transparent, rgba(247,245,240,0.95))",
        }}
      >
        Photo :{" "}
        {parts.fileUrl ? (
          <a href={parts.fileUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {parts.author}
          </a>
        ) : (
          parts.author
        )}
        ,{" "}
        {parts.licenseUrl ? (
          <a href={parts.licenseUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
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
          style={linkStyle}
        >
          Wikimedia Commons
        </a>
        {parts.modifiedSuffix}
      </p>
    );
  }

  return (
    <p
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: "8px 12px",
        fontSize: 11,
        color: "#6B7268",
        background: "linear-gradient(transparent, rgba(247,245,240,0.95))",
      }}
    >
      Photo :{" "}
      {parts.pageUrl ? (
        <a href={parts.pageUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {parts.author}
        </a>
      ) : (
        parts.author
      )}{" "}
      / Pixabay
    </p>
  );
}
