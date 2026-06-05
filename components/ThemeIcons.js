/** Icônes fines pour les intérieurs de thèmes — style Airbnb / Notion */

export function IconPotager({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c-1.5 3-4 5.5-4 9a4 4 0 0 0 8 0c0-3.5-2.5-6-4-9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 15v6M9 21h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconRandos({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20 9.5 8.5 13 14l3.5-5.5L20 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="20" r="1.5" fill={color} />
      <circle cx="20" cy="20" r="1.5" fill={color} />
    </svg>
  );
}

export function IconJardin({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22V12M12 12C12 8 8 5 4 6c1 4 4 7 8 6M12 12c0-4 4-7 8-6-1 4-4 7-8 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAnimaux({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 8.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM15.5 8.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM6 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 20c3 0 5.5-2 6.5-5H5.5C6.5 18 9 20 12 20Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCamera({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconScan({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconFootprints({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="8" cy="6" rx="2" ry="2.5" stroke={color} strokeWidth={strokeWidth} />
      <ellipse cx="14" cy="10" rx="2" ry="2.5" stroke={color} strokeWidth={strokeWidth} />
      <ellipse cx="9" cy="14" rx="2" ry="2.5" stroke={color} strokeWidth={strokeWidth} />
      <ellipse cx="15" cy="18" rx="2" ry="2.5" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconHike({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 22l2-8 2 3 2-11 2 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMapPin({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconJournal({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8h6M10 12h6M10 16h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconSprout({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22V12M7 12C7 8 9 5 12 4c3 1 5 4 5 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12H5a3 3 0 0 0 0 6h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLightbulb({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAlbums({ size = 24, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="8.5" cy="10" r="1.5" fill={color} />
      <path d="M3 15l5-4 4 3 5-6 4 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ size = 20, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const THEME_ICON_MAP = {
  potager: IconPotager,
  randos: IconRandos,
  jardin: IconJardin,
  juniors: IconAnimaux,
};

export function ThemeIcon({ themeId, size = 28, color = "currentColor" }) {
  const Icon = THEME_ICON_MAP[themeId] || IconJardin;
  return <Icon size={size} color={color} />;
}
