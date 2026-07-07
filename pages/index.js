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
import { buildScanQuotaHeaders } from "@/lib/scanQuotaClient";
import {
  logOnboardingBootState,
  markOnboardingVu,
  shouldShowWelcomeSlides,
} from "@/lib/welcomeSlides";
import {
  markEntryChoiceDone,
  shouldShowEntryChoice,
} from "@/lib/entryChoice";
import { isPermanentAuthUser } from "@/lib/authUser";
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
import SignupPromptBanner from "@/components/SignupPromptBanner";
import FeatureGateModal from "@/components/FeatureGateModal";
import { useGuestAccount } from "@/hooks/useGuestAccount";
import WilderWrapped from "@/components/WilderWrapped";
import BiodexCollection from "@/components/BiodexCollection";
import CloudAccountCard from "@/components/CloudAccountCard";
import WilderHomeScreen from "@/components/WilderHomeScreen";
import PaletteListScreen from "@/components/PaletteListScreen";
import PaletteDetailScreen from "@/components/PaletteDetailScreen";
import MonJardinScreen from "@/components/MonJardinScreen";
import { buildDailySpeciesViewModel, buildDailySpeciesAnalysisData } from "@/lib/dailySpecies";
import { DailySpeciesHero, DiscoveryHeroPhoto } from "@/components/DiscoveryPhotoThumb";
import { openInstallGuideModal } from "@/components/InstallGuideModalHost";
import Logo from "@/components/Logo";
import { getWrappedYear } from "@/lib/wrapped";
import { recordNatureActivity } from "@/lib/natureStreak";
import {
  scheduleInstallGuideAfterFirstScan,
  tryConsumeInstallGuideAutoShow,
} from "@/lib/installGuide";
import { CARE_SCAN, applyCareToDiscovery } from "@/lib/discoveryCare";
import { inferHealthFromEtatSante } from "@/lib/discoveryHealth";
import {
  acquireCameraStream,
  completeOnboarding,
  isCameraGranted,
  isOnboardingComplete,
} from "@/lib/permissions";
import { compressDataUrl } from "@/lib/compressImage";
import { captureViewfinderFrame } from "@/lib/cameraCapture";
import {
  loadAlbums,
  loadDiscoveries,
  saveAlbums,
  saveDiscoveries,
} from "@/lib/discoveriesStorage";
import { persistDiscoveries } from "@/lib/persistDiscovery";
import { removeDiscoveryById } from "@/lib/removeDiscovery";
import { getDiscoveryPhotoUrl } from "@/lib/discoveryPhoto";
import { resolveScanBackScreen } from "@/lib/themes";

const THEME_KEY = "wilder-theme";

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

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

