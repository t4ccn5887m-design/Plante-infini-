function formatDiscoveryDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function DiscoveryGallery({ items, locale, t, emptyMessage, onOpenDiscovery }) {
  if (!items?.length) {
    return (
      <div className="discovery-gallery-empty">
        <p>{emptyMessage || t("themes.herbier.empty")}</p>
      </div>
    );
  }

  return (
    <ul className="discovery-gallery" aria-label={t("themes.herbier.title")}>
      {items.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            className="discovery-gallery-card"
            onClick={() => onOpenDiscovery?.(d)}
          >
            {d.photo ? (
              <img src={d.photo} alt="" className="discovery-gallery-photo" loading="lazy" />
            ) : (
              <div className="discovery-gallery-photo discovery-gallery-photo--placeholder">🌿</div>
            )}
            <div className="discovery-gallery-meta">
              <span className="discovery-gallery-name">{d.nom}</span>
              <span className="discovery-gallery-date">
                {formatDiscoveryDate(d.discoveredAt, locale)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
