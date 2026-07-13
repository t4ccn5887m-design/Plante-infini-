/**
 * Hall catalogue — 4 cartes-images vers Végétal, Minéral, Déco, Idées.
 */

import { CATALOGUE_HALL_IMAGES, WILDER_COLORS as COLORS } from "@/lib/themes";

function HallCard({ imageUrl, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        height: 108,
        borderRadius: 16,
        overflow: "hidden",
        border: `0.5px solid ${COLORS.border}`,
        cursor: "pointer",
        padding: 0,
        width: "100%",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 12,
          zIndex: 1,
        }}
      >
        <div
          className="wilder-v2-title-feature"
          style={{
            fontSize: 17,
            color: "#fff",
            lineHeight: 1.2,
            textShadow: "0 1px 4px rgba(0,0,0,.35)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(255,255,255,.88)",
            marginTop: 3,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );
}

export default function CatalogueHallScreen({ t, onNavigateVegetal, onNavigateMineral, onNavigateDeco, onNavigateIdees }) {
  return (
    <>
      <div style={{ padding: "15px 16px 10px" }}>
        <span style={{ fontSize: 14, color: COLORS.muted }}>{t("catalogue.menu_crumb")}</span>
      </div>

      <div style={{ padding: "2px 16px 14px" }}>
        <h1
          className="wilder-v2-title-page"
          style={{ margin: 0, fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.15 }}
        >
          {t("catalogue.title")}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
          {t("catalogue.hall_subtitle")}
        </p>
      </div>

      <div
        style={{
          padding: "0 16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <HallCard
          imageUrl={CATALOGUE_HALL_IMAGES.vegetal}
          title={t("catalogue.hall_vegetal_title")}
          subtitle={t("catalogue.hall_vegetal_subtitle")}
          onClick={onNavigateVegetal}
        />
        <HallCard
          imageUrl={CATALOGUE_HALL_IMAGES.mineral}
          title={t("catalogue.hall_mineral_title")}
          subtitle={t("catalogue.hall_mineral_subtitle")}
          onClick={onNavigateMineral}
        />
        <HallCard
          imageUrl={CATALOGUE_HALL_IMAGES.deco}
          title={t("catalogue.hall_deco_title")}
          subtitle={t("catalogue.hall_deco_subtitle")}
          onClick={onNavigateDeco}
        />
        <HallCard
          imageUrl={CATALOGUE_HALL_IMAGES.idees}
          title={t("catalogue.hall_idees_title")}
          subtitle={t("catalogue.hall_idees_subtitle")}
          onClick={onNavigateIdees}
        />
      </div>
    </>
  );
}
