import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import Confetti from "@/components/Confetti";
import { createT, detectLang, getLocale, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import {
  BADGE_DEFS,
  computeUnlockedBadgeIds,
  getBadgeProgress,
  getNewBadgeIds,
  isBadgeUnlocked,
  loadSeenBadges,
  saveSeenBadges,
} from "@/lib/badges";
import { playBadgeUnlockSound, playDiscoverySound, warmUpSounds } from "@/lib/sounds";
import AnimalSoundQuiz from "@/components/AnimalSoundQuiz";
import { shareDiscovery } from "@/lib/share";
import { computeStats } from "@/lib/stats";
import OnboardingScreen from "@/components/OnboardingScreen";
import {
  acquireCameraStream,
  completeOnboarding,
  isCameraGranted,
  isOnboardingComplete,
  syncCameraPermissionStatus,
} from "@/lib/permissions";
import { compressDataUrl } from "@/lib/compressImage";
import { loadAlbums, saveAlbums } from "@/lib/discoveriesStorage";
import { fetchDiscoveries, insertDiscovery } from "@/lib/analysesStorage";
import {
  ALBUM_THEMES,
  DEFAULT_ALBUM_THEME,
  getHerbariumDiscoveries,
  getRootAlbums,
  getSubAlbums,
  isThemeScreen,
  BOTTOM_NAV_EMOJI,
  NAV_THEMES,
  THEME_META,
} from "@/lib/themes";

const THEME_KEY = "wilder-theme";
const FRANCE_CENTER = [46.603354, 1.888334];

async function parseApiResponse(res) {
  const text = await res.text();
  if (!text.trim()) {
    return { data: null, parseError: true };
  }
  try {
    return { data: JSON.parse(text), parseError: false };
  } catch {
    console.error("[Wilder] Réponse API non-JSON:", text.slice(0, 300));
    return { data: null, parseError: true };
  }
}

function formatDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function defaultAlbumName(t, locale) {
  const d = new Date();
  const date = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return t("albums.default_name", { date });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatLocation(discovery) {
  if (discovery?.placeName) return discovery.placeName;
  if (discovery?.latitude != null && discovery?.longitude != null) {
    return `${discovery.latitude.toFixed(4)}°, ${discovery.longitude.toFixed(4)}°`;
  }
  return null;
}

function getAlbumDisplayName(album) {
  return album.nom || album.name || "Album";
}

function getAlbumPhotos(album, allDiscoveries) {
  if (Array.isArray(album.photos) && album.photos.length > 0) return album.photos;
  const photos = [];
  for (const id of album.discoveryIds || []) {
    const d = allDiscoveries.find((x) => x.id === id);
    if (d?.photo) photos.push(d.photo);
  }
  if (photos.length === 0 && album.coverPhoto) photos.push(album.coverPhoto);
  return photos;
}

function getAlbumLocation(album, allDiscoveries) {
  if (album.latitude != null && album.longitude != null) {
    return {
      latitude: Number(album.latitude),
      longitude: Number(album.longitude),
      placeName: album.placeName || null,
    };
  }
  for (const id of album.discoveryIds || []) {
    const d = allDiscoveries.find((x) => x.id === id);
    if (d?.latitude != null && d?.longitude != null) {
      return {
        latitude: d.latitude,
        longitude: d.longitude,
        placeName: d.placeName || null,
      };
    }
  }
  return null;
}

function getFirstDiscoveryPhoto(album, allDiscoveries) {
  const photos = getAlbumPhotos(album, allDiscoveries);
  return photos[0] || null;
}

function buildAlbumRecord({
  name,
  createdAt,
  coverPhoto,
  discoveryIds,
  location,
  theme = DEFAULT_ALBUM_THEME,
  parentId = null,
}) {
  const photos = coverPhoto ? [coverPhoto] : [];
  return {
    id: generateId(),
    name,
    nom: name,
    createdAt,
    date: createdAt,
    coverPhoto,
    photos,
    discoveryIds,
    theme,
    ...(parentId ? { parentId } : {}),
    ...(location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          placeName: location.placeName || null,
        }
      : {}),
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LEAF_MARKER_HTML = `<div class="wilder-map-marker" aria-hidden="true">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#F5F2EB">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  </svg>
</div>`;

async function prepareAlbumsForMap(discoveries) {
  const albums = loadAlbums();
  const normalized = albums.map((album) => ({
    ...album,
    nom: album.nom || album.name,
    name: album.name || album.nom,
    date: album.date || album.createdAt,
    createdAt: album.createdAt || album.date,
    photos: getAlbumPhotos(album, discoveries),
  }));

  const changed = JSON.stringify(normalized) !== JSON.stringify(albums);
  if (changed) saveAlbums(normalized);
  return { albums: normalized, discoveries };
}

function loadTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/* ── Icons ── */

function IconWilderLogo({ size = 72 }) {
  return (
    <svg className="wilder-logo-icon" width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="rgba(27, 61, 47, 0.85)" stroke="rgba(245, 242, 235, 0.25)" strokeWidth="1.5" />
      <path
        d="M28 52c-2-8 2-18 12-22 4-2 8-1 10 2 2-6 8-10 16-8 6 2 10 8 10 16 0 12-10 20-22 22-8 1-14-2-16-10z"
        fill="#3D7A5C"
        stroke="#F5F2EB"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M32 48c3-6 8-10 14-12M48 36c4 2 7 6 8 12"
        stroke="#F5F2EB"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <ellipse cx="34" cy="38" rx="5" ry="6" fill="#E07A3A" opacity="0.9" transform="rotate(-25 34 38)" />
      <circle cx="33" cy="36" r="1.2" fill="#F5F2EB" />
      <circle cx="35" cy="40" r="1.2" fill="#F5F2EB" />
      <circle cx="37" cy="37" r="1.2" fill="#F5F2EB" />
      <path
        d="M52 28c-4 6-6 14-4 22 2-10 8-16 16-18"
        fill="#2D5A45"
        stroke="#F5F2EB"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M50 26c2-4 6-6 10-4" stroke="#F5F2EB" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconAlbums({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function IconBack({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconPlus({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconStats({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 5 5-9" />
    </svg>
  );
}

function IconHome({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconMap({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15M9 3.236v15" />
    </svg>
  );
}

function IconList({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconSun({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconShare({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IconTrophy({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconInfo({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function ThemeToggle({ theme, onToggle, t }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? t("home.theme_light") : t("home.theme_dark")}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  );
}

function BottomNav({ active, onNavigate, t }) {
  const items = NAV_THEMES.map((id) => ({
    id,
    emoji: BOTTOM_NAV_EMOJI[id],
    label: t(THEME_META[id].navKey),
  }));

  return (
    <nav className="bottom-nav bottom-nav--themes" aria-label="Navigation principale">
      {items.map(({ id, emoji, label }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav-item${active === id ? " active" : ""}`}
          onClick={() => onNavigate(id)}
          aria-current={active === id ? "page" : undefined}
        >
          <span className="bottom-nav-emoji" aria-hidden="true">
            {emoji}
          </span>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function AlbumMap({ albums, discoveries, onOpenAlbum, t, locale }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onOpenAlbumRef = useRef(onOpenAlbum);

  useEffect(() => {
    onOpenAlbumRef.current = onOpenAlbum;
  }, [onOpenAlbum]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let map = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([46.6, 2.4], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const leafIcon = L.divIcon({
        className: "wilder-map-marker-wrap",
        html: LEAF_MARKER_HTML,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42],
      });

      const bounds = [];
      const placed = new Set();

      discoveries.forEach((d) => {
        if (d.latitude == null || d.longitude == null) return;
        const key = `${d.latitude.toFixed(5)},${d.longitude.toFixed(5)}`;
        if (placed.has(key)) return;
        placed.add(key);

        const typeLabel = getTypeLabel(t, d.type || "plante");

        const popupHtml = `
          <div class="map-popup">
            ${d.photo ? `<img src="${escapeHtml(d.photo)}" alt="" class="map-popup-photo" />` : ""}
            <h3 class="map-popup-title">${escapeHtml(d.nom)}</h3>
            <p class="map-popup-meta">${escapeHtml(typeLabel)}${d.placeName ? ` · ${escapeHtml(d.placeName)}` : ""}</p>
            <p class="map-popup-meta">${escapeHtml(formatDate(d.discoveredAt, locale))}</p>
          </div>
        `;

        L.marker([d.latitude, d.longitude], { icon: leafIcon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 280, className: "wilder-map-popup" });

        bounds.push([d.latitude, d.longitude]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
      }

      mapRef.current = map;
    })();

    const handlePopupClick = (e) => {
      const btn = e.target.closest(".map-popup-btn");
      if (!btn?.dataset.albumId) return;
      onOpenAlbumRef.current(btn.dataset.albumId);
    };

    containerRef.current.addEventListener("click", handlePopupClick);

    return () => {
      cancelled = true;
      containerRef.current?.removeEventListener("click", handlePopupClick);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [albums, discoveries, t, locale]);

  return <div ref={containerRef} className="album-map-container" />;
}

function AlbumsMapView({ discoveries, onSelectAlbum, onLoadedCount, onAlbumsSynced, t, themeFilter }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onSelectAlbumRef = useRef(onSelectAlbum);
  const onLoadedCountRef = useRef(onLoadedCount);
  const onAlbumsSyncedRef = useRef(onAlbumsSynced);
  const albumsRef = useRef([]);

  useEffect(() => {
    onSelectAlbumRef.current = onSelectAlbum;
  }, [onSelectAlbum]);

  useEffect(() => {
    onLoadedCountRef.current = onLoadedCount;
  }, [onLoadedCount]);

  useEffect(() => {
    onAlbumsSyncedRef.current = onAlbumsSynced;
  }, [onAlbumsSynced]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let map = null;
    let cancelled = false;
    let resizeObserver = null;

    const invalidateMapSize = () => {
      if (map && !cancelled) map.invalidateSize();
    };

    (async () => {
      await prepareAlbumsForMap(discoveries);
      let storedAlbums = loadAlbums();
      if (themeFilter) {
        storedAlbums = storedAlbums.filter((a) => a.theme === themeFilter);
      }
      const storedDiscoveries = discoveries;

      albumsRef.current = storedAlbums;
      onAlbumsSyncedRef.current?.(storedAlbums);

      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(FRANCE_CENTER, 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = [];

      storedAlbums.forEach((album) => {
        const loc = getAlbumLocation(album, storedDiscoveries);
        if (!loc) return;

        const photo = getFirstDiscoveryPhoto(album, storedDiscoveries);
        const albumName = getAlbumDisplayName(album);
        const photoHtml = photo
          ? `<img src="${escapeHtml(photo)}" alt="" class="albums-map-marker-img" />`
          : `<div class="albums-map-marker-fallback" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
            </div>`;

        const icon = L.divIcon({
          className: "albums-map-marker-wrap",
          html: `<button type="button" class="albums-map-marker" data-album-id="${escapeHtml(album.id)}" aria-label="${escapeHtml(albumName)}">
            <span class="albums-map-marker-glow" aria-hidden="true"></span>
            ${photoHtml}
          </button>`,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });

        L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);
        bounds.push([loc.latitude, loc.longitude]);
      });

      onLoadedCountRef.current?.(bounds.length);

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }

      mapRef.current = map;
      requestAnimationFrame(invalidateMapSize);
      setTimeout(invalidateMapSize, 100);
      setTimeout(invalidateMapSize, 350);

      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(invalidateMapSize);
        resizeObserver.observe(containerRef.current);
      }
    })();

    const handleMarkerClick = (e) => {
      const btn = e.target.closest(".albums-map-marker");
      const albumId = btn?.dataset?.albumId;
      if (!albumId) return;
      const album = albumsRef.current.find((a) => a.id === albumId);
      if (album) onSelectAlbumRef.current(album);
    };

    containerRef.current.addEventListener("click", handleMarkerClick);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      containerRef.current?.removeEventListener("click", handleMarkerClick);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [t, themeFilter, discoveries]);

  return <div ref={containerRef} className="albums-map-container" />;
}

function AlbumMapSheet({ album, discoveries, onClose, onOpenAlbum, t, locale }) {
  const loc = getAlbumLocation(album, discoveries);
  const items = (album.discoveryIds || [])
    .map((id) => discoveries.find((d) => d.id === id))
    .filter(Boolean);
  const count = items.length;

  return (
    <div className="album-map-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="album-map-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="album-map-sheet-title"
      >
        <div className="album-map-sheet-handle" aria-hidden="true" />
        <h2 id="album-map-sheet-title" className="album-map-sheet-title">
          {getAlbumDisplayName(album)}
        </h2>
        <p className="album-map-sheet-meta">{formatDate(album.createdAt, locale)}</p>
        {loc?.placeName && (
          <p className="album-map-sheet-meta album-map-sheet-place">
            <IconLocation size={14} /> {loc.placeName}
          </p>
        )}
        <p className="album-map-sheet-meta">
          {count}{" "}
          {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
        </p>
        {items.length > 0 && (
          <div className="album-map-sheet-grid">
            {items.map((d) => (
              <img key={d.id} src={d.photo} alt={d.nom} />
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn-primary album-map-sheet-open"
          onClick={() => onOpenAlbum(album.id)}
        >
          {t("albums.open_full_album")}
        </button>
      </div>
    </div>
  );
}

function IconLocation({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconLeafSmall({ className, style }) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    </svg>
  );
}

function FallingLeaves() {
  const leaves = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 6.8) % 90}%`,
    delay: `${i * 1.3}s`,
    duration: `${10 + (i % 5) * 2.5}s`,
    size: 14 + (i % 4) * 4,
    rotate: (i % 3) * 120,
  }));

  return (
    <div className="falling-leaves" aria-hidden="true">
      {leaves.map((l) => (
        <IconLeafSmall
          key={l.id}
          className="falling-leaf"
          style={{
            left: l.left,
            fontSize: l.size,
            animationDuration: l.duration,
            animationDelay: l.delay,
            transform: `rotate(${l.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Viewfinder() {
  return (
    <div className="viewfinder-wilder">
      <div className="viewfinder-corner tl" />
      <div className="viewfinder-corner tr" />
      <div className="viewfinder-corner bl" />
      <div className="viewfinder-corner br" />
      <div className="scan-line" />
    </div>
  );
}

function RarityBadge({ rarete, t }) {
  const key = ["commun", "peu_commun", "rare", "tres_rare"].includes(rarete) ? rarete : "commun";
  return (
    <span className={`rarity-badge rarity-${key}`}>
      ◆ {getRarityLabel(t, key)}
    </span>
  );
}

function LocationCard({ discovery, t }) {
  const label = formatLocation(discovery);
  if (!label) return null;
  const mapUrl =
    discovery.latitude != null && discovery.longitude != null
      ? `https://maps.apple.com/?ll=${discovery.latitude},${discovery.longitude}&q=${encodeURIComponent(discovery.nom || "Wilder")}`
      : null;

  return (
    <div className="result-card">
      <div className="result-card-title">{t("discovery.location")}</div>
      <div className="location-card">
        <IconLocation className="location-card-icon" size={18} color="#F4A261" />
        <div>
          <p className="result-card-text">{label}</p>
          {mapUrl && (
            <a
              className="location-map-link"
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("discovery.map_link")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareButton({ discovery, t, lang }) {
  const [sharing, setSharing] = useState(false);
  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareDiscovery(discovery, t, typeLbl, rarityLbl);
    } catch {
      /* user cancelled */
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      type="button"
      className="btn-share"
      onClick={handleShare}
      disabled={sharing}
    >
      <IconShare size={18} />
      {sharing ? t("discovery.share_generating") : t("discovery.share")}
    </button>
  );
}

function BadgeUnlockToast({ badge, t, onClose }) {
  return (
    <div className="badge-unlock-toast" role="alert">
      <span className="badge-unlock-icon">{badge.icon}</span>
      <div>
        <p className="badge-unlock-label">{t("trophies.new_badge")}</p>
        <p className="badge-unlock-name">{t(`badges.${badge.id}.name`)}</p>
      </div>
      <button type="button" className="badge-unlock-close" onClick={onClose} aria-label="OK">✓</button>
    </div>
  );
}

function DiscoveryBody({ data, discovery, showNewBadge, t, lang, onShare, children }) {
  return (
    <>
      {showNewBadge && <span className="discovery-new-badge">{t("discovery.new")}</span>}
      <h1 className="discovery-name">{data.nom}</h1>
      {data.nom_latin && <p className="discovery-latin">{data.nom_latin}</p>}
      {data.famille && <p className="discovery-family">{data.famille}</p>}
      {data.identification_note && (
        <p className="discovery-id-note">{data.identification_note}</p>
      )}

      {data.type && (
        <span className="discovery-type-chip">
          {getTypeLabel(t, data.type)}
        </span>
      )}

      <RarityBadge rarete={data.rarete} t={t} />

      <AnimalSoundQuiz data={data} t={t} />

      {data.description && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.description")}</div>
          <p className="result-card-text">{data.description}</p>
        </div>
      )}

      {data.histoire && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.history")}</div>
          <p className="result-card-text">{data.histoire}</p>
        </div>
      )}

      {data.date_construction && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.construction_date")}</div>
          <p className="result-card-text">{data.date_construction}</p>
        </div>
      )}

      {data.style_architectural && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.architectural_style")}</div>
          <p className="result-card-text">{data.style_architectural}</p>
        </div>
      )}

      {data.anecdotes && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.anecdotes")}</div>
          <p className="result-card-text">{data.anecdotes}</p>
        </div>
      )}

      {data.habitat && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.habitat")}</div>
          <p className="result-card-text">{data.habitat}</p>
        </div>
      )}

      {data.etat_sante && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.health")}</div>
          <p className="result-card-text">{data.etat_sante}</p>
        </div>
      )}

      {data.soins_traitement && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.care_treatment")}</div>
          <p className="result-card-text">{data.soins_traitement}</p>
        </div>
      )}

      {data.guide_entretien && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.care_guide")}</div>
          <p className="result-card-text">{data.guide_entretien}</p>
        </div>
      )}

      {data.conseils_expert && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.expert_tips")}</div>
          <p className="result-card-text">{data.conseils_expert}</p>
        </div>
      )}

      {data.comportement && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.behavior")}</div>
          <p className="result-card-text">{data.comportement}</p>
        </div>
      )}

      {data.dangerosite && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.danger")}</div>
          <p className="result-card-text">{data.dangerosite}</p>
        </div>
      )}

      {data.infos_utiles && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.useful_info")}</div>
          <p className="result-card-text">{data.infos_utiles}</p>
        </div>
      )}

      {discovery && <LocationCard discovery={discovery} t={t} />}

      {discovery && onShare !== false && (
        <ShareButton discovery={discovery} t={t} lang={lang} />
      )}

      {children}
    </>
  );
}

function ThemeAlbumPickerModal({ albums, onSelect, onCreate, onClose, t, locale }) {
  const [step, setStep] = useState("theme");
  const [pickedTheme, setPickedTheme] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const themeAlbums = pickedTheme
    ? albums.filter((a) => a.theme === pickedTheme && !a.parentId)
    : [];

  const handleCreate = () => {
    const name = newName.trim() || defaultAlbumName(t, locale);
    onCreate(name, pickedTheme);
    setNewName("");
    setCreating(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {step === "theme" ? (
          <>
            <h2>{t("themes.pick_theme")}</h2>
            <div className="theme-picker-grid">
              {ALBUM_THEMES.map((themeId) => (
                <button
                  key={themeId}
                  type="button"
                  className="theme-picker-btn"
                  onClick={() => {
                    setPickedTheme(themeId);
                    setStep("album");
                  }}
                >
                  <span className="theme-picker-emoji">{THEME_META[themeId].emoji}</span>
                  <span>{t(`themes.${themeId}.title`)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn-secondary" style={{ width: "100%", marginTop: "0.5rem" }} onClick={onClose}>
              {t("albums.cancel")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="theme-picker-back"
              onClick={() => {
                setStep("theme");
                setCreating(false);
                setNewName("");
              }}
            >
              <IconBack size={16} /> {THEME_META[pickedTheme].emoji} {t(`themes.${pickedTheme}.title`)}
            </button>
            <h2>{t("albums.add_to")}</h2>
            {themeAlbums.map((a) => (
              <button key={a.id} type="button" className="modal-album-option" onClick={() => onSelect(a.id)}>
                {a.coverPhoto ? (
                  <img src={a.coverPhoto} alt="" width={48} height={48} style={{ borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div className="album-cover album-cover-placeholder" style={{ width: 48, height: 48 }}>
                    <IconAlbums size={22} />
                  </div>
                )}
                <div>
                  <strong>{a.name}</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {a.discoveryIds.length}{" "}
                    {a.discoveryIds.length !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
                  </p>
                </div>
              </button>
            ))}
            {creating ? (
              <>
                <input
                  className="modal-input"
                  placeholder={defaultAlbumName(t, locale)}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
                    {t("albums.cancel")}
                  </button>
                  <button type="button" className="btn-primary" onClick={handleCreate}>
                    {t("albums.create")}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn-create-album" onClick={() => setCreating(true)}>
                <IconPlus size={18} /> {t("albums.new")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HerbariumView({ albums, discoveries, onOpenDiscovery, t, locale }) {
  const plants = getHerbariumDiscoveries(albums, discoveries);
  if (plants.length === 0) {
    return (
      <div className="albums-empty herbarium-empty">
        <span className="herbarium-empty-icon" aria-hidden="true">
          📖
        </span>
        <p>{t("themes.jardin.herbarium_empty")}</p>
      </div>
    );
  }
  return (
    <div className="herbarium-grid">
      {plants.map((d) => (
        <button
          key={d.id}
          type="button"
          className="herbarium-card"
          onClick={() => onOpenDiscovery(d)}
        >
          <div className="herbarium-card-frame">
            <img src={d.photo} alt={d.nom} />
          </div>
          <h3>{d.nom}</h3>
          <p className="herbarium-latin">{d.nom_latin || "—"}</p>
          <p className="herbarium-date">{formatDate(d.discoveredAt, locale)}</p>
        </button>
      ))}
    </div>
  );
}

function JuniorsDiscoveryCard({ discovery, onClick, t, typeLabel, rarityLabel }) {
  const emoji = THEME_META.juniors.emoji;
  return (
    <button type="button" className="juniors-discovery-card" onClick={onClick}>
      <img src={discovery.photo} alt={discovery.nom} />
      <div className="juniors-discovery-body">
        <span className="juniors-discovery-badge">{emoji} {t("themes.juniors.fun_title")}</span>
        <h4>{discovery.nom}</h4>
        <p className="juniors-discovery-type">{typeLabel(discovery.type)}</p>
        {discovery.fun_fact && (
          <p className="juniors-discovery-fact">
            💡 {discovery.fun_fact.slice(0, 120)}
            {discovery.fun_fact.length > 120 ? "…" : ""}
          </p>
        )}
        {(discovery.rarete === "rare" || discovery.rarete === "tres_rare") && (
          <span className={`discovery-item-rarity rarity-${discovery.rarete}`}>
            ⭐ {rarityLabel(discovery.rarete)}
          </span>
        )}
      </div>
    </button>
  );
}

function ThemeAlbumsScreen({
  themeId,
  albums,
  discoveries,
  albumsViewMode,
  setAlbumsViewMode,
  jardinTab,
  setJardinTab,
  creatingAlbum,
  setCreatingAlbum,
  newAlbumName,
  setNewAlbumName,
  mapSheetAlbum,
  setMapSheetAlbum,
  mapLoadedCount,
  setMapLoadedCount,
  setAlbums,
  setSelectedAlbumId,
  setReturnScreen,
  setScreen,
  openDiscoveryDetail,
  createAlbumFromList,
  t,
  locale,
  theme,
  onToggleTheme,
  navigateMain,
}) {
  const isJuniors = themeId === "juniors";
  const isJardin = themeId === "jardin";
  const isRandos = themeId === "randos";
  const isMapView = albumsViewMode === "map";
  const rootAlbums = getRootAlbums(albums, themeId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const showMapToggle = isRandos || !isJardin || jardinTab === "albums";

  return (
    <>
      <Head>
        <title>
          {t(`themes.${themeId}.title`)} — Wilder
        </title>
      </Head>
      <div
        className={`albums-screen screen-enter with-bottom-nav theme-screen theme-screen--${themeId}${isJuniors ? " theme-screen--juniors" : ""}${isMapView ? " albums-screen--map" : ""}`}
      >
        <div className="albums-header">
          <h1 className="albums-title">
            {THEME_META[themeId].emoji} {t(`themes.${themeId}.title`)}
          </h1>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} t={t} />
        </div>
        <p className="theme-screen-subtitle">{t(`themes.${themeId}.subtitle`)}</p>

        {isJardin && (
          <div className="jardin-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={jardinTab === "albums"}
              className={`jardin-tab${jardinTab === "albums" ? " active" : ""}`}
              onClick={() => setJardinTab("albums")}
            >
              📁 {t("themes.jardin.tab_albums")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={jardinTab === "herbier"}
              className={`jardin-tab${jardinTab === "herbier" ? " active" : ""}`}
              onClick={() => setJardinTab("herbier")}
            >
              📖 {t("themes.jardin.herbarium")}
            </button>
          </div>
        )}

        {isJardin && jardinTab === "herbier" ? (
          <>
            <p className="theme-herbarium-intro">{t("themes.jardin.herbarium_subtitle")}</p>
            <HerbariumView
              albums={albums}
              discoveries={discoveries}
              onOpenDiscovery={(d) => openDiscoveryDetail(d, themeId)}
              t={t}
              locale={locale}
            />
          </>
        ) : (
          <>
            {showMapToggle && (
              <div className="albums-view-toggle" role="tablist" aria-label={t(`themes.${themeId}.title`)}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isMapView}
                  className={`albums-view-btn${!isMapView ? " active" : ""}`}
                  onClick={() => {
                    setAlbumsViewMode("list");
                    setMapSheetAlbum(null);
                  }}
                >
                  <IconList size={18} />
                  {t("albums.view_list")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isMapView}
                  className={`albums-view-btn${isMapView ? " active" : ""}`}
                  onClick={() => setAlbumsViewMode("map")}
                >
                  <IconMap size={18} />
                  {t("albums.view_map")}
                </button>
              </div>
            )}

            {isMapView ? (
              <>
                <p className="albums-map-stats">
                  {mapLoadedCount == null
                    ? t("albums.map_loading")
                    : mapLoadedCount === 0
                      ? t("albums.map_empty")
                      : t("albums.map_loaded_count", { count: mapLoadedCount })}
                </p>
                <AlbumsMapView
                  key={`${themeId}-${albumsViewMode}`}
                  discoveries={discoveries}
                  themeFilter={themeId}
                  onLoadedCount={setMapLoadedCount}
                  onAlbumsSynced={setAlbums}
                  onSelectAlbum={setMapSheetAlbum}
                  t={t}
                />
                {mapSheetAlbum && (
                  <AlbumMapSheet
                    album={mapSheetAlbum}
                    discoveries={discoveries}
                    onClose={() => setMapSheetAlbum(null)}
                    onOpenAlbum={(albumId) => {
                      setMapSheetAlbum(null);
                      setReturnScreen(themeId);
                      setSelectedAlbumId(albumId);
                      setScreen("album-detail");
                    }}
                    t={t}
                    locale={locale}
                  />
                )}
              </>
            ) : (
              <div className="albums-list">
                {rootAlbums.length === 0 && !creatingAlbum ? (
                  <div className="albums-empty">
                    <span style={{ fontSize: "2.5rem", opacity: 0.5 }} aria-hidden="true">
                      {THEME_META[themeId].emoji}
                    </span>
                    <p>{t("albums.empty")}</p>
                    <p className="album-examples">{t(`themes.${themeId}.empty_examples`)}</p>
                  </div>
                ) : (
                  rootAlbums.map((album) => {
                    const count = album.discoveryIds.length;
                    const coverPhoto = getFirstDiscoveryPhoto(album, discoveries);
                    const subCount = getSubAlbums(albums, album.id).length;
                    return (
                      <button
                        key={album.id}
                        type="button"
                        className="album-card"
                        onClick={() => {
                          setReturnScreen(themeId);
                          setSelectedAlbumId(album.id);
                          setScreen("album-detail");
                        }}
                      >
                        {coverPhoto ? (
                          <img src={coverPhoto} alt="" className="album-cover" />
                        ) : (
                          <div className="album-cover album-cover-placeholder">
                            <IconAlbums size={28} />
                          </div>
                        )}
                        <div className="album-info">
                          <h3>{getAlbumDisplayName(album)}</h3>
                          <p>
                            {count}{" "}
                            {count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")}
                            {subCount > 0 && ` · ${subCount} ${t("themes.sub_albums").toLowerCase()}`} ·{" "}
                            {formatDate(album.createdAt, locale)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}

                {creatingAlbum ? (
                  <>
                    <input
                      className="modal-input"
                      placeholder={defaultAlbumName(t, locale)}
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      autoFocus
                    />
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={() => setCreatingAlbum(false)}>
                        {t("albums.cancel")}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => createAlbumFromList(themeId)}
                      >
                        {t("albums.create")}
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" className="btn-create-album" onClick={() => setCreatingAlbum(true)}>
                    <IconPlus size={18} /> {t("albums.create")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav active={themeId} onNavigate={navigateMain} t={t} />
    </>
  );
}

export default function Wilder() {
  const [screen, setScreen] = useState("home");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [currentDiscovery, setCurrentDiscovery] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [savedToAlbum, setSavedToAlbum] = useState(false);
  const [pokedexAnim, setPokedexAnim] = useState(true);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [albumsViewMode, setAlbumsViewMode] = useState("list");
  const [mapSheetAlbum, setMapSheetAlbum] = useState(null);
  const [mapLoadedCount, setMapLoadedCount] = useState(null);
  const [camError, setCamError] = useState("");
  const [camLoading, setCamLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(
    () => typeof window !== "undefined" && !isOnboardingComplete()
  );
  const [camZoom, setCamZoom] = useState(1);
  const [viewingDiscovery, setViewingDiscovery] = useState(null);
  const [returnScreen, setReturnScreen] = useState("jardin");
  const [jardinTab, setJardinTab] = useState("albums");
  const [creatingSubAlbum, setCreatingSubAlbum] = useState(false);
  const [newSubAlbumName, setNewSubAlbumName] = useState("");
  const [lang] = useState(() => detectLang());
  const [theme, setTheme] = useState("dark");
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  const t = useMemo(() => createT(lang), [lang]);
  const locale = useMemo(() => getLocale(lang), [lang]);
  const typeLabel = useCallback((type) => getTypeLabel(t, type), [t]);
  const rarityLabel = useCallback((r) => getRarityLabel(t, r), [t]);

  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef({ dist: 0, zoom: 1 });
  const hardwareZoomRef = useRef({ min: 1, max: 1, step: 0.1, supported: false });

  useEffect(() => {
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  };

  const checkNewBadges = useCallback((items) => {
    const seen = loadSeenBadges();
    const fresh = getNewBadgeIds(items, seen);
    if (fresh.length > 0) {
      const badge = BADGE_DEFS.find((b) => b.id === fresh[0]);
      saveSeenBadges([...seen, ...fresh]);
      setNewBadge(badge);
      setShowConfetti(true);
      return true;
    }
    return false;
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;
    if (video.srcObject !== stream) video.srcObject = stream;
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCamReady(false);
    setCamError("");
    setCamLoading(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const { ok, stream, error } = await acquireCameraStream();
    setCamLoading(false);

    if (!ok || !stream) {
      setCamError(error === "unsupported" ? t("scanner.camera_error") : t("scanner.camera_denied"));
      return;
    }

    streamRef.current = stream;
    const track = stream.getVideoTracks()[0];
    const caps = track?.getCapabilities?.();
    if (caps?.zoom) {
      hardwareZoomRef.current = {
        min: caps.zoom.min ?? 1,
        max: caps.zoom.max ?? 1,
        step: caps.zoom.step ?? 0.1,
        supported: true,
      };
    } else {
      hardwareZoomRef.current = { min: 1, max: 1, step: 0.1, supported: false };
    }
    setCamZoom(1);
    setCamReady(true);
    await attachStreamToVideo();
  }, [attachStreamToVideo, t]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  useEffect(() => {
    syncCameraPermissionStatus().catch(() => {});
  }, []);

  useEffect(() => {
    const hw = hardwareZoomRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (hw.supported && track) {
      if (videoWrapRef.current) videoWrapRef.current.style.setProperty("--cam-zoom", "1");
      const target = hw.min + (hw.max - hw.min) * ((camZoom - 1) / 3);
      track.applyConstraints({ advanced: [{ zoom: target }] }).catch(() => {});
    } else if (videoWrapRef.current) {
      videoWrapRef.current.style.setProperty("--cam-zoom", String(camZoom));
    }
  }, [camZoom, camReady]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const items = await fetchDiscoveries();
        if (cancelled) return;

        setDiscoveries(items);
        setAlbums(loadAlbums());

        const seen = loadSeenBadges();
        if (seen.length === 0 && items.length > 0) {
          saveSeenBadges(computeUnlockedBadgeIds(items));
        }

        if (isOnboardingComplete()) {
          setNeedsOnboarding(false);
        } else if (items.length > 0) {
          completeOnboarding();
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } catch (e) {
        console.error("[Wilder] Chargement Supabase:", e);
        if (!cancelled) setAlbums(loadAlbums());
      }
    })();

    const onFirstTouch = () => warmUpSounds();
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onFirstTouch);
    };
  }, []);

  useEffect(() => {
    if (albumsViewMode !== "map") {
      setMapLoadedCount(null);
    }
  }, [albumsViewMode]);

  useEffect(() => {
    if (screen === "camera") startCamera();
    else stopCamera();
    return stopCamera;
  }, [screen, startCamera, stopCamera]);

  useEffect(() => {
    if (screen === "camera" && camReady) attachStreamToVideo();
  }, [screen, camReady, attachStreamToVideo]);

  useEffect(() => {
    if (screen === "result") {
      setPokedexAnim(true);
      const t = setTimeout(() => setPokedexAnim(false), 900);
      return () => clearTimeout(t);
    }
  }, [screen, result?.nom]);

  const goHome = () => {
    setResult(null);
    setCaptured(null);
    setCurrentDiscovery(null);
    setErrorMsg("");
    setSavedToAlbum(false);
    setShowAlbumPicker(false);
    setScreen("home");
  };

  const navigateMain = (target) => {
    if (target === "home") goHome();
    else {
      if (target === "randos") setAlbumsViewMode("map");
      else setAlbumsViewMode("list");
      setScreen(target);
    }
  };

  const analyze = useCallback(async (base64, imgSrc) => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const { data, parseError } = await parseApiResponse(res);
      if (parseError || !data) {
        setErrorMsg(t("error.analyze"));
        setScreen("error");
        return;
      }
      if (!res.ok || data.erreur) {
        setErrorMsg(data.erreur || t("error.analyze"));
        setScreen("error");
        return;
      }

      const photo =
        typeof data.photo === "string" && data.photo.startsWith("http")
          ? data.photo
          : await compressDataUrl(imgSrc);

      const discovery = {
        id: generateId(),
        photo,
        nom: data.nom,
        nom_latin: data.nom_latin || "",
        famille: data.famille || "",
        type: data.type || "plante",
        description: data.description || "",
        identification_note: data.identification_note || "",
        habitat: data.habitat || "",
        rarete: data.rarete || "commun",
        etat_sante: data.etat_sante || "",
        soins_traitement: data.soins_traitement || "",
        guide_entretien: data.guide_entretien || "",
        conseils_expert: data.conseils_expert || "",
        comportement: data.comportement || "",
        dangerosite: data.dangerosite || "",
        infos_utiles: data.infos_utiles || "",
        histoire: data.histoire || "",
        date_construction: data.date_construction || "",
        style_architectural: data.style_architectural || "",
        anecdotes: data.anecdotes || "",
        fun_fact: data.fun_fact || "",
        discoveredAt: new Date().toISOString(),
      };

      const saveResult = await insertDiscovery(discovery);
      if (!saveResult.ok) {
        console.warn("[Wilder] Sauvegarde Supabase échouée:", saveResult.error);
        setErrorMsg(t("error.analyze"));
        setScreen("error");
        return;
      }

      const updated = [discovery, ...discoveries];
      setDiscoveries(updated);
      setCurrentDiscovery(discovery);
      setResult(data);
      setScreen("result");
      if (checkNewBadges(updated)) {
        playBadgeUnlockSound();
      } else {
        playDiscoverySound();
      }
    } catch (e) {
      console.error("[Wilder] analyze:", e);
      setErrorMsg("Erreur: " + e.message);
      setScreen("error");
    }
  }, [t, checkNewBadges, lang, discoveries]);

  const handleCapturedImage = useCallback(
    (dataUrl) => {
      analyze(dataUrl.split(",")[1], dataUrl);
    },
    [analyze]
  );

  const takePhoto = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    const zoom = Math.max(1, camZoom);
    const useCrop = !hardwareZoomRef.current.supported && zoom > 1;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (useCrop) {
      const sw = w / zoom;
      const sh = h / zoom;
      ctx.drawImage(v, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, w, h);
    } else {
      ctx.drawImage(v, 0, 0, w, h);
    }
    handleCapturedImage(c.toDataURL("image/jpeg", 0.85));
  }, [handleCapturedImage, camZoom]);

  const onPinchStart = useCallback((e) => {
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchRef.current = { dist: Math.hypot(dx, dy), zoom: camZoom };
  }, [camZoom]);

  const onPinchMove = useCallback((e) => {
    if (e.touches.length !== 2 || pinchRef.current.dist <= 0) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / pinchRef.current.dist;
    setCamZoom(Math.min(4, Math.max(1, pinchRef.current.zoom * ratio)));
  }, []);

  const fromGallery = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => handleCapturedImage(e.target.result);
      reader.readAsDataURL(file);
    },
    [handleCapturedImage]
  );

  const addToAlbum = (albumId) => {
    if (!currentDiscovery) return;
    const allAlbums = loadAlbums();
    const idx = allAlbums.findIndex((a) => a.id === albumId);
    if (idx === -1) return;

    const album = allAlbums[idx];
    const ids = Array.isArray(album.discoveryIds) ? album.discoveryIds : [];
    if (!ids.includes(currentDiscovery.id)) {
      album.discoveryIds = [currentDiscovery.id, ...ids];
      if (!album.coverPhoto) album.coverPhoto = currentDiscovery.photo;
      if (album.latitude == null && currentDiscovery.latitude != null) {
        album.latitude = currentDiscovery.latitude;
        album.longitude = currentDiscovery.longitude;
        album.placeName = currentDiscovery.placeName || null;
      }
      if (!Array.isArray(album.photos)) album.photos = [];
      if (currentDiscovery.photo && !album.photos.includes(currentDiscovery.photo)) {
        album.photos = [currentDiscovery.photo, ...album.photos];
      }
      allAlbums[idx] = album;
      saveAlbums(allAlbums);
      setAlbums(allAlbums);
    }
    setShowAlbumPicker(false);
    setSavedToAlbum(true);
  };

  const createAlbum = async (name, theme = DEFAULT_ALBUM_THEME) => {
    if (!currentDiscovery) return;
    const location =
      currentDiscovery.latitude != null && currentDiscovery.longitude != null
        ? {
            latitude: currentDiscovery.latitude,
            longitude: currentDiscovery.longitude,
            placeName: currentDiscovery.placeName || null,
          }
        : null;
    const albumName = name.trim() || defaultAlbumName(t, locale);
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name: albumName,
      createdAt,
      coverPhoto: currentDiscovery.photo,
      discoveryIds: [currentDiscovery.id],
      location,
      theme,
    });
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setShowAlbumPicker(false);
    setSavedToAlbum(true);
  };

  const createAlbumFromList = async (themeId) => {
    const name = newAlbumName.trim() || defaultAlbumName(t, locale);
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name,
      createdAt,
      coverPhoto: null,
      discoveryIds: [],
      theme: themeId,
    });
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setNewAlbumName("");
    setCreatingAlbum(false);
  };

  const createSubAlbum = async (parentAlbum) => {
    const name = newSubAlbumName.trim() || defaultAlbumName(t, locale);
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name,
      createdAt,
      coverPhoto: null,
      discoveryIds: [],
      theme: parentAlbum.theme || DEFAULT_ALBUM_THEME,
      parentId: parentAlbum.id,
    });
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setNewSubAlbumName("");
    setCreatingSubAlbum(false);
  };

  const getAlbumDiscoveries = (album) => {
    const ids = new Set(album.discoveryIds);
    return discoveries
      .filter((d) => ids.has(d.id))
      .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const stats = computeStats(discoveries);
  const slogan = t("slogan");
  const pageTitle = `Wilder — ${slogan}`;
  const marquee = t("marquee");

  const openDiscoveryDetail = (d, from) => {
    setViewingDiscovery(d);
    setReturnScreen(from);
    setScreen("discovery-detail");
  };

  const confettiOverlay = (
    <>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
      {newBadge && showConfetti && (
        <BadgeUnlockToast badge={newBadge} t={t} onClose={() => setNewBadge(null)} />
      )}
    </>
  );

  if (needsOnboarding) {
    return (
      <>
        <Head>
          <title>Wilder</title>
          <meta name="description" content={slogan} />
        </Head>
        <OnboardingScreen t={t} onComplete={() => setNeedsOnboarding(false)} />
      </>
    );
  }

  /* ── HOME ── */
  if (screen === "home") {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={slogan} />
        </Head>
        <div className="wilder-home screen-enter">
          <ThemeToggle theme={theme} onToggle={toggleTheme} t={t} />
          <div className="wilder-home-bg" />
          <div className="wilder-home-overlay" />
          <FallingLeaves />
          <div className="wilder-home-content">
            <div className="wilder-logo-wrap stagger-1">
              <IconWilderLogo />
              <h1 className="wilder-logo-title">Wilder</h1>
              <p className="wilder-logo-slogan">{slogan}</p>
            </div>

            <div className="discovery-counter stagger-2">
              <span className="discovery-counter-num">{discoveries.length}</span>
              <span>{discoveries.length !== 1 ? t("home.discoveries_plural") : t("home.discoveries")}</span>
              {stats.rareCount > 0 && (
                <span className="discovery-counter-rare">
                  ◆ {stats.rareCount}{" "}
                  {stats.rareCount !== 1 ? t("home.rare_plural") : t("home.rare")}
                </span>
              )}
            </div>

            <button type="button" className="btn-scanner stagger-2" onClick={() => setScreen("camera")}>
              <span className="btn-scanner-icon">
                <IconCamera size={32} color="white" />
              </span>
              {t("home.discover")}
            </button>

            <div className="home-secondary-row stagger-2">
              <button type="button" className="btn-home-secondary" onClick={() => setScreen("trophies")}>
                <IconTrophy size={18} />
                {t("home.trophies")}
              </button>
              <button type="button" className="btn-home-secondary" onClick={() => setScreen("stats")}>
                <IconStats size={18} />
                {t("home.stats")}
              </button>
              <button type="button" className="btn-home-secondary" onClick={() => setScreen("about")}>
                <IconInfo size={18} />
                {t("home.about")}
              </button>
            </div>

            <div className="discovery-marquee stagger-2" aria-hidden="true">
              <div className="discovery-marquee-track">
                <span>{marquee}{marquee}</span>
              </div>
            </div>
          </div>
          <BottomNav active="home" onNavigate={navigateMain} t={t} />
          {confettiOverlay}
        </div>
      </>
    );
  }

  /* ── SCANNER ── */
  if (screen === "camera") {
    return (
      <>
        <Head><title>Scanner — Wilder</title></Head>
        <div className="scanner-screen screen-enter-fast">
          <div
            ref={videoWrapRef}
            className="scanner-video-wrap"
            onTouchStart={onPinchStart}
            onTouchMove={onPinchMove}
            style={{ "--cam-zoom": camZoom }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => attachStreamToVideo()}
              style={{ opacity: camReady ? 1 : 0 }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <div className="scanner-overlay">
            <div className="scanner-top">
              <button type="button" className="scanner-back" onClick={goHome} aria-label={t("scanner.back")}>
                <IconBack size={20} color="white" />
              </button>
            </div>

            <div className="scanner-center">
              {camReady && <Viewfinder />}
            </div>

            {camReady && (
              <input
                type="range"
                className="cam-zoom-slider"
                min={1}
                max={4}
                step={0.1}
                value={camZoom}
                onChange={(e) => setCamZoom(Number(e.target.value))}
                aria-label={t("scanner.zoom")}
              />
            )}

            <p className="scanner-hint">{t("scanner.hint")}</p>

            <div className="scanner-bottom">
              <div className="scanner-controls">
                <label className="gallery-btn">
                  <div className="gallery-btn-icon">
                    <IconAlbums size={20} color="white" />
                  </div>
                  {t("scanner.gallery")}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    onChange={(e) => fromGallery(e.target.files[0])}
                  />
                </label>

                <button
                  type="button"
                  className="capture-btn-wilder"
                  onClick={takePhoto}
                  disabled={!camReady}
                  aria-label="Capturer"
                >
                  <div className="capture-btn-inner" />
                </button>

                <div style={{ width: 44 }} />
              </div>
            </div>
          </div>

          {!camReady && (
            <div className="camera-error-overlay">
              {camLoading ? (
                <>
                  <div className="camera-loading-spinner" aria-hidden="true" />
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                    {t("scanner.loading_camera")}
                  </p>
                </>
              ) : camError ? (
                <>
                  <div style={{ animation: "pulseGlow 2s ease-in-out infinite" }}>
                    <IconCamera size={48} color="#E07A3A" />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.5 }}>
                    {camError}
                  </p>
                  <button type="button" className="btn-primary" onClick={startCamera}>
                    {t("scanner.retry")}
                  </button>
                </>
              ) : isCameraGranted() ? (
                <>
                  <div className="camera-loading-spinner" aria-hidden="true" />
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                    {t("scanner.loading_camera")}
                  </p>
                </>
              ) : null}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── ANALYZING ── */
  if (screen === "analyzing") {
    return (
      <>
        <Head><title>Analyse… — Wilder</title></Head>
        <div className="analyze-screen screen-enter-fast">
          <div className="analyze-ring">
            <div className="analyze-ring-inner">
              {captured && <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.4rem" }}>
              {t("analyze.title")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {t("analyze.subtitle")}
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ── ERROR ── */
  if (screen === "error") {
    return (
      <>
        <Head><title>Non reconnu — Wilder</title></Head>
        <div
          className="analyze-screen screen-enter"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.75rem" }}>
            {t("error.title")}
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 300, lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {errorMsg}
          </p>
          <button type="button" className="btn-primary" onClick={() => setScreen("camera")}>
            {t("error.retry")}
          </button>
        </div>
      </>
    );
  }

  /* ── RESULT ── */
  if (screen === "result" && result) {
    return (
      <>
        <Head>
          <title>{result.nom} — Wilder</title>
        </Head>
        <div className="discovery-screen screen-enter-fast">
          {pokedexAnim && (
            <>
              <div className="pokedex-flash" />
              <div className="pokedex-ring" />
            </>
          )}

          <div className="discovery-hero">
            {captured && <img src={captured} alt={result.nom} />}
          </div>

          <div className="discovery-body">
            <button
              type="button"
              className="btn-secondary discovery-home-btn"
              onClick={goHome}
            >
              ← {t("discovery.home")}
            </button>

            <DiscoveryBody data={result} discovery={currentDiscovery} showNewBadge t={t} lang={lang}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={() => !savedToAlbum && setShowAlbumPicker(true)}
                disabled={savedToAlbum}
              >
                {savedToAlbum ? t("discovery.added_album") : t("discovery.add_album")}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={() => setScreen("camera")}
              >
                {t("discovery.scan_again")}
              </button>

              <button
                type="button"
                className="btn-secondary discovery-home-btn"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={goHome}
              >
                ← {t("discovery.home")}
              </button>
            </DiscoveryBody>
          </div>

          {showAlbumPicker && (
            <ThemeAlbumPickerModal
              albums={albums}
              onSelect={addToAlbum}
              onCreate={createAlbum}
              onClose={() => setShowAlbumPicker(false)}
              t={t}
              locale={locale}
            />
          )}
          {confettiOverlay}
        </div>
      </>
    );
  }

  /* ── ALBUM DETAIL ── */
  if (screen === "album-detail" && selectedAlbum) {
    const items = getAlbumDiscoveries(selectedAlbum);
    const albumTheme = selectedAlbum.theme || DEFAULT_ALBUM_THEME;
    const isJuniorsAlbum = albumTheme === "juniors";
    const subAlbums = getSubAlbums(albums, selectedAlbum.id);
    const backScreen = isThemeScreen(returnScreen) ? returnScreen : albumTheme;

    return (
      <>
        <Head>
          <title>{selectedAlbum.name} — Wilder</title>
        </Head>
        <div
          className={`albums-screen screen-enter-fast${isJuniorsAlbum ? " theme-screen--juniors" : ""}`}
        >
          <div className="album-detail-header">
            {selectedAlbum.coverPhoto ? (
              <img src={selectedAlbum.coverPhoto} alt="" className="album-detail-cover" />
            ) : (
              <div
                className="album-detail-cover"
                style={{
                  background: "linear-gradient(135deg, var(--forest-mid), var(--forest-deep))",
                }}
              />
            )}
            <div className="album-detail-cover-overlay" />
            <button
              type="button"
              className="scanner-back"
              style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 2 }}
              onClick={() => {
                setSelectedAlbumId(null);
                setCreatingSubAlbum(false);
                setScreen(backScreen);
              }}
              aria-label="Retour"
            >
              <IconBack size={20} color="white" />
            </button>
            <div className="album-detail-title-wrap">
              <h1>
                {THEME_META[albumTheme]?.emoji} {selectedAlbum.name}
              </h1>
              <p>
                {items.length}{" "}
                {items.length !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries")} ·{" "}
                {formatDate(selectedAlbum.createdAt, locale)}
              </p>
            </div>
          </div>

          {subAlbums.length > 0 && (
            <div className="sub-albums-section">
              <h2 className="sub-albums-title">{t("themes.sub_albums")}</h2>
              <div className="sub-albums-list">
                {subAlbums.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className="sub-album-chip"
                    onClick={() => {
                      setReturnScreen(backScreen);
                      setSelectedAlbumId(sub.id);
                    }}
                  >
                    📁 {getAlbumDisplayName(sub)} ({sub.discoveryIds.length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {creatingSubAlbum ? (
            <div className="sub-album-create" style={{ padding: "0 1.25rem" }}>
              <input
                className="modal-input"
                placeholder={t("themes.new_sub_album")}
                value={newSubAlbumName}
                onChange={(e) => setNewSubAlbumName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreatingSubAlbum(false)}>
                  {t("albums.cancel")}
                </button>
                <button type="button" className="btn-primary" onClick={() => createSubAlbum(selectedAlbum)}>
                  {t("albums.create")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-create-sub-album"
              onClick={() => setCreatingSubAlbum(true)}
            >
              <IconPlus size={16} /> {t("themes.create_sub_album")}
            </button>
          )}

          {items.length === 0 ? (
            <div className="albums-empty">
              <p>{t("albums.empty_album")}</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setScreen("camera")}
              >
                {t("albums.scan")}
              </button>
            </div>
          ) : isJuniorsAlbum ? (
            <div className="juniors-discovery-list">
              {items.map((d) => (
                <JuniorsDiscoveryCard
                  key={d.id}
                  discovery={d}
                  onClick={() => openDiscoveryDetail(d, backScreen)}
                  t={t}
                  typeLabel={typeLabel}
                  rarityLabel={rarityLabel}
                />
              ))}
            </div>
          ) : (
            <div className="discovery-grid">
              {items.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="discovery-item"
                  onClick={() => {
                    setReturnScreen(backScreen);
                    openDiscoveryDetail(d, "album-detail");
                  }}
                >
                  <img src={d.photo} alt={d.nom} />
                  <div className="discovery-item-info">
                    <h4>{d.nom}</h4>
                    <p>{d.nom_latin}</p>
                    {(d.rarete === "rare" || d.rarete === "tres_rare") && (
                      <span className={`discovery-item-rarity rarity-${d.rarete}`}>
                        {rarityLabel(d.rarete)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── DISCOVERY DETAIL ── */
  if (screen === "discovery-detail" && viewingDiscovery) {
    const d = viewingDiscovery;
    const data = {
      nom: d.nom,
      nom_latin: d.nom_latin,
      famille: d.famille,
      type: d.type,
      description: d.description,
      identification_note: d.identification_note,
      habitat: d.habitat,
      rarete: d.rarete,
      etat_sante: d.etat_sante,
      soins_traitement: d.soins_traitement,
      guide_entretien: d.guide_entretien,
      conseils_expert: d.conseils_expert,
      comportement: d.comportement,
      dangerosite: d.dangerosite,
      infos_utiles: d.infos_utiles,
      fun_fact: d.fun_fact,
      anecdotes: d.anecdotes,
    };
    const isJuniorsView = returnScreen === "juniors";

    return (
      <>
        <Head>
          <title>{d.nom} — Wilder</title>
        </Head>
        <div
          className={`discovery-screen screen-enter-fast${isJuniorsView ? " discovery-screen--juniors" : ""}`}
        >
          <div className="discovery-hero">
            <img src={d.photo} alt={d.nom} />
          </div>

          <div className="discovery-body">
            <button
              type="button"
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem" }}
              onClick={() => {
                setViewingDiscovery(null);
                setScreen(returnScreen === "album-detail" ? "album-detail" : returnScreen);
              }}
            >
              <IconBack size={16} /> {t("discovery.back")}
            </button>

            {isJuniorsView ? (
              <div className="juniors-detail-card">
                <span className="juniors-detail-emoji" aria-hidden="true">
                  🐛✨
                </span>
                <h2 className="juniors-detail-title">{t("themes.juniors.fun_title")}</h2>
                <p className="juniors-detail-learn">{t("themes.juniors.fun_learn")}</p>
                <h3 className="juniors-detail-name">{d.nom}</h3>
                <p className="juniors-detail-latin">{d.nom_latin}</p>
                <span className="juniors-detail-type">{typeLabel(d.type)}</span>
                {d.fun_fact && (
                  <div className="juniors-fun-fact-box">
                    <strong>💡 {t("themes.juniors.fun_fact_label")}</strong>
                    <p>{d.fun_fact}</p>
                  </div>
                )}
                {d.description && (
                  <p className="juniors-detail-desc">{d.description.slice(0, 200)}</p>
                )}
                <p className="juniors-detail-date">
                  📅 {t("discovery.discovered_on")} {formatDate(d.discoveredAt, locale)}
                </p>
              </div>
            ) : (
              <DiscoveryBody data={data} discovery={d} showNewBadge={false} t={t} lang={lang}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  {t("discovery.discovered_on")} {formatDate(d.discoveredAt, locale)}
                </p>
              </DiscoveryBody>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ── STATS ── */
  if (screen === "stats") {
    const typeEntries = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
    const maxTypeCount = typeEntries[0]?.[1] || 1;
    const monthLabels = stats.monthKeys.map((key) => {
      const [y, m] = key.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleDateString(locale, { month: "short" });
    });

    return (
      <>
        <Head>
          <title>{t("stats.title")} — Wilder</title>
        </Head>
        <div className="stats-screen screen-enter">
          <div className="albums-header">
            <h1 className="albums-title">{t("stats.title")}</h1>
            <ThemeToggle theme={theme} onToggle={toggleTheme} t={t} />
          </div>

          <div className="stats-hero">
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {t("stats.subtitle")}
            </p>
            <div className="stats-hero-grid">
              <div className="stat-card stat-card-highlight">
                <span className="stat-card-num">{stats.total}</span>
                <span className="stat-card-label">{t("stats.total")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.uniqueSpecies}</span>
                <span className="stat-card-label">{t("stats.unique")}</span>
              </div>
              <div className="stat-card stat-card-highlight">
                <span className="stat-card-num">{stats.rareCount}</span>
                <span className="stat-card-label">{t("stats.rare")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.thisMonth}</span>
                <span className="stat-card-label">{t("stats.this_month")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.countriesCount}</span>
                <span className="stat-card-label">{t("stats.countries")}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.citiesCount}</span>
                <span className="stat-card-label">{t("stats.cities")}</span>
              </div>
            </div>
          </div>

          {stats.favoriteType && (
            <div className="stats-section">
              <h2 className="stats-section-title">{t("stats.favorite")}</h2>
              <div className="favorite-category-card">
                <span className="favorite-category-label">{typeLabel(stats.favoriteType)}</span>
                <strong>{stats.byType[stats.favoriteType]} {t("stats.total").toLowerCase()}</strong>
              </div>
            </div>
          )}

          {stats.monthKeys.some((k) => stats.monthly[k] > 0) && (
            <div className="stats-section">
              <h2 className="stats-section-title">{t("stats.monthly")}</h2>
              <div className="monthly-chart">
                {stats.monthKeys.map((key, i) => (
                  <div key={key} className="monthly-bar-col">
                    <div className="monthly-bar-track">
                      <div
                        className="monthly-bar-fill"
                        style={{ height: `${Math.round((stats.monthly[key] / stats.maxMonthly) * 100)}%` }}
                      />
                    </div>
                    <span className="monthly-bar-count">{stats.monthly[key] || ""}</span>
                    <span className="monthly-bar-label">{monthLabels[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {typeEntries.length > 0 && (
            <div className="stats-section">
              <h2 className="stats-section-title">{t("stats.by_category")}</h2>
              {typeEntries.map(([type, count]) => (
                <div key={type} className="stat-bar-row">
                  <span className="stat-bar-label">{typeLabel(type)}</span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${Math.round((count / maxTypeCount) * 100)}%` }}
                    />
                  </div>
                  <span className="stat-bar-count">{count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="stats-section">
            <h2 className="stats-section-title">{t("stats.by_rarity")}</h2>
            <div className="rarity-stats-grid">
              {["commun", "peu_commun", "rare", "tres_rare"].map((key) => (
                <div key={key} className={`rarity-stat-pill rarity-${key}`}>
                  <span>{rarityLabel(key)}</span>
                  <strong>{stats.byRarity[key] || 0}</strong>
                </div>
              ))}
            </div>
          </div>

          {stats.total === 0 && (
            <div className="albums-empty">
              <p>{t("stats.empty")}</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setScreen("camera")}
              >
                {t("home.discover")}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary stats-back-home"
          style={{ margin: "1rem 1.25rem 2rem" }}
          onClick={goHome}
        >
          <IconBack size={16} /> {t("discovery.home")}
        </button>
      </>
    );
  }

  /* ── TROPHIES ── */
  if (screen === "trophies") {
    return (
      <>
        <Head>
          <title>{t("trophies.title")} — Wilder</title>
        </Head>
        <div className="trophies-screen screen-enter">
          <div className="albums-header">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
              onClick={goHome}
              aria-label={t("discovery.back")}
            >
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">{t("trophies.title")}</h1>
          </div>
          <div className="trophies-grid">
            {BADGE_DEFS.map((badge) => {
              const unlocked = isBadgeUnlocked(discoveries, badge);
              const { current, target } = getBadgeProgress(discoveries, badge);
              return (
                <div
                  key={badge.id}
                  className={`trophy-card${unlocked ? " unlocked" : ""}`}
                >
                  <span className="trophy-icon">{badge.icon}</span>
                  <h3>{t(`badges.${badge.id}.name`)}</h3>
                  <p>{t(`badges.${badge.id}.desc`)}</p>
                  <div className="trophy-progress-wrap">
                    <div
                      className="trophy-progress-fill"
                      style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                    />
                  </div>
                  <span className="trophy-status">
                    {unlocked
                      ? t("trophies.unlocked")
                      : t("trophies.progress", { current, target })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  /* ── ABOUT ── */
  if (screen === "about") {
    return (
      <>
        <Head>
          <title>{t("about.title")} — Wilder</title>
        </Head>
        <div className="about-screen screen-enter">
          <div className="albums-header">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
              onClick={goHome}
              aria-label={t("discovery.back")}
            >
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">{t("about.title")}</h1>
          </div>
          <div className="about-content">
            <div className="about-logo-wrap">
              <IconWilderLogo size={96} />
              <h2>Wilder</h2>
              <p className="about-version">{t("about.version")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.vision_title")}</h3>
              <p>{t("about.vision")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.mission_title")}</h3>
              <p>{t("about.mission")}</p>
            </div>
            <a
              className="btn-primary about-rate-btn"
              href="https://apps.apple.com/app/wilder"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⭐ {t("about.rate")}
            </a>
          </div>
        </div>
      </>
    );
  }

  /* ── THEMATIC SCREENS (Potager, Randos, Jardin, Juniors) ── */
  if (isThemeScreen(screen)) {
    return (
      <ThemeAlbumsScreen
        themeId={screen}
        albums={albums}
        discoveries={discoveries}
        albumsViewMode={albumsViewMode}
        setAlbumsViewMode={setAlbumsViewMode}
        jardinTab={jardinTab}
        setJardinTab={setJardinTab}
        creatingAlbum={creatingAlbum}
        setCreatingAlbum={setCreatingAlbum}
        newAlbumName={newAlbumName}
        setNewAlbumName={setNewAlbumName}
        mapSheetAlbum={mapSheetAlbum}
        setMapSheetAlbum={setMapSheetAlbum}
        mapLoadedCount={mapLoadedCount}
        setMapLoadedCount={setMapLoadedCount}
        setAlbums={setAlbums}
        setSelectedAlbumId={setSelectedAlbumId}
        setReturnScreen={setReturnScreen}
        setScreen={setScreen}
        openDiscoveryDetail={openDiscoveryDetail}
        createAlbumFromList={createAlbumFromList}
        t={t}
        locale={locale}
        theme={theme}
        onToggleTheme={toggleTheme}
        navigateMain={navigateMain}
      />
    );
  }

  return null;
}
