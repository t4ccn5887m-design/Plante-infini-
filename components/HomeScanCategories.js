import { HOME_SCAN_CATEGORIES } from "@/lib/scanCategories";

export default function HomeScanCategories({ t }) {
  return (
    <ul
      className="home-scan-categories home-scan-categories--tags"
      aria-label={t("home.categories_label")}
    >
      {HOME_SCAN_CATEGORIES.map(({ id, labelKey }) => (
        <li key={id} className="home-scan-category-tag">
          {t(labelKey)}
        </li>
      ))}
    </ul>
  );
}
