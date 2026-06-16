import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import Confetti from "@/components/Confetti";
import {
  createT,
  detectLang,
  getLocale,
  getRarityLabel,
  getTypeLabel,
  saveLang,
  SUPPORTED_LANGS,
  LANG_LABELS,
} from "@/lib/i18n";
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
import AnalyzeLoadingScreen from "@/components/AnalyzeLoadingScreen";
import DiscoveryAnalysisSections, {
  discoveryToAnalysisData,
  extractSummarySentence,
} from "@/components/DiscoveryAnalysisSections";
import DiscoveryResultActions from "@/components/DiscoveryResultActions";
import DiscoveryFunFact from "@/components/DiscoveryFunFact";
import { shareDiscovery } from "@/lib/share";
import { computeStats } from "@/lib/stats";
import { isHeritageType } from "@/lib/categories";
import OnboardingScreen from "@/components/OnboardingScreen";
import WelcomeSlidesScreen from "@/components/WelcomeSlidesScreen";
import EntryChoiceScreen from "@/components/EntryChoiceScreen";
import SubscriptionScreen from "@/components/SubscriptionScreen";
import FreemiumAdBanner from "@/components/FreemiumAdBanner";
import ScanQuotaNotice from "@/components/ScanQuotaNotice";
import {
  logOnboardingBootState,
  markOnboardingVu,
  shouldShowWelcomeSlides,
} from "@/lib/welcomeSlides";
import {
  markEntryChoiceDone,
  shouldShowEntryChoice,
} from "@/lib/entryChoice";
import {
  buildScanQuotaHeaders,
  refreshScanQuota,
} from "@/lib/scanQuotaClient";
import {
  canScan,
  isPremium,
  shouldShowPaywall,
  shouldShowAdBanner,
  syncScanQuotaFromServer,
} from "@/lib/freemium";
import { isPermanentAuthUser } from "@/lib/authUser";
import { consumePendingCheckoutPlan } from "@/lib/subscribeFlow";
import { resolveSubscribeEntry } from "@/lib/subscribeCheckout";
import {
  bootstrapCloudSync,
  deleteDiscoveryFromCloud,
  ensureCloudAuth,
  flushPendingSync,
  getCloudSession,
  signOutCloud,
  subscribeToAuthSession,
} from "@/lib/cloudSync";
import { logPersistenceBootState } from "@/lib/persistenceBootLog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SignupPromptBanner from "@/components/SignupPromptBanner";
import FeatureGateModal from "@/components/FeatureGateModal";
import SignupPromptModal from "@/components/SignupPromptModal";
import { useGuestAccount } from "@/hooks/useGuestAccount";
import PotagerView from "@/components/PotagerView";
import AnimalAudioRecorder from "@/components/AnimalAudioRecorder";
import WilderWrapped from "@/components/WilderWrapped";
import BiodexCollection from "@/components/BiodexCollection";
import DuoModePanel from "@/components/DuoModePanel";
import CloudAccountCard from "@/components/CloudAccountCard";
import HomeDashboard from "@/components/HomeDashboard";
import HomeGreeting from "@/components/HomeGreeting";
import WilderHomeScreen from "@/components/WilderHomeScreen";
import { buildDailySpeciesViewModel, buildDailySpeciesAnalysisData } from "@/lib/dailySpecies";
import { DailySpeciesHero, DiscoveryHeroPhoto } from "@/components/DiscoveryPhotoThumb";
import { openInstallGuideModal } from "@/components/InstallGuideModalHost";
import Logo from "@/components/Logo";
import { getWrappedYear } from "@/lib/wrapped";
import { recordDuoDiscovery } from "@/lib/duoMode";
import { recordNatureActivity } from "@/lib/natureStreak";
import {
  scheduleInstallGuideAfterFirstScan,
  tryConsumeInstallGuideAutoShow,
} from "@/lib/installGuide";
import { computeEspaceVertScore, getScoreTier } from "@/lib/espaceVertScore";
import ThemeAlbumsList from "@/components/ThemeAlbumsList";
import WilderScreenHeader from "@/components/WilderScreenHeader";
import PotagerScanResult from "@/components/PotagerScanResult";
import PotagerDailyCareResult from "@/components/PotagerDailyCareResult";
import {
  buildDailyCareSession,
  saveDailyCare,
  toggleDailyCareTask,
} from "@/lib/potagerDailyCare";
import { upsertPotagerPlantFromDiscovery } from "@/lib/potagerPlant";
import { recordPotagerWatering } from "@/lib/potagerEngagement";
import EspacesVertsView from "@/components/EspacesVertsView";
import AnimauxView from "@/components/AnimauxView";
import { ThemeIcon } from "@/components/ThemeIcons";
import EspaceVertPlantList from "@/components/EspaceVertPlantList";
import JardinScanResult from "@/components/JardinScanResult";
import AnimalScanResult from "@/components/AnimalScanResult";
import { CARE_SCAN, applyCareToDiscovery } from "@/lib/espaceVertPlant";
import {
  discoveryToScanResult,
  getDefaultJardinAlbumId,
} from "@/lib/espaceVertGarden";
import {
  buildAnimalDiscoveryFields,
  discoveryToAnimalResult,
  getDefaultAnimauxAlbumId,
} from "@/lib/animaux";
import { getAnimalContext } from "@/lib/animalAudio";
import { inferHealthFromEtatSante } from "@/lib/potagerHealth";
import RandosView from "@/components/RandosView";
import RandoScanResult from "@/components/RandoScanResult";
import RandoNatureAlerts from "@/components/RandoNatureAlerts";
import RandoJournal from "@/components/RandoJournal";
import RandoMap from "@/components/RandoMap";
import {
  acquireCameraStream,
  completeOnboarding,
  isCameraGranted,
  isOnboardingComplete,
} from "@/lib/permissions";
import { computeTrackDistanceKm } from "@/lib/randos";
import { compressDataUrl } from "@/lib/compressImage";
import { captureViewfinderFrame } from "@/lib/cameraCapture";
import {
  loadAlbums,
  loadDiscoveries,
  saveAlbums,
  saveDiscoveries,
} from "@/lib/discoveriesStorage";
import { persistDiscoveries } from "@/lib/persistDiscovery";
import { removeDiscoveryById, removePotagerPlantById } from "@/lib/removeDiscovery";
import { removeAlbumById } from "@/lib/removeAlbum";
import { getAlbumDisplayName, getFirstDiscoveryPhoto, getAlbumPhotos } from "@/lib/albumUtils";
import SwipeToDelete from "@/components/SwipeToDelete";
import {
  ALBUM_THEMES,
  DEFAULT_ALBUM_THEME,
  getHerbariumDiscoveries,
  getRootAlbums,
  getSubAlbums,
  isThemeScreen,
  normalizeAlbumTheme,
  resolveScanBackScreen,
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

function buildAlbumRecord({
  name,
  createdAt,
  coverPhoto,
  discoveryIds,
  location,
  theme = DEFAULT_ALBUM_THEME,
  parentId = null,
  spaceKind = null,
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
    ...(spaceKind ? { spaceKind } : {}),
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

const CASTLE_MARKER_HTML = `<div class="wilder-map-marker wilder-map-marker-heritage" aria-hidden="true">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#F5F2EB">
    <path d="M3 21h18v-2H3v2zM5 19h2v-6H5v6zm4 0h2v-8H9v8zm4 0h2v-4h-2v4zm4 0h2v-8h-2v8zM3 11l9-7 9 7v2H3v-2z"/>
  </svg>
</div>`;

async function prepareAlbumsForMap() {
  const discoveries = loadDiscoveries();
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

function ThemeToggle({ theme, onToggle, t, className = "" }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      onClick={onToggle}
      aria-label={isDark ? t("home.theme_light") : t("home.theme_dark")}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
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

      const castleIcon = L.divIcon({
        className: "wilder-map-marker-wrap",
        html: CASTLE_MARKER_HTML,
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

        const heritage = isHeritageType(d.type);
        const icon = heritage ? castleIcon : leafIcon;
        const typeLabel = getTypeLabel(t, d.type || "plante");

        const popupHtml = `
          <div class="map-popup">
            ${d.photo ? `<img src="${escapeHtml(d.photo)}" alt="" class="map-popup-photo" />` : ""}
            <h3 class="map-popup-title">${escapeHtml(d.nom)}</h3>
            <p class="map-popup-meta">${escapeHtml(typeLabel)}${d.placeName ? ` · ${escapeHtml(d.placeName)}` : ""}</p>
            <p class="map-popup-meta">${escapeHtml(formatDate(d.discoveredAt, locale))}</p>
          </div>
        `;

        L.marker([d.latitude, d.longitude], { icon })
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

function AlbumsMapView({ onSelectAlbum, onLoadedCount, onAlbumsSynced, t, themeFilter }) {
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
      await prepareAlbumsForMap();
      let storedAlbums = loadAlbums();
      if (themeFilter) {
        storedAlbums = storedAlbums.filter((a) => a.theme === themeFilter);
      }
      const storedDiscoveries = loadDiscoveries();

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
  }, [t, themeFilter]);

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

function HomeFireflies() {
  const flies = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${6 + (i * 6.5) % 88}%`,
    top: `${12 + (i * 9.7) % 55}%`,
    delay: `${i * 0.65}s`,
    duration: `${2.8 + (i % 5) * 0.6}s`,
    size: 2 + (i % 4),
  }));

  return (
    <div className="home-fireflies" aria-hidden="true">
      {flies.map((f) => (
        <span
          key={f.id}
          className="home-firefly"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
        />
      ))}
    </div>
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

function Viewfinder({ viewfinderRef, label }) {
  return (
    <div className="viewfinder-stack">
      <p className="viewfinder-label">{label}</p>
      <div ref={viewfinderRef} className="viewfinder-wilder" aria-hidden="true" />
    </div>
  );
}

function ShareButton({ discovery, t, lang, onBeforeShare }) {
  const [sharing, setSharing] = useState(false);
  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  const handleShare = async () => {
    if (onBeforeShare?.()) return;
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

function BadgeUnlockToast({ badge, t, onClose, onViewTrophies }) {
  return (
    <div className="badge-unlock-toast" role="alert">
      <span className="badge-unlock-icon">{badge.icon}</span>
      <div>
        <p className="badge-unlock-label">{t("trophies.new_badge")}</p>
        <p className="badge-unlock-name">{t(`badges.${badge.id}.name`)}</p>
        {onViewTrophies && (
          <button type="button" className="badge-unlock-view" onClick={onViewTrophies}>
            {t("home.trophies")} →
          </button>
        )}
      </div>
      <button type="button" className="badge-unlock-close" onClick={onClose} aria-label="OK">✓</button>
    </div>
  );
}

function OrganizeSavedToast({ message }) {
  return (
    <div className="organize-saved-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

function DiscoveryBody({
  data,
  discovery,
  showNewBadge,
  showFirstDiscoveryBadge,
  t,
  lang,
  onShare,
  showInlineShare,
  onShareGate,
  children,
}) {
  const summary = extractSummarySentence(data?.description);

  return (
    <>
      <div className="discovery-intro-panel">
        {showFirstDiscoveryBadge && (
          <span className="discovery-first-badge">{t("first_discovery.badge")}</span>
        )}
        {showNewBadge && !showFirstDiscoveryBadge && (
          <span className="discovery-new-badge">{t("discovery.new")}</span>
        )}
        <h1 className="discovery-name">{data.nom}</h1>
        {data.nom_latin && <p className="discovery-latin">{data.nom_latin}</p>}

        <div className="discovery-tags-row">
          {data.type && (
            <span className={`discovery-type-chip${isHeritageType(data.type) ? " discovery-type-chip-heritage" : ""}`}>
              {getTypeLabel(t, data.type)}
            </span>
          )}
        </div>

        {summary && <p className="discovery-summary">{summary}</p>}
      </div>

      <DiscoveryFunFact data={data} t={t} />

      <AnimalSoundQuiz data={data} t={t} />

      <DiscoveryAnalysisSections
        data={data}
        t={t}
        lang={lang}
        discoveryId={discovery?.id}
      />

      {discovery && onShare !== false && showInlineShare !== false && (
        <ShareButton
          discovery={discovery}
          t={t}
          lang={lang}
          onBeforeShare={onShareGate ? () => onShareGate() : undefined}
        />
      )}

      {children}
    </>
  );
}

function ThemeAlbumPickerModal({ albums, onSelect, onCreate, onClose, t, locale, startTheme = null }) {
  const [step, setStep] = useState(startTheme ? "album" : "theme");
  const [pickedTheme, setPickedTheme] = useState(startTheme);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const themeAlbums = pickedTheme
    ? albums.filter((a) => normalizeAlbumTheme(a) === pickedTheme && !a.parentId)
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

function ThemeAlbumsScreen({
  themeId,
  albums,
  discoveries,
  creatingAlbum,
  setCreatingAlbum,
  newAlbumName,
  setNewAlbumName,
  setAlbums,
  setSelectedAlbumId,
  setReturnScreen,
  setScreen,
  openDiscoveryDetail,
  createAlbumFromList,
  t,
  lang,
  locale,
  theme,
  onToggleTheme,
  onStartScan,
  onDeleteAlbum,
  swipeLabels,
  defaultAlbumNameLabel,
}) {
  const openThemeAlbum = (albumId) => {
    setReturnScreen(themeId);
    setSelectedAlbumId(albumId);
    setScreen("album-detail");
  };

  const albumsListProps = {
    themeId: "juniors",
    themeEmoji: THEME_META.juniors.emoji,
    albums,
    discoveries,
    locale,
    t,
    creatingAlbum,
    setCreatingAlbum,
    newAlbumName,
    setNewAlbumName,
    onCreateAlbum: createAlbumFromList,
    onOpenAlbum: openThemeAlbum,
    onDeleteAlbum,
    swipeLabels,
    defaultAlbumName: defaultAlbumNameLabel,
  };

  const openDiscovery = (d) => openDiscoveryDetail(d, themeId);

  return (
    <>
      <Head>
        <title>
          {t(`themes.${themeId}.title`)} — Wilder
        </title>
      </Head>
      <div
        className={`albums-screen screen-enter theme-screen theme-screen--${themeId}${themeId === "juniors" ? " theme-screen--juniors" : ""}`}
      >
        <WilderScreenHeader
          title={t(`themes.${themeId}.title`)}
          subtitle={t(`themes.${themeId}.subtitle`)}
          themeId={themeId}
          onBack={() => setScreen("home")}
          backLabel={t("wilder.back_home")}
          actions={<ThemeToggle theme={theme} onToggle={onToggleTheme} t={t} className="theme-toggle--header" />}
        />

        {themeId === "potager" ? (
          <PotagerView
            onStartScan={onStartScan}
            albums={albums}
            discoveries={discoveries}
            locale={locale}
            t={t}
            lang={lang}
            onOpenDiscovery={openDiscovery}
          />
        ) : (
          <AnimauxView onStartScan={onStartScan} t={t}>
            <ThemeAlbumsList {...albumsListProps} />
          </AnimauxView>
        )}
      </div>
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
  const [albumPickerStartTheme, setAlbumPickerStartTheme] = useState(null);
  const [organizeSaved, setOrganizeSaved] = useState({});
  const [organizeSaveToast, setOrganizeSaveToast] = useState(null);
  const [savedToAlbum, setSavedToAlbum] = useState(false);
  const [biodexAnim, setBiodexAnim] = useState(true);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [albumsViewMode, setAlbumsViewMode] = useState("list");
  const [mapSheetAlbum, setMapSheetAlbum] = useState(null);
  const [mapLoadedCount, setMapLoadedCount] = useState(null);
  const [camError, setCamError] = useState("");
  const [camLoading, setCamLoading] = useState(false);
  const [camZoom, setCamZoom] = useState(1);
  const [needsWelcomeSlides, setNeedsWelcomeSlides] = useState(false);
  const [needsEntryChoice, setNeedsEntryChoice] = useState(false);
  const [authBootState, setAuthBootState] = useState("loading");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [viewingDiscovery, setViewingDiscovery] = useState(null);
  const [dailyPickView, setDailyPickView] = useState(null);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [returnScreen, setReturnScreen] = useState("home");
  const [creatingSubAlbum, setCreatingSubAlbum] = useState(false);
  const [newSubAlbumName, setNewSubAlbumName] = useState("");
  const [lang, setLangState] = useState(() => detectLang());
  const setLang = useCallback((code) => {
    if (!SUPPORTED_LANGS.includes(code)) return;
    saveLang(code);
    setLangState(code);
  }, []);
  const [theme, setTheme] = useState("light");
  const [scanCount, setScanCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFirstDiscoveryBadge, setShowFirstDiscoveryBadge] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [activeRandoAlbumId, setActiveRandoAlbumId] = useState(null);
  const [randoTrack, setRandoTrack] = useState([]);
  const [showRandoMap, setShowRandoMap] = useState(false);
  const [randoJournalAlbumId, setRandoJournalAlbumId] = useState(null);
  const [rescanDiscoveryId, setRescanDiscoveryId] = useState(null);
  const [scanTargetAlbumId, setScanTargetAlbumId] = useState(null);
  const [scanMode, setScanMode] = useState("single");
  const [homeScanCategory, setHomeScanCategory] = useState(null);
  const [dailyCareSession, setDailyCareSession] = useState(null);
  const [careJournalRefreshKey, setCareJournalRefreshKey] = useState(0);
  const [jardinPlantDiscovery, setJardinPlantDiscovery] = useState(null);
  const [animalDiscovery, setAnimalDiscovery] = useState(null);
  const [premiumUserEmail, setPremiumUserEmail] = useState(null);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [featureGateOpen, setFeatureGateOpen] = useState(false);
  const [subscriptionEntry, setSubscriptionEntry] = useState({
    initialStep: "checkout",
    defaultPlan: "yearly",
    resumeCheckoutPlan: null,
  });

  const {
    isGuest,
    guestCanScan,
    recordGuestScan,
    refreshGuestAccount,
  } = useGuestAccount();

  const pendingGuestActionRef = useRef(null);
  const guestAutoSavePromptedRef = useRef(false);

  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef({ dist: 0, zoom: 1 });
  const hardwareZoomRef = useRef({ min: 1, max: 1, step: 0.1, supported: false });
  const organizeReturnTimerRef = useRef(null);

  const openFeatureGateModal = useCallback((pendingAction) => {
    pendingGuestActionRef.current = pendingAction ?? null;
    setFeatureGateOpen(true);
  }, []);

  const closeFeatureGateModal = useCallback(() => {
    setFeatureGateOpen(false);
    pendingGuestActionRef.current = null;
  }, []);

  const openSignupLimitModal = useCallback(() => {
    pendingGuestActionRef.current = null;
    setSignupModalOpen(true);
  }, []);

  const closeSignupModal = useCallback(() => {
    setSignupModalOpen(false);
    pendingGuestActionRef.current = null;
  }, []);

  const handleSignupAccountCreated = useCallback(async () => {
    markOnboardingVu();
    setNeedsWelcomeSlides(false);
    const session = await getCloudSession();
    const user = session?.user;
    if (user && isPermanentAuthUser(user)) {
      setPremiumUserEmail(user.email || "");
      const syncResult = await bootstrapCloudSync();
      if (syncResult.ok && syncResult.discoveries) {
        setDiscoveries(syncResult.discoveries);
      }
      logPersistenceBootState(session, syncResult.discoveries?.length ?? loadDiscoveries().length);
    }
    await refreshGuestAccount();
    setSignupModalOpen(false);
    setFeatureGateOpen(false);
    const fn = pendingGuestActionRef.current;
    pendingGuestActionRef.current = null;
    guestAutoSavePromptedRef.current = false;
    if (fn) fn();
  }, [refreshGuestAccount]);

  const openSignupFromBanner = useCallback(() => {
    openFeatureGateModal(null);
  }, [openFeatureGateModal]);

  const gateGuestShare = useCallback(() => {
    if (!isGuest) return false;
    openFeatureGateModal();
    return true;
  }, [isGuest, openFeatureGateModal]);

  const gateGuestScanBeforeCamera = useCallback(() => {
    if (!isGuest || guestCanScan) return false;
    openSignupLimitModal();
    return true;
  }, [isGuest, guestCanScan, openSignupLimitModal]);

  const t = useMemo(() => createT(lang), [lang]);
  const locale = useMemo(() => getLocale(lang), [lang]);
  const typeLabel = useCallback((type) => getTypeLabel(t, type), [t]);
  const rarityLabel = useCallback((r) => getRarityLabel(t, r), [t]);

  const randoDiscoveries = useMemo(() => {
    if (!activeRandoAlbumId) return [];
    const album = albums.find((a) => a.id === activeRandoAlbumId);
    if (!album) return [];
    const ids = new Set(album.discoveryIds || []);
    return discoveries.filter((d) => ids.has(d.id));
  }, [activeRandoAlbumId, albums, discoveries]);

  const activeRandoDistance = useMemo(
    () => computeTrackDistanceKm(randoTrack),
    [randoTrack]
  );

  const randoCurrentPosition = useMemo(() => {
    if (!randoTrack.length) return null;
    const last = randoTrack[randoTrack.length - 1];
    return last?.latitude != null ? last : null;
  }, [randoTrack]);

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

  useEffect(() => {
    refreshScanQuota().then((quota) => {
      syncScanQuotaFromServer(quota);
      setScanCount(quota.count);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") !== "success") return;

    let cancelled = false;
    const pollPremiumFromServer = async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (cancelled) return;
        const quota = await refreshScanQuota();
        syncScanQuotaFromServer(quota);
        setScanCount(quota.count);
        if (quota.isPremium) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    pollPremiumFromServer();

    const url = new URL(window.location.href);
    url.searchParams.delete("stripe");
    url.searchParams.delete("session_id");
    const next = url.pathname + url.search + url.hash;
    window.history.replaceState({}, "", next);
  }, []);

  const openSubscription = useCallback(async () => {
    const entry = await resolveSubscribeEntry();
    setSubscriptionEntry(entry);
    setScreen("subscription");
  }, []);

  const openSubscriptionFromHome = useCallback(async () => {
    setReturnScreen("home");
    const entry = await resolveSubscribeEntry();
    setSubscriptionEntry(entry);
    setScreen("subscription");
  }, []);

  useEffect(() => {
    if (screen !== "home") return;
    let cancelled = false;
    getCloudSession().then((session) => {
      if (cancelled) return;
      const user = session?.user;
      if (user && isPermanentAuthUser(user)) {
        setPremiumUserEmail(user.email || "");
      } else {
        setPremiumUserEmail(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screen, isGuest]);

  const freemiumAdBanner =
    shouldShowAdBanner() && !isPremium() ? (
      <FreemiumAdBanner t={t} onUpgrade={openSubscription} blocked />
    ) : null;

  const finishDiscoveryFlow = useCallback(
    (updated, wasRescan) => {
      setDiscoveries(updated);
      recordNatureActivity();
      setRescanDiscoveryId(null);
      if (wasRescan) setSavedToAlbum(true);

      if (isGuest) recordGuestScan();

      const isFirstEver = !wasRescan && updated.length === 1;
      if (isFirstEver) {
        scheduleInstallGuideAfterFirstScan();
        const seen = loadSeenBadges();
        const fresh = getNewBadgeIds(updated, seen);
        if (fresh.length > 0) saveSeenBadges([...seen, ...fresh]);
        setShowFirstDiscoveryBadge(true);
        setScreen("result");
        setShowConfetti(true);
        playBadgeUnlockSound();
        return;
      }

      if (!isPremium() && shouldShowPaywall()) {
        setScreen("subscription");
        playDiscoverySound();
        return;
      }

      setScreen("result");
      if (checkNewBadges(updated)) {
        playBadgeUnlockSound();
      } else {
        playDiscoverySound();
      }
    },
    [checkNewBadges, isGuest, recordGuestScan]
  );

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

  const finishEntryFlow = useCallback(async () => {
    markOnboardingVu();
    markEntryChoiceDone();
    setNeedsEntryChoice(false);
    const session = await getCloudSession();
    const user = session?.user;
    if (user && isPermanentAuthUser(user)) {
      setPremiumUserEmail(user.email || "");
    }
    await refreshGuestAccount();
    const items = loadDiscoveries();
    if (!isOnboardingComplete() && items.length === 0) {
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
      setReturnScreen("home");
      setScreen("home");
    }
  }, [refreshGuestAccount]);

  const handleWelcomeComplete = useCallback(() => {
    markOnboardingVu();
    setNeedsWelcomeSlides(false);
    setNeedsEntryChoice(true);
  }, []);

  const applyWelcomeSlidesFromSession = useCallback((session) => {
    logOnboardingBootState(session);
    setNeedsWelcomeSlides(shouldShowWelcomeSlides(session));
  }, []);

  const applyEntryChoiceFromSession = useCallback((session) => {
    setNeedsEntryChoice(shouldShowEntryChoice(session));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthSession(
      (session) => {
        applyWelcomeSlidesFromSession(session);
        applyEntryChoiceFromSession(session);
        const user = session?.user;
        if (user && isPermanentAuthUser(user)) {
          setPremiumUserEmail(user.email || "");
        }
      },
      async () => {
        setAuthBootState("ready");
        const session = await getCloudSession();
        logPersistenceBootState(session, loadDiscoveries().length);
      }
    );
    return unsubscribe;
  }, [applyWelcomeSlidesFromSession, applyEntryChoiceFromSession]);

  useEffect(() => {
    if (authBootState !== "ready") return;

    const pending = consumePendingCheckoutPlan();
    if (!pending) return;

    let cancelled = false;
    (async () => {
      await ensureCloudAuth();
      const session = await getCloudSession();
      if (cancelled || !isPermanentAuthUser(session?.user)) return;
      setReturnScreen("home");
      setSubscriptionEntry({
        initialStep: "checkout",
        defaultPlan: pending,
        resumeCheckoutPlan: pending,
      });
      setScreen("subscription");
    })();

    return () => {
      cancelled = true;
    };
  }, [authBootState]);

  useEffect(() => {
    if (authBootState !== "ready" || needsWelcomeSlides || needsEntryChoice) return;

    const items = loadDiscoveries();
    if (isOnboardingComplete()) {
      setNeedsOnboarding(false);
    } else if (items.length > 0) {
      completeOnboarding();
      setNeedsOnboarding(false);
    } else {
      setNeedsOnboarding(true);
    }
  }, [authBootState, needsWelcomeSlides, needsEntryChoice]);

  useEffect(() => {
    if (authBootState !== "ready" || needsWelcomeSlides || needsEntryChoice) return;
    if (tryConsumeInstallGuideAutoShow()) {
      openInstallGuideModal();
    }
  }, [screen, authBootState, needsWelcomeSlides, needsEntryChoice]);

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
    if (authBootState !== "ready" || needsWelcomeSlides || needsEntryChoice) return;

    const items = loadDiscoveries();
    setDiscoveries(items);
    setAlbums(loadAlbums());
    const seen = loadSeenBadges();
    if (seen.length === 0 && items.length > 0) {
      saveSeenBadges(computeUnlockedBadgeIds(items));
    }
    bootstrapCloudSync().then(async (result) => {
      const loaded = result.ok && result.discoveries ? result.discoveries : items;
      if (result.ok && result.discoveries) {
        setDiscoveries(result.discoveries);
      }
      const session = await getCloudSession();
      logPersistenceBootState(session, loaded.length);
    });
    const onFirstTouch = () => warmUpSounds();
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstTouch);
  }, [authBootState, needsWelcomeSlides, needsEntryChoice]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        flushPendingSync();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
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
      setBiodexAnim(true);
      const t = setTimeout(() => setBiodexAnim(false), 900);
      return () => clearTimeout(t);
    }
  }, [screen, result?.nom]);

  useEffect(() => {
    if (!activeRandoAlbumId) {
      setRandoTrack([]);
      return;
    }
    const album = loadAlbums().find((a) => a.id === activeRandoAlbumId);
    if (album?.gpsTrack?.length) setRandoTrack(album.gpsTrack);
  }, [activeRandoAlbumId]);

  const endRando = useCallback(() => {
    if (!activeRandoAlbumId) return;
    const endedId = activeRandoAlbumId;
    const allAlbums = loadAlbums();
    const idx = allAlbums.findIndex((a) => a.id === endedId);
    if (idx !== -1) {
      allAlbums[idx] = {
        ...allAlbums[idx],
        gpsTrack: randoTrack,
        endedAt: new Date().toISOString(),
      };
      saveAlbums(allAlbums);
      setAlbums(allAlbums);
    }
    setActiveRandoAlbumId(null);
    setRandoTrack([]);
    setShowRandoMap(false);
    setRandoJournalAlbumId(endedId);
    setScreen("randos");
  }, [activeRandoAlbumId, randoTrack]);

  const clearScanSession = useCallback(() => {
    if (organizeReturnTimerRef.current) {
      clearTimeout(organizeReturnTimerRef.current);
      organizeReturnTimerRef.current = null;
    }
    setOrganizeSaveToast(null);
    setResult(null);
    setCaptured(null);
    setCurrentDiscovery(null);
    setSavedToAlbum(false);
    setShowAlbumPicker(false);
    setAlbumPickerStartTheme(null);
    setOrganizeSaved({});
    setRescanDiscoveryId(null);
    setScanTargetAlbumId(null);
    setScanMode("single");
    setDailyCareSession(null);
    setShowFirstDiscoveryBadge(false);
  }, []);

  const startDailyCareScan = useCallback(() => {
    setScanMode("daily-care");
    setReturnScreen("potager");
    setScanTargetAlbumId(null);
    setRescanDiscoveryId(null);
    setScreen("camera");
  }, []);

  const startScan = useCallback(
    async (origin, { albumId: targetAlbumId, animalMode } = {}) => {
      if (animalMode === "sound") {
        setReturnScreen(origin);
        setRescanDiscoveryId(null);
        setScreen("animal-sound");
        return;
      }
      const quota = await refreshScanQuota();
      syncScanQuotaFromServer(quota);
      setScanCount(quota.count);
      if (gateGuestScanBeforeCamera()) {
        setReturnScreen(origin);
        return;
      }
      if (!canScan()) {
        setReturnScreen(origin);
        setScreen("subscription");
        return;
      }
      const juniorsModes = ["animal", "traces"];
      setScanMode(juniorsModes.includes(animalMode) ? animalMode : "single");
      setReturnScreen(origin);
      setRescanDiscoveryId(null);
      if (targetAlbumId) {
        setScanTargetAlbumId(targetAlbumId);
      } else if (origin === "jardin") {
        let albumId = getDefaultJardinAlbumId(albums);
        if (!albumId) {
          const createdAt = new Date().toISOString();
          const album = buildAlbumRecord({
            name: t("themes.jardin.default_space"),
            createdAt,
            coverPhoto: null,
            discoveryIds: [],
            location: null,
            theme: "jardin",
          });
          const updated = [album, ...loadAlbums()];
          saveAlbums(updated);
          setAlbums(updated);
          albumId = album.id;
        }
        setScanTargetAlbumId(albumId);
      } else if (origin === "juniors") {
        let albumId = getDefaultAnimauxAlbumId(albums);
        if (!albumId) {
          const createdAt = new Date().toISOString();
          const album = buildAlbumRecord({
            name: t("themes.juniors.default_album"),
            createdAt,
            coverPhoto: null,
            discoveryIds: [],
            location: null,
            theme: "juniors",
          });
          const updated = [album, ...loadAlbums()];
          saveAlbums(updated);
          setAlbums(updated);
          albumId = album.id;
        }
        setScanTargetAlbumId(albumId);
      } else {
        setScanTargetAlbumId(null);
      }
      setScreen("camera");
    },
    [albums, t, gateGuestScanBeforeCamera]
  );

  const resumeRando = useCallback(() => {
    setShowRandoMap(false);
    setResult(null);
    setCaptured(null);
    setScreen("camera");
  }, []);

  const leaveScanner = useCallback(() => {
    if (activeRandoAlbumId) {
      setShowRandoMap(false);
      setScreen("randos");
      return;
    }
    const back = resolveScanBackScreen(returnScreen);
    clearScanSession();
    setErrorMsg("");
    setScreen(back);
  }, [activeRandoAlbumId, returnScreen, clearScanSession]);

  const goHome = () => {
    clearScanSession();
    setErrorMsg("");
    setShowRandoMap(false);
    setScreen("home");
  };

  const leaveResult = useCallback(() => {
    const back = resolveScanBackScreen(returnScreen);
    clearScanSession();
    if (back === "home") {
      setErrorMsg("");
      setShowRandoMap(false);
    }
    setScreen(back);
  }, [returnScreen, clearScanSession]);

  const startRando = useCallback(() => {
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name: defaultAlbumName(t, locale),
      createdAt,
      coverPhoto: null,
      discoveryIds: [],
      theme: "randos",
    });
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setRandoTrack([]);
    setShowRandoMap(false);
    setActiveRandoAlbumId(album.id);
    setReturnScreen("randos");
    setScreen("camera");
  }, [t, locale]);

  const startRandoFromTrail = useCallback(
    async (trail) => {
      const createdAt = new Date().toISOString();
      const albumName = trail?.name
        ? t("themes.randos.trail_album_name", { name: trail.name })
        : defaultAlbumName(t, locale);
      const album = buildAlbumRecord({
        name: albumName,
        createdAt,
        coverPhoto: null,
        discoveryIds: [],
        theme: "randos",
      });
      if (trail?.id) {
        album.suggestedTrailId = trail.id;
        album.suggestedTrailName = trail.name;
      }
      const updated = [album, ...loadAlbums()];
      saveAlbums(updated);
      setAlbums(updated);
      setRandoTrack([]);
      setShowRandoMap(false);
      setActiveRandoAlbumId(album.id);
      setReturnScreen("randos");
      setScreen("camera");
    },
    [t, locale]
  );

  const analyze = useCallback(async (base64, imgSrc) => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const headers = await buildScanQuotaHeaders();
      const [res, photoStored] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: base64,
            ...(homeScanCategory ? { category: homeScanCategory } : {}),
          }),
        }),
        compressDataUrl(imgSrc),
      ]);

      const { data, parseError } = await parseApiResponse(res);
      if (parseError || !data) {
        setErrorMsg(t("error.analyze"));
        setScreen("error");
        return;
      }
      if (res.status === 402) {
        if (data.scanQuota) {
          syncScanQuotaFromServer(data.scanQuota);
          setScanCount(data.scanQuota.count);
        }
        setScreen("subscription");
        return;
      }
      if (!res.ok || data.erreur) {
        setErrorMsg(data.erreur || t("error.analyze"));
        setScreen("error");
        return;
      }

      if (data.scanQuota) {
        syncScanQuotaFromServer(data.scanQuota);
        setScanCount(data.scanQuota.count);
      }

      const now = new Date().toISOString();
      let discovery;
      let updated;

      if (rescanDiscoveryId) {
        const prev = loadDiscoveries().find((d) => d.id === rescanDiscoveryId);
        if (prev) {
          discovery = applyCareToDiscovery(
            {
            ...prev,
            photo: photoStored,
            nom: data.nom,
            nom_latin: data.nom_latin || prev.nom_latin || "",
            famille: data.famille || prev.famille || "",
            type: data.type || prev.type || "plante",
            description: data.description || prev.description || "",
            identification_note: data.identification_note || prev.identification_note || "",
            age_approximatif: data.age_approximatif || prev.age_approximatif || "",
            habitat: data.habitat || prev.habitat || "",
            rarete: data.rarete || prev.rarete || "commun",
            etat_sante: data.etat_sante || "",
            health: inferHealthFromEtatSante(data.etat_sante) || prev.health,
            mauvaise_herbe: data.mauvaise_herbe ?? prev.mauvaise_herbe ?? null,
            mauvaise_herbe_nuisible:
              data.mauvaise_herbe_nuisible || prev.mauvaise_herbe_nuisible || "",
            mauvaise_herbe_solution:
              data.mauvaise_herbe_solution || prev.mauvaise_herbe_solution || "",
            mauvaise_herbe_astuces:
              data.mauvaise_herbe_astuces || prev.mauvaise_herbe_astuces || "",
            mauvaise_herbe_prevention:
              data.mauvaise_herbe_prevention || prev.mauvaise_herbe_prevention || "",
            soins_traitement: data.soins_traitement || prev.soins_traitement || "",
            guide_entretien: data.guide_entretien || prev.guide_entretien || "",
            conseils_expert: data.conseils_expert || prev.conseils_expert || "",
            histoire: data.histoire || prev.histoire || "",
            date_construction: data.date_construction || prev.date_construction || "",
            style_architectural:
              data.style_architectural || prev.style_architectural || "",
            anecdotes: data.anecdotes || prev.anecdotes || "",
            fun_fact: data.fun_fact || prev.fun_fact || "",
            dangerosite: data.dangerosite || prev.dangerosite || "",
            infos_utiles: data.infos_utiles || prev.infos_utiles || "",
            comportement: data.comportement || prev.comportement || "",
            alimentation: data.alimentation || prev.alimentation || "",
            espece_protegee: data.espece_protegee ?? prev.espece_protegee ?? null,
            region_saison: data.region_saison || prev.region_saison || "",
            },
            CARE_SCAN,
            now
          );
          updated = loadDiscoveries().map((d) => (d.id === rescanDiscoveryId ? discovery : d));
        }
      }

      if (!discovery) {
        discovery = {
          id: generateId(),
          photo: photoStored,
          nom: data.nom,
          nom_latin: data.nom_latin || "",
          famille: data.famille || "",
          type: data.type || "plante",
          description: data.description || "",
          identification_note: data.identification_note || "",
          age_approximatif: data.age_approximatif || "",
          habitat: data.habitat || "",
          rarete: data.rarete || "commun",
          etat_sante: data.etat_sante || "",
          health: inferHealthFromEtatSante(data.etat_sante),
          mauvaise_herbe: data.mauvaise_herbe ?? null,
          mauvaise_herbe_nuisible: data.mauvaise_herbe_nuisible || "",
          mauvaise_herbe_solution: data.mauvaise_herbe_solution || "",
          mauvaise_herbe_astuces: data.mauvaise_herbe_astuces || "",
          mauvaise_herbe_prevention: data.mauvaise_herbe_prevention || "",
          soins_traitement: data.soins_traitement || "",
          guide_entretien: data.guide_entretien || "",
          conseils_expert: data.conseils_expert || "",
          histoire: data.histoire || "",
          date_construction: data.date_construction || "",
          style_architectural: data.style_architectural || "",
          anecdotes: data.anecdotes || "",
          fun_fact: data.fun_fact || "",
          dangerosite: data.dangerosite || "",
          infos_utiles: data.infos_utiles || "",
          comportement: data.comportement || "",
          alimentation: data.alimentation || "",
          espece_protegee: data.espece_protegee ?? null,
          region_saison: data.region_saison || "",
          discoveredAt: now,
          plantedAt: now,
          lastScannedAt: now,
        };
        updated = [discovery, ...loadDiscoveries()];
      }
      const saveResult = persistDiscoveries(updated, discovery);
      if (!saveResult.ok) {
        console.warn("[Wilder] Sauvegarde localStorage échouée:", saveResult.error);
        if (saveResult.error === "QuotaExceededError") {
          setErrorMsg(t("error.quota_exceeded"));
        } else {
          setErrorMsg(t("error.analyze"));
        }
        setScreen("error");
        return;
      }
      setCurrentDiscovery(discovery);
      setResult(data);
      const wasRescan = Boolean(rescanDiscoveryId);
      finishDiscoveryFlow(updated, wasRescan);
    } catch (e) {
      console.error("[Wilder] analyze:", e);
      setErrorMsg(t("error.generic"));
      setScreen("error");
    }
  }, [t, finishDiscoveryFlow, lang, rescanDiscoveryId, homeScanCategory]);

  const analyzeAnimal = useCallback(
    async (mode, base64, imgSrc, { durationSec } = {}) => {
      setCaptured(imgSrc);
      setScreen("analyzing");
      const context = getAnimalContext();
      try {
        const headers = await buildScanQuotaHeaders();
        const [res, photoStored] = await Promise.all([
          fetch("/api/analyze-animal", {
            method: "POST",
            headers,
            body: JSON.stringify({
              image: base64,
              mode,
              lang,
              durationSec,
              season: context.season,
            }),
          }),
          compressDataUrl(imgSrc),
        ]);

        const { data, parseError } = await parseApiResponse(res);
        if (parseError || !data) {
          setErrorMsg(t("error.analyze"));
          setScreen("error");
          return;
        }
        if (res.status === 402) {
          if (data.scanQuota) {
            syncScanQuotaFromServer(data.scanQuota);
            setScanCount(data.scanQuota.count);
          }
          setScreen("subscription");
          return;
        }
        if (!res.ok || data.erreur) {
          setErrorMsg(data.erreur || t("error.analyze"));
          setScreen("error");
          return;
        }

        if (data.scanQuota) {
          syncScanQuotaFromServer(data.scanQuota);
          setScanCount(data.scanQuota.count);
        }

        const now = new Date().toISOString();
        const animalFields = buildAnimalDiscoveryFields(data);
        let discovery;
        let updated;

        if (rescanDiscoveryId) {
          const prev = loadDiscoveries().find((d) => d.id === rescanDiscoveryId);
          if (prev) {
            discovery = {
              ...prev,
              photo: photoStored,
              nom: data.nom,
              nom_latin: data.nom_latin || prev.nom_latin || "",
              famille: data.famille || prev.famille || "",
              type: data.type || prev.type || "animal",
              description: data.description || prev.description || "",
              identification_note: data.identification_note || prev.identification_note || "",
              habitat: data.habitat || prev.habitat || "",
              rarete: data.rarete || prev.rarete || "commun",
              anecdotes: data.anecdotes || prev.anecdotes || "",
              fun_fact: data.fun_fact || prev.fun_fact || "",
              dangerosite: data.dangerosite || prev.dangerosite || "",
              infos_utiles: data.infos_utiles || prev.infos_utiles || "",
              comportement: data.comportement || prev.comportement || "",
              alimentation: data.alimentation || prev.alimentation || "",
              espece_protegee: data.espece_protegee ?? prev.espece_protegee ?? null,
              region_saison: data.region_saison || prev.region_saison || "",
              ...animalFields,
            };
            updated = loadDiscoveries().map((d) => (d.id === rescanDiscoveryId ? discovery : d));
          }
        }

        if (!discovery) {
          discovery = {
            id: generateId(),
            photo: photoStored,
            nom: data.nom,
            nom_latin: data.nom_latin || "",
            famille: data.famille || "",
            type: data.type || "animal",
            description: data.description || "",
            identification_note: data.identification_note || "",
            habitat: data.habitat || "",
            rarete: data.rarete || "commun",
            anecdotes: data.anecdotes || "",
            fun_fact: data.fun_fact || "",
            dangerosite: data.dangerosite || "",
            infos_utiles: data.infos_utiles || "",
            comportement: data.comportement || "",
            alimentation: data.alimentation || "",
            espece_protegee: data.espece_protegee ?? null,
            region_saison: data.region_saison || "",
            ...animalFields,
            discoveredAt: now,
            plantedAt: now,
            lastScannedAt: now,
          };
          updated = [discovery, ...loadDiscoveries()];
        }

        const saveResult = persistDiscoveries(updated, discovery);
        if (!saveResult.ok) {
          console.warn("[Wilder] Sauvegarde localStorage échouée:", saveResult.error);
          setErrorMsg(
            saveResult.error === "QuotaExceededError"
              ? t("error.quota_exceeded")
              : t("error.analyze")
          );
          setScreen("error");
          return;
        }

        setCurrentDiscovery(discovery);
        setResult(data);
        recordDuoDiscovery(discovery.id);
        const wasRescan = Boolean(rescanDiscoveryId);
        finishDiscoveryFlow(updated, wasRescan);
      } catch (e) {
        console.error("[Wilder] analyzeAnimal:", e);
        setErrorMsg(t("error.generic"));
        setScreen("error");
      }
    },
    [t, finishDiscoveryFlow, lang, rescanDiscoveryId]
  );

  const analyzeDailyCare = useCallback(
    async (base64, imgSrc) => {
      setCaptured(imgSrc);
      setScreen("analyzing");
      try {
        const [res, photoStored] = await Promise.all([
          fetch("/api/potager-daily-care", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, lang }),
          }),
          compressDataUrl(imgSrc),
        ]);

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

        const session = buildDailyCareSession({
          photo: photoStored,
          plantes: data.plantes,
        });
        saveDailyCare(session);
        setDailyCareSession(session);
        setScanMode("single");
        setScreen("potager-daily-care");
        playDiscoverySound();
      } catch (e) {
        console.error("[Wilder] analyzeDailyCare:", e);
        setErrorMsg(t("error.generic"));
        setScreen("error");
      }
    },
    [lang, t]
  );

  const handleCapturedImage = useCallback(
    (dataUrl) => {
      const base64 = dataUrl.split(",")[1];
      if (scanMode === "daily-care") {
        analyzeDailyCare(base64, dataUrl);
        return;
      }
      if (scanMode === "animal" || scanMode === "traces" || scanMode === "sound") {
        analyzeAnimal(scanMode, base64, dataUrl);
        return;
      }
      analyze(base64, dataUrl);
    },
    [analyze, analyzeAnimal, analyzeDailyCare, scanMode]
  );

  const takePhoto = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const cssZoom = hardwareZoomRef.current.supported ? 1 : Math.max(1, camZoom);
    const dataUrl = captureViewfinderFrame(v, viewfinderRef.current, cssZoom);
    if (dataUrl) handleCapturedImage(dataUrl);
  }, [handleCapturedImage, camZoom]);

  const onPinchStart = useCallback((e) => {
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchRef.current = { dist: Math.hypot(dx, dy), zoom: camZoom };
  }, [camZoom]);

  const onPinchMove = useCallback((e) => {
    if (e.touches.length !== 2 || pinchRef.current.dist <= 0) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / pinchRef.current.dist;
    setCamZoom(Math.min(4, Math.max(1, pinchRef.current.zoom * ratio)));
  }, []);

  const onPinchEnd = useCallback(() => {
    pinchRef.current = { dist: 0, zoom: camZoom };
  }, [camZoom]);

  const fromGallery = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => handleCapturedImage(e.target.result);
      reader.readAsDataURL(file);
    },
    [handleCapturedImage]
  );

  const scanAgainFromResult = useCallback(async () => {
    if (organizeReturnTimerRef.current) {
      clearTimeout(organizeReturnTimerRef.current);
      organizeReturnTimerRef.current = null;
    }

    try {
      const quota = await refreshScanQuota();
      syncScanQuotaFromServer(quota);
      setScanCount(quota.count);
      if (gateGuestScanBeforeCamera()) return;
      if (!canScan()) {
        setOrganizeSaveToast(null);
        setScreen("subscription");
        return;
      }

      setOrganizeSaveToast(null);
      setSavedToAlbum(false);
      setShowAlbumPicker(false);
      setAlbumPickerStartTheme(null);
      setOrganizeSaved({});
      setShowFirstDiscoveryBadge(false);
      setScreen("camera");
      setResult(null);
      setCaptured(null);
    } catch (err) {
      console.error("[Wilder] scanAgainFromResult:", err);
      setShowFirstDiscoveryBadge(false);
      setScreen("camera");
      setResult(null);
      setCaptured(null);
    }
  }, [gateGuestScanBeforeCamera]);

  const confirmOrganizeSave = useCallback(
    (destination) => {
      if (organizeReturnTimerRef.current) {
        clearTimeout(organizeReturnTimerRef.current);
      }
      setOrganizeSaveToast(t("discovery.saved_toast", { destination }));
      organizeReturnTimerRef.current = setTimeout(() => {
        organizeReturnTimerRef.current = null;
        scanAgainFromResult();
      }, 2000);
    },
    [t, scanAgainFromResult]
  );

  const addToAlbum = (albumId, { confirmReturn = false, skipGuestGate = false } = {}) => {
    if (!currentDiscovery) return;
    if (!skipGuestGate && isGuest) {
      openFeatureGateModal(() => addToAlbum(albumId, { confirmReturn, skipGuestGate: true }));
      return;
    }
    const allAlbums = loadAlbums();
    const idx = allAlbums.findIndex((a) => a.id === albumId);
    if (idx === -1) return;

    const album = allAlbums[idx];
    const ids = Array.isArray(album.discoveryIds) ? album.discoveryIds : [];
    if (!ids.includes(currentDiscovery.id)) {
      album.discoveryIds = [currentDiscovery.id, ...ids];
      if (!album.coverPhoto) album.coverPhoto = currentDiscovery.photo;
      if (!Array.isArray(album.photos)) album.photos = [];
      if (currentDiscovery.photo && !album.photos.includes(currentDiscovery.photo)) {
        album.photos = [currentDiscovery.photo, ...album.photos];
      }
      allAlbums[idx] = album;
      saveAlbums(allAlbums);
      setAlbums(allAlbums);
    }
    setShowAlbumPicker(false);
    setAlbumPickerStartTheme(null);
    setSavedToAlbum(true);
    if (album?.theme) {
      setOrganizeSaved((prev) => ({ ...prev, [album.theme]: true }));
    }
    if (confirmReturn) {
      const destination =
        album?.name ||
        (album?.theme ? t(`themes.${album.theme}.title`) : t("discovery.add_album"));
      confirmOrganizeSave(destination);
    }
  };

  const shareDiscoveryPayload = useMemo(() => {
    if (!currentDiscovery) return null;
    const resolvedPhoto =
      captured || getDiscoveryPhotoUrl(currentDiscovery) || currentDiscovery.photo;
    return {
      ...currentDiscovery,
      photo: resolvedPhoto,
      nom: result?.nom || currentDiscovery.nom,
      nom_latin: result?.nom_latin || currentDiscovery.nom_latin,
      description: result?.description || currentDiscovery.description || "",
      type: result?.type || currentDiscovery.type,
      rarete: result?.rarete || currentDiscovery.rarete,
    };
  }, [currentDiscovery, result, captured]);

  const getOrganizeHint = useCallback(() => {
    if (organizeSaved.potager || returnScreen === "potager") return t("discovery.saved_potager");
    if (organizeSaved.jardin || returnScreen === "jardin") return t("discovery.saved_jardin");
    if (organizeSaved.juniors || returnScreen === "juniors") return t("discovery.saved_juniors");
    if (organizeSaved.randos || activeRandoAlbumId) return t("discovery.saved_randos");
    if (savedToAlbum) return t("discovery.added_album");
    return null;
  }, [organizeSaved, returnScreen, activeRandoAlbumId, savedToAlbum, t]);

  const handleOrganizeDestination = useCallback(
    (themeId, { skipGuestGate = false } = {}) => {
      if (!currentDiscovery || !result) return;
      if (!skipGuestGate && isGuest) {
        openFeatureGateModal(() => handleOrganizeDestination(themeId, { skipGuestGate: true }));
        return;
      }
      if (themeId === "potager") {
        upsertPotagerPlantFromDiscovery(currentDiscovery, result);
        recordPotagerWatering();
        setOrganizeSaved((prev) => ({ ...prev, potager: true }));
        confirmOrganizeSave(t("themes.potager.title"));
        return;
      }
      if (themeId === "randos" && activeRandoAlbumId) {
        addToAlbum(activeRandoAlbumId, { confirmReturn: true });
        return;
      }
      setAlbumPickerStartTheme(themeId);
      setShowAlbumPicker(true);
    },
    [currentDiscovery, result, activeRandoAlbumId, confirmOrganizeSave, t, isGuest, openFeatureGateModal]
  );

  useEffect(() => {
    if (screen !== "result") guestAutoSavePromptedRef.current = false;
  }, [screen]);

  useEffect(
    () => () => {
      if (organizeReturnTimerRef.current) {
        clearTimeout(organizeReturnTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (screen !== "result" || !activeRandoAlbumId || !currentDiscovery || savedToAlbum) return;
    if (isGuest) {
      if (!guestAutoSavePromptedRef.current) {
        guestAutoSavePromptedRef.current = true;
        openFeatureGateModal(() => addToAlbum(activeRandoAlbumId, { skipGuestGate: true }));
      }
      return;
    }
    addToAlbum(activeRandoAlbumId, { skipGuestGate: true });
  }, [
    screen,
    activeRandoAlbumId,
    currentDiscovery?.id,
    savedToAlbum,
    isGuest,
    openFeatureGateModal,
  ]);

  useEffect(() => {
    if (screen !== "result" || !scanTargetAlbumId || !currentDiscovery || savedToAlbum) return;
    if (isGuest) {
      if (!guestAutoSavePromptedRef.current) {
        guestAutoSavePromptedRef.current = true;
        openFeatureGateModal(() => {
          addToAlbum(scanTargetAlbumId, { skipGuestGate: true });
          setScanTargetAlbumId(null);
        });
      }
      return;
    }
    addToAlbum(scanTargetAlbumId, { skipGuestGate: true });
    setScanTargetAlbumId(null);
  }, [
    screen,
    scanTargetAlbumId,
    currentDiscovery?.id,
    savedToAlbum,
    isGuest,
    openFeatureGateModal,
  ]);

  useEffect(() => {
    if (screen !== "result" || returnScreen !== "potager" || !currentDiscovery || !result) return;
    if (isGuest) {
      if (!guestAutoSavePromptedRef.current) {
        guestAutoSavePromptedRef.current = true;
        openFeatureGateModal(() => {
          upsertPotagerPlantFromDiscovery(currentDiscovery, result);
          recordPotagerWatering();
          setOrganizeSaved((prev) => ({ ...prev, potager: true }));
        });
      }
      return;
    }
    upsertPotagerPlantFromDiscovery(currentDiscovery, result);
    recordPotagerWatering();
    setOrganizeSaved((prev) => ({ ...prev, potager: true }));
  }, [
    screen,
    returnScreen,
    currentDiscovery,
    result,
    isGuest,
    openFeatureGateModal,
  ]);

  const createAlbum = async (name, theme = DEFAULT_ALBUM_THEME, { skipGuestGate = false } = {}) => {
    if (!currentDiscovery) return;
    if (!skipGuestGate && isGuest) {
      openFeatureGateModal(() => createAlbum(name, theme, { skipGuestGate: true }));
      return;
    }
    const albumName = name.trim() || defaultAlbumName(t, locale);
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name: albumName,
      createdAt,
      coverPhoto: currentDiscovery.photo,
      discoveryIds: [currentDiscovery.id],
      location: null,
      theme,
    });
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setShowAlbumPicker(false);
    setAlbumPickerStartTheme(null);
    setSavedToAlbum(true);
    setOrganizeSaved((prev) => ({ ...prev, [theme]: true }));
    confirmOrganizeSave(albumName);
  };

  const createAlbumFromList = async (themeId, options = {}) => {
    const name = (options.name || newAlbumName).trim() || defaultAlbumName(t, locale);
    const createdAt = new Date().toISOString();
    const album = buildAlbumRecord({
      name,
      createdAt,
      coverPhoto: null,
      discoveryIds: [],
      location: null,
      theme: themeId,
      spaceKind: options.spaceKind || null,
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
      location: null,
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
    return loadDiscoveries()
      .filter((d) => ids.has(d.id))
      .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const stats = computeStats(discoveries);
  const slogan = t("slogan");
  const pageTitle = `Wilder — ${slogan}`;
  const marquee = t("marquee");

  const openDiscoveryDetail = useCallback((d, from) => {
    const discovery = typeof d === "string" ? discoveries.find((x) => x.id === d) : d;
    if (!discovery) return;
    setShowDetailDeleteConfirm(false);
    setViewingDiscovery(discovery);
    setReturnScreen(from);
    setScreen("discovery-detail");
  }, [discoveries]);

  const openDailyPickDetail = useCallback((species) => {
    const view = buildDailySpeciesViewModel(species);
    if (!view) return;
    setDailyPickView(view);
    setReturnScreen("home");
    setScreen("daily-pick-detail");
  }, []);

  const closeDailyPickDetail = useCallback(() => {
    setDailyPickView(null);
    setScreen("home");
  }, []);

  const swipeDeleteLabels = useMemo(
    () => ({
      deleteLabel: t("discovery.delete_btn"),
      confirmMessage: t("home.delete_find_confirm"),
      cancelLabel: t("albums.cancel"),
      confirmLabel: t("discovery.delete_action"),
    }),
    [t]
  );

  const swipeAlbumDeleteLabels = useMemo(
    () => ({
      deleteLabel: t("albums.delete_btn"),
      confirmMessage: t("albums.delete_confirm"),
      cancelLabel: t("albums.cancel"),
      confirmLabel: t("albums.delete_action"),
    }),
    [t]
  );

  const defaultAlbumNameLabel = useMemo(() => defaultAlbumName(t, locale), [t, locale]);

  const handleDeleteAlbum = useCallback(
    (albumId) => {
      const updated = removeAlbumById(albumId, albums);
      saveAlbums(updated);
      setAlbums(updated);
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
        setScreen(isThemeScreen(returnScreen) ? returnScreen : "home");
      }
      if (activeRandoAlbumId === albumId) {
        setActiveRandoAlbumId(null);
        setRandoTrack([]);
      }
      if (randoJournalAlbumId === albumId) {
        setRandoJournalAlbumId(null);
      }
    },
    [albums, selectedAlbumId, returnScreen, activeRandoAlbumId, randoJournalAlbumId]
  );

  const handleDeleteDiscovery = useCallback(
    (discoveryId) => {
      const result = removeDiscoveryById(discoveryId, discoveries, albums);
      if (!result) return;
      saveDiscoveries(result.discoveries);
      saveAlbums(result.albums);
      setDiscoveries(result.discoveries);
      setAlbums(result.albums);
      setShowDetailDeleteConfirm(false);
      if (viewingDiscovery?.id === discoveryId) {
        setViewingDiscovery(null);
        const back =
          returnScreen === "album-detail" ? "album-detail" : returnScreen || "home";
        setScreen(back);
      }
      if (currentDiscovery?.id === discoveryId) {
        setCurrentDiscovery(null);
        if (screen === "result") {
          setResult(null);
          setCaptured(null);
          setScreen(returnScreen || "home");
        }
      }
      if (jardinPlantDiscovery?.id === discoveryId) {
        setJardinPlantDiscovery(null);
        if (screen === "jardin-plant") {
          setScreen(isThemeScreen(returnScreen) ? returnScreen : "jardin");
        }
      }
      if (animalDiscovery?.id === discoveryId) {
        setAnimalDiscovery(null);
        if (screen === "animal-detail") {
          setScreen(isThemeScreen(returnScreen) ? returnScreen : "juniors");
        }
      }
      deleteDiscoveryFromCloud(discoveryId).catch((err) => {
        console.error("[Wilder] deleteDiscoveryFromCloud:", err);
      });
    },
    [discoveries, albums, viewingDiscovery, currentDiscovery, jardinPlantDiscovery, animalDiscovery, screen, returnScreen]
  );

  const handleDeletePotagerPlant = useCallback(
    (plantId) => {
      const plant = removePotagerPlantById(plantId);
      if (!plant) return;
      if (plant.discoveryId) {
        handleDeleteDiscovery(plant.discoveryId);
      }
    },
    [handleDeleteDiscovery]
  );

  const handleDeleteCurrentDiscovery = useCallback(() => {
    if (!currentDiscovery?.id) return;
    handleDeleteDiscovery(currentDiscovery.id);
  }, [currentDiscovery?.id, handleDeleteDiscovery]);

  const confettiOverlay = (
    <>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
      {newBadge && showConfetti && (
        <BadgeUnlockToast
          badge={newBadge}
          t={t}
          onClose={() => setNewBadge(null)}
          onViewTrophies={() => {
            setNewBadge(null);
            setShowConfetti(false);
            setScreen("trophies");
          }}
        />
      )}
      {organizeSaveToast ? <OrganizeSavedToast message={organizeSaveToast} /> : null}
      <FeatureGateModal
        open={featureGateOpen}
        t={t}
        onClose={closeFeatureGateModal}
        onAccountCreated={handleSignupAccountCreated}
      />
      <SignupPromptModal
        open={signupModalOpen}
        variant="limit"
        t={t}
        onClose={closeSignupModal}
        onAccountCreated={handleSignupAccountCreated}
      />
    </>
  );

  if (authBootState === "loading") {
    return (
      <>
        <Head>
          <title>Wilder</title>
          <meta name="description" content={slogan} />
        </Head>
        <div className="app-boot-loading" role="status" aria-live="polite" aria-label={t("auth.loading")}>
          <img src="/logowilder.png" alt="" className="app-boot-loading-logo" />
        </div>
      </>
    );
  }

  if (needsWelcomeSlides) {
    return (
      <>
        <Head>
          <title>Wilder</title>
          <meta name="description" content={slogan} />
        </Head>
        <WelcomeSlidesScreen onComplete={handleWelcomeComplete} />
      </>
    );
  }

  if (needsEntryChoice) {
    return (
      <>
        <Head>
          <title>Wilder</title>
          <meta name="description" content={slogan} />
        </Head>
        <EntryChoiceScreen
          t={t}
          onComplete={finishEntryFlow}
          onDiscoverGuest={finishEntryFlow}
        />
      </>
    );
  }

  if (needsOnboarding) {
    return (
      <>
        <Head>
          <title>Wilder</title>
          <meta name="description" content={slogan} />
        </Head>
        <OnboardingScreen
          t={t}
          onComplete={() => {
            setNeedsOnboarding(false);
            setReturnScreen("home");
            setScreen("home");
          }}
        />
      </>
    );
  }

  /* ── SUBSCRIPTION ── */
  if (screen === "subscription") {
    return (
      <>
        <Head>
          <title>{t("freemium.title")} — Wilder</title>
        </Head>
        <SubscriptionScreen
          t={t}
          scanCount={scanCount}
          forced={shouldShowPaywall()}
          initialStep={subscriptionEntry.initialStep}
          defaultPlan={subscriptionEntry.defaultPlan}
          resumeCheckoutPlan={subscriptionEntry.resumeCheckoutPlan}
          onClose={
            shouldShowPaywall() && !isPremium()
              ? undefined
              : () => setScreen(returnScreen || "home")
          }
        />
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
        <WilderHomeScreen
          t={t}
          discoveries={discoveries}
          selectedCategory={homeScanCategory}
          onCategoryChange={setHomeScanCategory}
          onStartScan={() => startScan("home")}
          onOpenInstallGuide={openInstallGuideModal}
          onSubscribe={openSubscriptionFromHome}
          showSubscribe={!isPremium()}
          onSignOut={async () => {
            await signOutCloud();
            setPremiumUserEmail(null);
            await refreshGuestAccount();
          }}
          onViewAll={() => {
            if (isGuest) {
              openFeatureGateModal(() => {
                setReturnScreen("home");
                setScreen("biodex");
              });
              return;
            }
            setReturnScreen("home");
            setScreen("biodex");
          }}
          isLoggedIn={!isGuest}
          accountUserEmail={premiumUserEmail || ""}
          onAccountCreated={handleSignupAccountCreated}
          onOpenDiscovery={(d) => openDiscoveryDetail(d, "home")}
          onOpenDailyPick={openDailyPickDetail}
          onDeleteDiscovery={handleDeleteDiscovery}
          deleteLabels={swipeDeleteLabels}
        />
        {freemiumAdBanner}
        {confettiOverlay}
      </>
    );
  }

  /* ── DAILY PICK (read-only, no persistence) ── */
  if (screen === "daily-pick-detail" && dailyPickView) {
    const d = dailyPickView;
    const data =
      buildDailySpeciesAnalysisData(d) || {
        nom: d.nom,
        nom_latin: d.nom_latin,
        type: d.type,
        rarete: d.rarete,
        ...discoveryToAnalysisData(d),
      };

    return (
      <>
        <Head>
          <title>{d.nom} — Wilder</title>
        </Head>
        <div className="discovery-screen discovery-screen--detail screen-enter-fast">
          <div className="discovery-hero">
            <DailySpeciesHero
              species={{ emoji: d.emoji }}
              illustration={d.illustration || d.photo}
              nom={d.nom}
              emoji={d.emoji}
            />
            <button type="button" className="discovery-hero-back" onClick={closeDailyPickDetail}>
              <IconBack size={16} /> {t("discovery.back")}
            </button>
          </div>

          <div className="discovery-body discovery-body--detail">
            <DiscoveryBody
              data={data}
              discovery={d}
              showNewBadge={false}
              showInlineShare={false}
              t={t}
              lang={lang}
            />

            <DiscoveryResultActions
              discovery={d}
              t={t}
              lang={lang}
              onScanAgain={() => {
                closeDailyPickDetail();
                startScan("home");
              }}
            />
          </div>
        </div>
      </>
    );
  }

  /* ── SCANNER ── */
  if (screen === "camera") {
    const inRando = Boolean(activeRandoAlbumId);

    if (inRando && showRandoMap) {
      return (
        <>
          <Head><title>{t("themes.randos.track_title")} — Wilder</title></Head>
          <div className="rando-map-screen screen-enter-fast">
            <RandoMap
              track={randoTrack}
              discoveries={randoDiscoveries}
              live
              theme={theme}
              className="rando-map-container--fullscreen"
            />
            <div className="rando-map-overlay">
              <RandoNatureAlerts
                position={randoCurrentPosition}
                active={Boolean(activeRandoAlbumId)}
                t={t}
                className="rando-nature-alerts--map"
              />
              <div className="rando-map-top">
                <button
                  type="button"
                  className="scanner-back"
                  onClick={() => setShowRandoMap(false)}
                  aria-label={t("themes.randos.hide_map")}
                >
                  <IconBack size={20} color="white" />
                </button>
                <div className="rando-map-status">
                  <span className="randos-active-pulse" aria-hidden="true" />
                  <span>{t("themes.randos.active")}</span>
                  {activeRandoDistance != null && (
                    <span className="rando-map-distance">
                      {activeRandoDistance < 1
                        ? t("themes.randos.distance_m", {
                            m: Math.max(1, Math.round(activeRandoDistance * 1000)),
                          })
                        : t("themes.randos.distance_km", { km: activeRandoDistance })}
                    </span>
                  )}
                </div>
              </div>
              <div className="rando-map-bottom">
                <button type="button" className="rando-map-camera-btn" onClick={() => setShowRandoMap(false)}>
                  📷 {t("themes.randos.hide_map")}
                </button>
                <button type="button" className="rando-map-end-btn" onClick={endRando}>
                  {t("themes.randos.end")}
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Head><title>{t("scanner.button")} — Wilder</title></Head>
        <div
          className="scanner-screen screen-enter-fast"
          onTouchStart={onPinchStart}
          onTouchMove={onPinchMove}
          onTouchEnd={onPinchEnd}
          onTouchCancel={onPinchEnd}
        >
          <div
            ref={videoWrapRef}
            className="scanner-video-wrap"
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
          </div>

          <div className="scanner-overlay">
            <RandoNatureAlerts
              position={randoCurrentPosition}
              active={inRando}
              t={t}
              className="rando-nature-alerts--scanner"
            />
            <div className="scanner-top">
              <button type="button" className="scanner-back" onClick={leaveScanner} aria-label={t("scanner.back")}>
                <IconBack size={20} color="white" />
              </button>
              {inRando && (
                <div className="scanner-rando-badge">
                  <span className="randos-active-pulse" aria-hidden="true" />
                  {t("themes.randos.active")}
                  {activeRandoDistance != null && (
                    <span className="scanner-rando-distance">
                      ·{" "}
                      {activeRandoDistance < 1
                        ? t("themes.randos.distance_m", {
                            m: Math.max(1, Math.round(activeRandoDistance * 1000)),
                          })
                        : t("themes.randos.distance_km", { km: activeRandoDistance })}
                    </span>
                  )}
                </div>
              )}
              {inRando && (
                <button
                  type="button"
                  className="scanner-map-btn"
                  onClick={() => setShowRandoMap(true)}
                  aria-label={t("themes.randos.show_map")}
                >
                  🗺️
                </button>
              )}
            </div>

            <div className="scanner-center">
              {camReady && (
                <Viewfinder
                  viewfinderRef={viewfinderRef}
                  label={
                    scanMode === "daily-care"
                      ? t("themes.potager.daily_care_frame_hint")
                      : scanMode === "traces"
                        ? t("themes.juniors.traces_frame_hint")
                        : scanMode === "animal"
                          ? t("themes.juniors.animal_frame_hint")
                          : t("scanner.frame_hint")
                  }
                />
              )}
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

            {discoveries.length === 0 && camReady && (
              <p className="scanner-gallery-hint">{t("first_discovery.gallery_hint")}</p>
            )}

            <div className="scanner-bottom">
              {inRando && (
                <button type="button" className="scanner-end-rando-btn" onClick={endRando}>
                  {t("themes.randos.end")}
                </button>
              )}
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
                  aria-label={t("scanner.button")}
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
    const dailyCareSteps =
      scanMode === "daily-care"
        ? [
            t("themes.potager.daily_care_analyze_0"),
            t("themes.potager.daily_care_analyze_1"),
            t("themes.potager.daily_care_analyze_2"),
          ]
        : null;
    const animalSteps =
      scanMode === "animal"
        ? [
            t("themes.juniors.analyze_animal_0"),
            t("themes.juniors.analyze_animal_1"),
            t("themes.juniors.analyze_animal_2"),
          ]
        : scanMode === "traces"
          ? [
              t("themes.juniors.analyze_traces_0"),
              t("themes.juniors.analyze_traces_1"),
              t("themes.juniors.analyze_traces_2"),
            ]
          : scanMode === "sound"
            ? [
                t("themes.juniors.analyze_sound_0"),
                t("themes.juniors.analyze_sound_1"),
                t("themes.juniors.analyze_sound_2"),
              ]
            : null;
    return (
      <>
        <Head><title>Analyse… — Wilder</title></Head>
        <AnalyzeLoadingScreen captured={captured} t={t} customSteps={animalSteps || dailyCareSteps} />
      </>
    );
  }

  /* ── POTAGER DAILY CARE ── */
  if (screen === "potager-daily-care" && dailyCareSession) {
    return (
      <>
        <Head>
          <title>
            {t("themes.potager.daily_care_title")} — {t("themes.potager.title")}
          </title>
        </Head>
        <div className="potager-scan-screen screen-enter-fast">
          <PotagerDailyCareResult
            session={dailyCareSession}
            t={t}
            lang={lang}
            journalRefreshKey={careJournalRefreshKey}
            onBack={() => {
              clearScanSession();
              setScreen("potager");
            }}
            onToggleTask={(taskId) => {
              const updated = toggleDailyCareTask(taskId);
              if (updated) {
                setDailyCareSession(updated);
                setCareJournalRefreshKey((k) => k + 1);
              }
            }}
            onNewPhoto={() => {
              clearScanSession();
              startDailyCareScan();
            }}
          />
        </div>
      </>
    );
  }

  /* ── ERROR ── */
  if (screen === "error") {
    return (
      <>
        <Head><title>{t("error.title")} — Wilder</title></Head>
        <div className="error-screen screen-enter">
          <div className="error-screen-emoji" aria-hidden="true">🌿</div>
          <h2 className="error-screen-title">{t("error.title")}</h2>
          <p className="error-screen-msg">{errorMsg}</p>
          <button type="button" className="btn-primary" onClick={() => setScreen("camera")}>
            {t("error.retry")}
          </button>
        </div>
      </>
    );
  }

  /* ── ANIMAL SOUND RECORDER ── */
  if (screen === "animal-sound") {
    return (
      <>
        <Head>
          <title>{t("themes.juniors.sound_title")} — Wilder</title>
        </Head>
        <AnimalAudioRecorder
          t={t}
          onBack={() => setScreen(returnScreen === "album-detail" ? "album-detail" : "juniors")}
          onSubmit={({ base64, spectrogram, durationSec }) => {
            setScanMode("sound");
            analyzeAnimal("sound", base64, spectrogram, { durationSec });
          }}
        />
      </>
    );
  }

  /* ── JARDIN PLANT DETAIL ── */
  if (screen === "jardin-plant" && jardinPlantDiscovery) {
    const plantResult = discoveryToScanResult(jardinPlantDiscovery);
    return (
      <>
        <Head>
          <title>
            {jardinPlantDiscovery.nom} — {t("themes.jardin.title")}
          </title>
        </Head>
        <div className="jardin-scan-screen screen-enter-fast">
          <JardinScanResult
            result={plantResult}
            photo={jardinPlantDiscovery.photo}
            t={t}
            saved={false}
            onBack={() => {
              setJardinPlantDiscovery(null);
              setScreen(returnScreen === "album-detail" ? "album-detail" : "jardin");
            }}
          />
        </div>
      </>
    );
  }

  /* ── ANIMAL DETAIL ── */
  if (screen === "animal-detail" && animalDiscovery) {
    const animalResult = discoveryToAnimalResult(animalDiscovery);
    return (
      <>
        <Head>
          <title>
            {animalDiscovery.nom} — {t("themes.juniors.title")}
          </title>
        </Head>
        <div className="animaux-scan-screen screen-enter-fast">
          <AnimalScanResult
            result={animalResult}
            photo={animalDiscovery.photo}
            t={t}
            saved={false}
            onBack={() => {
              setAnimalDiscovery(null);
              setScreen(returnScreen === "album-detail" ? "album-detail" : "juniors");
            }}
          />
        </div>
      </>
    );
  }

  /* ── RESULT ── */
  if (screen === "result" && result) {
    const inRando = Boolean(activeRandoAlbumId);
    const inPotager = returnScreen === "potager" && !inRando;
    const inJardin = returnScreen === "jardin" && !inRando;
    const inJuniors = returnScreen === "juniors" && !inRando;

    const resultAlbumPicker = showAlbumPicker ? (
      <ThemeAlbumPickerModal
        albums={albums}
        onSelect={(albumId) => addToAlbum(albumId, { confirmReturn: true })}
        onCreate={createAlbum}
        onClose={() => {
          setShowAlbumPicker(false);
          setAlbumPickerStartTheme(null);
        }}
        startTheme={albumPickerStartTheme}
        t={t}
        locale={locale}
      />
    ) : null;

    const guestShareGate = isGuest ? gateGuestShare : undefined;

    if (inPotager) {
      return (
        <>
          <Head>
            <title>{result.nom} — {t("themes.potager.title")}</title>
          </Head>
          <div className="potager-scan-screen screen-enter-fast">
            <PotagerScanResult
              result={result}
              photo={captured}
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              organizeHint={getOrganizeHint()}
              onOrganizeDestination={handleOrganizeDestination}
              onScanAgain={scanAgainFromResult}
              onBack={leaveResult}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
              onBeforeShare={guestShareGate}
            />
          </div>
          <ScanQuotaNotice t={t} scanCount={scanCount} />
          {freemiumAdBanner}
          {resultAlbumPicker}
          {confettiOverlay}
        </>
      );
    }

    if (inJardin) {
      return (
        <>
          <Head>
            <title>
              {result.nom} — {t("themes.jardin.title")}
            </title>
          </Head>
          <div className="jardin-scan-screen screen-enter-fast">
            <JardinScanResult
              result={result}
              photo={captured}
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              organizeHint={getOrganizeHint()}
              onOrganizeDestination={handleOrganizeDestination}
              onScanAgain={scanAgainFromResult}
              onBack={leaveResult}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
              onBeforeShare={guestShareGate}
            />
          </div>
          <ScanQuotaNotice t={t} scanCount={scanCount} />
          {freemiumAdBanner}
          {resultAlbumPicker}
          {confettiOverlay}
        </>
      );
    }

    if (inJuniors) {
      return (
        <>
          <Head>
            <title>
              {result.nom} — {t("themes.juniors.title")}
            </title>
          </Head>
          <div className="animaux-scan-screen screen-enter-fast">
            <AnimalScanResult
              result={result}
              photo={captured}
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              organizeHint={getOrganizeHint()}
              onOrganizeDestination={handleOrganizeDestination}
              onScanAgain={scanAgainFromResult}
              onBack={leaveResult}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
              onBeforeShare={guestShareGate}
            />
          </div>
          <ScanQuotaNotice t={t} scanCount={scanCount} />
          {freemiumAdBanner}
          {resultAlbumPicker}
          {confettiOverlay}
        </>
      );
    }

    if (inRando) {
      return (
        <>
          <Head>
            <title>
              {result.nom} — {t("themes.randos.title")}
            </title>
          </Head>
          <div className="rando-scan-screen screen-enter-fast">
            <RandoScanResult
              result={result}
              photo={captured}
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              organizeHint={getOrganizeHint()}
              onOrganizeDestination={handleOrganizeDestination}
              onScanAgain={scanAgainFromResult}
              scanAgainLabel={t("themes.randos.scan_again")}
              onBack={resumeRando}
              onEndRando={endRando}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
              onBeforeShare={guestShareGate}
            />
          </div>
          <ScanQuotaNotice t={t} scanCount={scanCount} />
          {freemiumAdBanner}
          {resultAlbumPicker}
          {confettiOverlay}
        </>
      );
    }

    return (
      <>
        <Head>
          <title>{result.nom} — Wilder</title>
        </Head>
        <div className="discovery-screen screen-enter-fast">
          {biodexAnim && (
            <>
              <div className="biodex-flash" />
              <div className="biodex-ring" />
            </>
          )}

          <div className="discovery-hero">
            {captured && <img src={captured} alt={result.nom} />}
            <button
              type="button"
              className="discovery-hero-back"
              onClick={inRando ? resumeRando : leaveResult}
            >
              <IconBack size={16} /> {t("discovery.back")}
            </button>
          </div>

          <div className="discovery-body">
            <DiscoveryBody
              data={result}
              discovery={currentDiscovery}
              showNewBadge={!showFirstDiscoveryBadge}
              showFirstDiscoveryBadge={showFirstDiscoveryBadge}
              showInlineShare={false}
              t={t}
              lang={lang}
            />

            <ScanQuotaNotice t={t} scanCount={scanCount} />

            {isGuest && <SignupPromptBanner t={t} onCreateAccount={openSignupFromBanner} />}

            {freemiumAdBanner}

            <DiscoveryResultActions
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              onBeforeShare={isGuest ? gateGuestShare : undefined}
              onScanAgain={inRando ? resumeRando : scanAgainFromResult}
              scanAgainLabel={inRando ? t("themes.randos.scan_again") : undefined}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
            />

            {inRando && (
              <button
                type="button"
                className="discovery-result-end-rando btn-secondary"
                onClick={endRando}
              >
                {t("themes.randos.end")}
              </button>
            )}
          </div>

          {resultAlbumPicker}
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

    const isJardinAlbum = albumTheme === "jardin";
    const isRandosAlbum = albumTheme === "randos";
    const hasRandoTrack =
      isRandosAlbum &&
      ((selectedAlbum.gpsTrack?.length > 0) ||
        items.some((d) => d.latitude != null && d.longitude != null));

    return (
      <>
        <Head>
          <title>{selectedAlbum.name} — Wilder</title>
        </Head>
        <div
          className={`albums-screen screen-enter-fast${isJuniorsAlbum ? " theme-screen--juniors" : ""}${isJardinAlbum ? " theme-screen--jardin" : ""}${isRandosAlbum ? " theme-screen--randos" : ""}`}
        >
          {hasRandoTrack && (
            <div className="rando-detail-map-wrap">
              <h2 className="rando-detail-map-title">{t("themes.randos.track_title")}</h2>
              <RandoMap
                track={selectedAlbum.gpsTrack || []}
                discoveries={items}
                live={false}
                theme={theme}
                className="rando-map-container--detail"
              />
            </div>
          )}
          {isRandosAlbum && (
            <div className="rando-journal-open-wrap">
              <button
                type="button"
                className="btn-primary rando-journal-open-btn"
                onClick={() => setRandoJournalAlbumId(selectedAlbum.id)}
              >
                📓 {t("themes.randos.journal_open")}
              </button>
            </div>
          )}
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
              aria-label={t("discovery.back")}
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

          {!isJardinAlbum &&
            (creatingSubAlbum ? (
              <div className="sub-album-create" style={{ padding: "0 1.25rem" }}>
                <input
                  className="modal-input"
                  placeholder={t("themes.new_sub_album")}
                  value={newSubAlbumName}
                  onChange={(e) => setNewSubAlbumName(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCreatingSubAlbum(false)}
                  >
                    {t("albums.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => createSubAlbum(selectedAlbum)}
                  >
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
            ))}

          {isJardinAlbum ? (
            <div className="jardin-detail-wrap">
              {items.length > 0 && (() => {
                const score = computeEspaceVertScore(selectedAlbum, discoveries);
                const tier = getScoreTier(score);
                return (
                  <div className={`jardin-score-banner jardin-score-banner--${tier}`}>
                    <span className="jardin-score-label">{t("themes.jardin.score_label")}</span>
                    <span className="jardin-score-value">
                      {t("themes.jardin.score_out_of", { score })}
                    </span>
                    <span className="jardin-score-tier">{t(`themes.jardin.score_tier_${tier}`)}</span>
                  </div>
                );
              })()}
              <button
                type="button"
                className="jardin-scan-cta"
                onClick={() => startScan("album-detail", { albumId: selectedAlbum.id })}
              >
                <span className="jardin-scan-cta-emoji" aria-hidden="true">
                  📸
                </span>
                <span className="jardin-scan-cta-label">{t("themes.jardin.scan_cta")}</span>
              </button>
              <EspaceVertPlantList
                plants={items}
                t={t}
                onOpenDiscovery={(d) => {
                  setJardinPlantDiscovery(d);
                  setReturnScreen("album-detail");
                  setScreen("jardin-plant");
                }}
                onDeleteDiscovery={handleDeleteDiscovery}
                swipeLabels={swipeDeleteLabels}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="albums-empty">
              <p>{t("albums.empty_album")}</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => startScan("album-detail")}
              >
                {t("albums.scan")}
              </button>
            </div>
          ) : isJuniorsAlbum ? (
            <div className="animaux-list animaux-list--album">
              {items.map((d) => (
                <SwipeToDelete
                  key={d.id}
                  onDelete={() => handleDeleteDiscovery(d.id)}
                  {...swipeDeleteLabels}
                >
                  <button
                    type="button"
                    className="animaux-row"
                    onClick={() => {
                      setAnimalDiscovery(d);
                      setReturnScreen("album-detail");
                      setScreen("animal-detail");
                    }}
                  >
                    <div className="animaux-row-photo-wrap">
                      {d.photo ? (
                        <img src={d.photo} alt="" className="animaux-row-photo" />
                      ) : (
                        <span
                          className="animaux-row-photo animaux-row-photo--empty"
                          aria-hidden="true"
                        >
                          🦊
                        </span>
                      )}
                    </div>
                    <div className="animaux-row-info">
                      <span className="animaux-row-name">{d.nom}</span>
                      {d.habitat && (
                        <span className="animaux-row-habitat">{d.habitat}</span>
                      )}
                    </div>
                  </button>
                </SwipeToDelete>
              ))}
            </div>
          ) : (
            <div className="discovery-grid">
              {items.map((d) => (
                <SwipeToDelete
                  key={d.id}
                  onDelete={() => handleDeleteDiscovery(d.id)}
                  {...swipeDeleteLabels}
                >
                  <button
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
                </SwipeToDelete>
              ))}
            </div>
          )}
        </div>
        {isRandosAlbum && randoJournalAlbumId === selectedAlbum.id && (
          <RandoJournal
            album={selectedAlbum}
            discoveries={discoveries}
            locale={locale}
            t={t}
            onClose={() => setRandoJournalAlbumId(null)}
            onDeleteDiscovery={handleDeleteDiscovery}
            swipeLabels={swipeDeleteLabels}
          />
        )}
      </>
    );
  }

  /* ── DISCOVERY DETAIL ── */
  if (screen === "discovery-detail" && viewingDiscovery) {
    const d = viewingDiscovery;
    const data = {
      nom: d.nom,
      nom_latin: d.nom_latin,
      type: d.type,
      rarete: d.rarete,
      ...discoveryToAnalysisData(d),
    };
    const isJuniorsView = returnScreen === "juniors";

    return (
      <>
        <Head>
          <title>{d.nom} — Wilder</title>
        </Head>
        <div
          className={`discovery-screen discovery-screen--detail screen-enter-fast${isJuniorsView ? " discovery-screen--juniors" : ""}`}
        >
          <div className="discovery-hero">
            <DiscoveryHeroPhoto discovery={d} nom={d.nom} fallbackEmoji="🌿" />
          </div>

          <div className="discovery-body discovery-body--detail">
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
              <AnimalScanResult
                result={discoveryToAnimalResult(d)}
                photo={null}
                discovery={d}
                t={t}
                lang={lang}
                saved={false}
                onBack={() => {
                  setViewingDiscovery(null);
                  setScreen(returnScreen === "album-detail" ? "album-detail" : returnScreen);
                }}
                onScanAgain={() => {
                  setRescanDiscoveryId(d.id);
                  startScan(returnScreen || "home");
                }}
                onDelete={() => handleDeleteDiscovery(d.id)}
                deleteLabels={swipeDeleteLabels}
              />
            ) : (
              <>
                <DiscoveryBody data={data} discovery={d} showNewBadge={false} showInlineShare={false} t={t} lang={lang}>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    {t("discovery.discovered_on")} {formatDate(d.discoveredAt, locale)}
                  </p>
                </DiscoveryBody>

                <DiscoveryResultActions
                  discovery={d}
                  t={t}
                  lang={lang}
                  onBeforeShare={isGuest ? gateGuestShare : undefined}
                  onScanAgain={() => {
                    setRescanDiscoveryId(d.id);
                    startScan(returnScreen || "home");
                  }}
                  onDelete={() => handleDeleteDiscovery(d.id)}
                  deleteLabels={swipeDeleteLabels}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ── STATS ── */
  if (screen === "stats") {
    const stats = computeStats(discoveries);
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
        <div className="stats-screen screen-enter with-bottom-nav">
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
              <div className="stat-card stat-card-highlight stat-card-heritage">
                <span className="stat-card-num">{stats.patrimoineCount}</span>
                <span className="stat-card-label">{t("stats.patrimoine")}</span>
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
                onClick={() => startScan("home")}
              >
                {t("home.discover")}
              </button>
            </div>
          )}
          <div className="stats-actions">
            <button type="button" className="btn-secondary" onClick={() => setScreen("trophies")}>
              🏆 {t("home.trophies")}
            </button>
          </div>
        </div>
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
        <div className="trophies-screen screen-enter with-bottom-nav">
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
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
              onClick={() => setScreen("stats")}
              aria-label={t("home.stats")}
            >
              📊
            </button>
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

  /* ── WRAPPED ── */
  if (screen === "wrapped") {
    const wrappedYear = getWrappedYear();
    return (
      <>
        <Head>
          <title>{t("wrapped.title", { year: wrappedYear })} — Wilder</title>
        </Head>
        <div className="wrapped-screen screen-enter with-bottom-nav">
          <div className="albums-header">
            <button type="button" className="btn-secondary" style={{ padding: "0.5rem 0.75rem" }} onClick={goHome} aria-label={t("discovery.back")}>
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">{t("wrapped.title", { year: wrappedYear })}</h1>
          </div>
          <WilderWrapped discoveries={discoveries} albums={albums} t={t} year={wrappedYear} />
        </div>
      </>
    );
  }

  /* ── BIODEX ── */
  if (screen === "biodex") {
    return (
      <>
        <Head>
          <title>{t("biodex.title")} — Wilder</title>
        </Head>
        <div className="biodex-screen screen-enter with-bottom-nav">
          <div className="albums-header">
            <button type="button" className="btn-secondary" style={{ padding: "0.5rem 0.75rem" }} onClick={goHome} aria-label={t("discovery.back")}>
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">{t("biodex.title")}</h1>
          </div>
          <p className="biodex-subtitle">{t("biodex.subtitle")}</p>
          <BiodexCollection
            discoveries={discoveries}
            t={t}
            locale={locale}
            onOpenDiscovery={(entry) => {
              const full = discoveries.find((d) => d.nom === entry.nom && d.type === entry.type);
              if (full) openDiscoveryDetail(full, "biodex");
            }}
          />
        </div>
      </>
    );
  }

  /* ── CLOUD ACCOUNT ── */
  if (screen === "account") {
    return (
      <>
        <Head>
          <title>{t("cloud.title")} — Wilder</title>
        </Head>
        <div className="account-screen screen-enter with-bottom-nav">
          <div className="albums-header">
            <button type="button" className="btn-secondary" style={{ padding: "0.5rem 0.75rem" }} onClick={goHome} aria-label={t("discovery.back")}>
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">{t("cloud.title")}</h1>
          </div>
          <CloudAccountCard
            t={t}
            onDiscoveriesSynced={(items) => setDiscoveries(items)}
          />
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
              <Logo size={96} />
              <h2>Wilder</h2>
              <p className="about-tagline">{t("slogan")}</p>
              <p className="about-version">{t("about.version")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.vision_title")}</h3>
              <p>{t("about.vision")}</p>
              <p>{t("about.vision_highlight")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.how_title")}</h3>
              <p>{t("about.how")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.audience_title")}</h3>
              <p>{t("about.audience_1")}</p>
              <p>{t("about.audience_2")}</p>
              <p>{t("about.audience_3")}</p>
              <p>{t("about.audience_4")}</p>
              <p>{t("about.audience_5")}</p>
            </div>
            <div className="about-section">
              <h3>{t("about.mission_title")}</h3>
              <p>{t("about.mission")}</p>
            </div>
            <div className="about-section about-lang-section">
              <h3>{t("settings.language")}</h3>
              <p className="about-lang-hint">{t("settings.language_hint")}</p>
              <div className="about-lang-grid">
                {SUPPORTED_LANGS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`about-lang-btn${lang === code ? " active" : ""}`}
                    onClick={() => setLang(code)}
                  >
                    {LANG_LABELS[code] || code}
                  </button>
                ))}
              </div>
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
        creatingAlbum={creatingAlbum}
        setCreatingAlbum={setCreatingAlbum}
        newAlbumName={newAlbumName}
        setNewAlbumName={setNewAlbumName}
        setAlbums={setAlbums}
        setSelectedAlbumId={setSelectedAlbumId}
        setReturnScreen={setReturnScreen}
        setScreen={setScreen}
        openDiscoveryDetail={openDiscoveryDetail}
        createAlbumFromList={createAlbumFromList}
        t={t}
        lang={lang}
        locale={locale}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartScan={(animalMode) =>
          startScan(screen, typeof animalMode === "string" ? { animalMode } : {})
        }
        onDeleteAlbum={handleDeleteAlbum}
        swipeLabels={swipeAlbumDeleteLabels}
        defaultAlbumNameLabel={defaultAlbumNameLabel}
      />
    );
  }

  return null;
}
