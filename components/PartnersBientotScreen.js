import { WILDER_COLORS as COLORS } from "@/lib/themes";

export default function PartnersBientotScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        textAlign: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-title, Fraunces, serif)",
          fontSize: 26,
          fontWeight: 400,
          color: COLORS.ink,
          lineHeight: 1.2,
        }}
      >
        Partenaires
      </span>
      <p style={{ margin: 0, fontSize: 15, color: COLORS.muted, lineHeight: 1.5, maxWidth: 280 }}>
        Bientôt disponible — retrouvez ici les paysagistes Sevya et leurs réalisations.
      </p>
    </div>
  );
}
