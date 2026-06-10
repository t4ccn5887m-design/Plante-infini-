import { useId } from "react";

export const LOGO_BG_LIGHT = "#FAFAF7";
export const LOGO_BG_DARK = "#1B3A2D";
export const LOGO_GREEN_START = "#3D7A3D";
export const LOGO_GREEN_END = "#5BA85C";

/** Paths partagés (viewBox 512×512) — feuille + nervure/loupe */
export const LOGO_PATHS = {
  leaf:
    "M204 96C128 98 84 176 88 272C92 356 160 408 232 380C276 364 298 316 286 260C270 184 246 120 204 96Z",
  vein:
    "M204 128C220 200 248 272 296 324C318 348 338 356 322 382",
  lensCenter: { cx: 368, cy: 348, r: 72 },
  lensInner: { cx: 368, cy: 348, r: 52 },
};

export default function Logo({ size = 72, className = "", variant = "light" }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `wilder-logo-grad-${uid}`;
  const bg = variant === "dark" ? LOGO_BG_DARK : LOGO_BG_LIGHT;
  const { leaf, vein, lensCenter, lensInner } = LOGO_PATHS;

  return (
    <svg
      className={`wilder-logo-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Wilder"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="88"
          y1="88"
          x2="424"
          y2="424"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={LOGO_GREEN_START} />
          <stop offset="1" stopColor={LOGO_GREEN_END} />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="112" fill={bg} />

      <path fill={`url(#${gradId})`} d={leaf} />

      <path
        d={vein}
        stroke={`url(#${gradId})`}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={lensInner.cx} cy={lensInner.cy} r={lensInner.r} fill={bg} />

      <circle
        cx={lensCenter.cx}
        cy={lensCenter.cy}
        r={lensCenter.r}
        stroke={`url(#${gradId})`}
        strokeWidth="30"
      />
    </svg>
  );
}
