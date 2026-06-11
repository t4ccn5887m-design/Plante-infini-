import { HOME_SCAN_CATEGORIES } from "@/lib/scanCategories";

export default function HomeScanCategories({ t, selectedId, onSelect }) {
  return (
    <div
      className="home-scan-categories"
      role="tablist"
      aria-label={t("home.categories_label")}
    >
      {HOME_SCAN_CATEGORIES.map(({ id, labelKey }) => {
        const selected = selectedId === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`home-scan-category${selected ? " home-scan-category--active" : ""}`}
            onClick={() => onSelect?.(selected ? null : id)}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
