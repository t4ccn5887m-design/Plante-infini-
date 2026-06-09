import { useMemo } from "react";
import { getAllDiscoveriesChronological } from "@/lib/themes";
import DiscoveryGallery from "@/components/DiscoveryGallery";
import { ThemeHubHeader } from "@/components/ThemeHubNav";

export default function HerbierView({ discoveries, locale, t, onOpenDiscovery }) {
  const items = useMemo(
    () => getAllDiscoveriesChronological(discoveries),
    [discoveries]
  );

  return (
    <div className="theme-interior theme-interior--herbier">
      <ThemeHubHeader title={t("themes.herbier.title")} subtitle={t("themes.herbier.subtitle")} />

      {items.length > 0 && (
        <p className="herbier-count">{t("themes.herbier.count", { count: items.length })}</p>
      )}

      <DiscoveryGallery
        items={items}
        locale={locale}
        t={t}
        onOpenDiscovery={onOpenDiscovery}
      />
    </div>
  );
}