function IconBack({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

function IconShare({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
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

export default function Wilder() {
  const [screen, setScreen] = useState("home");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [currentDiscovery, setCurrentDiscovery] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [biodexAnim, setBiodexAnim] = useState(true);
  const [camError, setCamError] = useState("");
  const [camLoading, setCamLoading] = useState(false);
  const [camZoom, setCamZoom] = useState(1);
  const [needsWelcomeSlides, setNeedsWelcomeSlides] = useState(false);
  const [needsEntryChoice, setNeedsEntryChoice] = useState(false);
  const [authBootState, setAuthBootState] = useState("loading");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [viewingDiscovery, setViewingDiscovery] = useState(null);
  const [dailyPickView, setDailyPickView] = useState(null);
  const [returnScreen, setReturnScreen] = useState("home");
  const [activePaletteId, setActivePaletteId] = useState(null);
  const [lang, setLangState] = useState(() => detectLang());
  const setLang = useCallback((code) => {
    if (!SUPPORTED_LANGS.includes(code)) return;
    saveLang(code);
    setLangState(code);
  }, []);
  const [theme, setTheme] = useState("light");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFirstDiscoveryBadge, setShowFirstDiscoveryBadge] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [rescanDiscoveryId, setRescanDiscoveryId] = useState(null);
  const [homeScanCategory, setHomeScanCategory] = useState(null);
  const [premiumUserEmail, setPremiumUserEmail] = useState(null);
  const [featureGateOpen, setFeatureGateOpen] = useState(false);
  const [featureGateMessageKey, setFeatureGateMessageKey] = useState("feature_gate.message");

  const { isGuest, refreshGuestAccount } = useGuestAccount();

  const pendingGuestActionRef = useRef(null);

  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef({ dist: 0, zoom: 1 });
  const hardwareZoomRef = useRef({ min: 1, max: 1, step: 0.1, supported: false });

  const openFeatureGateModal = useCallback((pendingAction, messageKey = "feature_gate.message") => {
    pendingGuestActionRef.current = pendingAction ?? null;
    setFeatureGateMessageKey(messageKey);
    setFeatureGateOpen(true);
  }, []);

  const closeFeatureGateModal = useCallback(() => {
    setFeatureGateOpen(false);
    setFeatureGateMessageKey("feature_gate.message");
    pendingGuestActionRef.current = null;
  }, []);

  const openMaPalette = useCallback(() => {
    if (isGuest) {
      openFeatureGateModal(
        () => {
          setReturnScreen("home");
          setScreen("ma-palette");
        },
        "feature_gate.saves_message"
      );
      return;
    }
    setReturnScreen("home");
    setScreen("ma-palette");
  }, [isGuest, openFeatureGateModal]);

  const openPaletteDetail = useCallback((palette) => {
    if (!palette?.id) return;
    setActivePaletteId(palette.id);
    setScreen("ma-palette-detail");
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
    setFeatureGateOpen(false);
    const fn = pendingGuestActionRef.current;
    pendingGuestActionRef.current = null;
    if (fn) fn();
  }, [refreshGuestAccount]);

  const openSignupFromBanner = useCallback(() => {
    openFeatureGateModal(null, "feature_gate.saves_message");
  }, [openFeatureGateModal]);

  const gateGuestShare = useCallback(() => {
    if (!isGuest) return false;
    openFeatureGateModal();
    return true;
  }, [isGuest, openFeatureGateModal]);

  const guestFirstScanRef = useRef(false);

  const t = useMemo(() => createT(lang), [lang]);
  const locale = useMemo(() => getLocale(lang), [lang]);
  const typeLabel = useCallback((type) => getTypeLabel(t, type), [t]);
  const rarityLabel = useCallback((r) => getRarityLabel(t, r), [t]);

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

  const finishDiscoveryFlow = useCallback(
    (updated, wasRescan) => {
      if (!isGuest) {
        setDiscoveries(updated);
      }
      recordNatureActivity();
      setRescanDiscoveryId(null);

      const guestFirstScan = isGuest && !wasRescan && !guestFirstScanRef.current;
      if (isGuest && !wasRescan) guestFirstScanRef.current = true;

      const isFirstEver = guestFirstScan || (!isGuest && !wasRescan && updated.length === 1);
      if (isFirstEver) {
        scheduleInstallGuideAfterFirstScan();
        if (!isGuest) {
          const seen = loadSeenBadges();
          const fresh = getNewBadgeIds(updated, seen);
          if (fresh.length > 0) saveSeenBadges([...seen, ...fresh]);
        }
        setShowFirstDiscoveryBadge(true);
        setScreen("result");
        setShowConfetti(true);
        playBadgeUnlockSound();
        return;
      }

      setScreen("result");
      if (!isGuest && checkNewBadges(updated)) {
        playBadgeUnlockSound();
      } else {
        playDiscoverySound();
      }
    },
    [checkNewBadges, isGuest]
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

    let cancelled = false;

    (async () => {
      const session = await getCloudSession();
      if (cancelled) return;

      const permanent = isPermanentAuthUser(session?.user);

      if (!permanent) {
        saveDiscoveries([]);
        saveAlbums([]);
        setDiscoveries([]);
        setAlbums([]);
        logPersistenceBootState(session, 0);
        return;
      }

      const items = loadDiscoveries();
      setDiscoveries(items);
      setAlbums(loadAlbums());
      const seen = loadSeenBadges();
      if (seen.length === 0 && items.length > 0) {
        saveSeenBadges(computeUnlockedBadgeIds(items));
      }

      bootstrapCloudSync().then(async (result) => {
        if (cancelled) return;
        const loaded = result.ok && result.discoveries ? result.discoveries : items;
        if (result.ok && result.discoveries) {
          setDiscoveries(result.discoveries);
        }
        const bootSession = await getCloudSession();
        logPersistenceBootState(bootSession, loaded.length);
      });
    })();

    const onFirstTouch = () => warmUpSounds();
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onFirstTouch);
    };
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

  const clearScanSession = useCallback(() => {
    setResult(null);
    setCaptured(null);
    setCurrentDiscovery(null);
    setRescanDiscoveryId(null);
    setShowFirstDiscoveryBadge(false);
  }, []);

  const startScan = useCallback((origin) => {
    setReturnScreen(origin);
    setRescanDiscoveryId(null);
    setScreen("camera");
  }, []);

  const leaveScanner = useCallback(() => {
    const back = resolveScanBackScreen(returnScreen);
    clearScanSession();
    setErrorMsg("");
    setScreen(back);
  }, [returnScreen, clearScanSession]);

  const goHome = () => {
    clearScanSession();
    setErrorMsg("");
    setScreen("home");
  };

  const leaveResult = useCallback(() => {
    const back = resolveScanBackScreen(returnScreen);
    clearScanSession();
    if (back === "home") {
      setErrorMsg("");
    }
    setScreen(back);
  }, [returnScreen, clearScanSession]);

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
      if (!res.ok || data.erreur) {
        setErrorMsg(data.erreur || t("error.analyze"));
        setScreen("error");
        return;
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
      const saveResult = persistDiscoveries(updated, discovery, { isPermanent: !isGuest });
      if (!isGuest && !saveResult.ok) {
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
  }, [t, finishDiscoveryFlow, rescanDiscoveryId, homeScanCategory, isGuest]);

  const handleCapturedImage = useCallback(
    (dataUrl) => {
      const base64 = dataUrl.split(",")[1];
      analyze(base64, dataUrl);
    },
    [analyze]
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

  const scanAgainFromResult = useCallback(() => {
    setShowFirstDiscoveryBadge(false);
    setResult(null);
    setCaptured(null);
    setScreen("camera");
  }, []);

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

  const slogan = t("slogan");
  const pageTitle = `Wilder — ${slogan}`;

  const openDiscoveryDetail = useCallback((d, from) => {
    const discovery = typeof d === "string" ? discoveries.find((x) => x.id === d) : d;
    if (!discovery) return;
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

  const handleDeleteDiscovery = useCallback(
    (discoveryId) => {
      const result = removeDiscoveryById(discoveryId, discoveries, albums);
      if (!result) return;
      saveDiscoveries(result.discoveries);
      saveAlbums(result.albums);
      setDiscoveries(result.discoveries);
      setAlbums(result.albums);
      if (viewingDiscovery?.id === discoveryId) {
        setViewingDiscovery(null);
        setScreen(returnScreen || "home");
      }
      if (currentDiscovery?.id === discoveryId) {
        setCurrentDiscovery(null);
        if (screen === "result") {
          setResult(null);
          setCaptured(null);
          setScreen(returnScreen || "home");
        }
      }
      deleteDiscoveryFromCloud(discoveryId).catch((err) => {
        console.error("[Wilder] deleteDiscoveryFromCloud:", err);
      });
    },
    [discoveries, albums, viewingDiscovery, currentDiscovery, screen, returnScreen]
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
      <FeatureGateModal
        open={featureGateOpen}
        t={t}
        messageKey={featureGateMessageKey}
        onClose={closeFeatureGateModal}
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
          onSignOut={async () => {
            await signOutCloud();
            setPremiumUserEmail(null);
            setDiscoveries([]);
            setAlbums([]);
            await refreshGuestAccount();
          }}
          onViewAll={() => {
            if (isGuest) {
              openFeatureGateModal(
                () => {
                  setReturnScreen("home");
                  setScreen("biodex");
                },
                "feature_gate.saves_message"
              );
              return;
            }
            setReturnScreen("home");
            setScreen("biodex");
          }}
          findsLocked={isGuest}
          onLockedFinds={() => openFeatureGateModal(null, "feature_gate.saves_message")}
          isLoggedIn={!isGuest}
          accountUserEmail={premiumUserEmail || ""}
          onAccountCreated={handleSignupAccountCreated}
          onOpenDiscovery={(d) => openDiscoveryDetail(d, "home")}
          onOpenDailyPick={openDailyPickDetail}
          onDeleteDiscovery={handleDeleteDiscovery}
          deleteLabels={swipeDeleteLabels}
          onNavigatePalette={openMaPalette}
          onNavigateMonJardinTest={() => {
            setReturnScreen("home");
            setScreen("mon-jardin");
          }}
        />
        {confettiOverlay}
      </>
    );
  }

  /* ── MON JARDIN (test — écran isolé, données d'exemple) ── */
  if (screen === "mon-jardin") {
    return (
      <>
        <Head>
          <title>Mon jardin — Wilder</title>
        </Head>
        <MonJardinScreen
          onBack={() => setScreen(returnScreen || "home")}
          onScan={() => startScan("mon-jardin")}
          onOpenBrief={() => {}}
        />
      </>
    );
  }

  /* ── MA PALETTE ── */
  if (screen === "ma-palette") {
    return (
      <>
        <Head>
          <title>{t("palette.title")} — Wilder</title>
        </Head>
        <PaletteListScreen
          t={t}
          locale={locale}
          backLabel={t("discovery.back")}
          onBack={() => setScreen(returnScreen || "home")}
          onOpenPalette={openPaletteDetail}
        />
      </>
    );
  }

  /* ── MA PALETTE DETAIL (zones) ── */
  if (screen === "ma-palette-detail" && activePaletteId) {
    return (
      <>
        <Head>
          <title>{t("palette.zone.title")} — Wilder</title>
        </Head>
        <PaletteDetailScreen
          t={t}
          paletteId={activePaletteId}
          backLabel={t("discovery.back")}
          onBack={() => setScreen("ma-palette")}
        />
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
            <div className="scanner-top">
              <button type="button" className="scanner-back" onClick={leaveScanner} aria-label={t("scanner.back")}>
                <IconBack size={20} color="white" />
              </button>
            </div>

            <div className="scanner-center">
              {camReady && (
                <Viewfinder
                  viewfinderRef={viewfinderRef}
                  label={t("scanner.frame_hint")}
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
    return (
      <>
        <Head><title>Analyse… — Wilder</title></Head>
        <AnalyzeLoadingScreen captured={captured} t={t} />
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

  /* ── RESULT ── */
  if (screen === "result" && result) {
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
              onClick={leaveResult}
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

            {isGuest && <SignupPromptBanner t={t} onCreateAccount={openSignupFromBanner} />}

            <DiscoveryResultActions
              discovery={shareDiscoveryPayload}
              t={t}
              lang={lang}
              onBeforeShare={isGuest ? gateGuestShare : undefined}
              onScanAgain={scanAgainFromResult}
              onDelete={handleDeleteCurrentDiscovery}
              deleteLabels={swipeDeleteLabels}
            />
          </div>

          {confettiOverlay}
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
            <DiscoveryHeroPhoto discovery={d} nom={d.nom} fallbackEmoji="🌿" />
          </div>

          <div className="discovery-body discovery-body--detail">
            <button
              type="button"
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem" }}
              onClick={() => {
                setViewingDiscovery(null);
                setScreen(returnScreen || "home");
              }}
            >
              <IconBack size={16} /> {t("discovery.back")}
            </button>

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

  return null;
}
