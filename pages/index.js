import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import {
  createT,
  detectLang,
  getLocale,
  getRarityLabel,
  getTypeLabel,
} from "@/lib/i18n";
import AnalyzeLoadingScreen from "@/components/AnalyzeLoadingScreen";
import { shareDiscovery } from "@/lib/share";
import { buildScanQuotaHeaders } from "@/lib/scanQuotaClient";
import { isPermanentAuthUser } from "@/lib/authUser";
import {
  bootstrapCloudSync,
  flushPendingSync,
  getCloudSession,
  signOutCloud,
  subscribeToAuthSession,
} from "@/lib/cloudSync";
import { logPersistenceBootState } from "@/lib/persistenceBootLog";
import FeatureGateModal from "@/components/FeatureGateModal";
import { useGuestAccount } from "@/hooks/useGuestAccount";
import PaletteListScreen from "@/components/PaletteListScreen";
import PaletteDetailScreen from "@/components/PaletteDetailScreen";
import MonJardinScreen from "@/components/MonJardinScreen";
import MesScansScreen from "@/components/MesScansScreen";
import ResultatScanScreen from "@/components/ResultatScanScreen";
import CataloguePepiniereScreen from "@/components/CataloguePepiniereScreen";
import IdeesJardinsScreen from "@/components/IdeesJardinsScreen";
import ApercuBriefScreen from "@/components/ApercuBriefScreen";
import WilderMainLayout from "@/components/WilderMainLayout";
import { openInstallGuideModal } from "@/components/InstallGuideModalHost";
import {
  scheduleInstallGuideAfterFirstScan,
  tryConsumeInstallGuideAutoShow,
} from "@/lib/installGuide";
import { CARE_SCAN, applyCareToDiscovery } from "@/lib/discoveryCare";
import { inferHealthFromEtatSante } from "@/lib/discoveryHealth";
import {
  acquireCameraStream,
  isCameraGranted,
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
import { getDiscoveryPhotoUrl } from "@/lib/discoveryPhoto";
import { resolveScanBackScreen } from "@/lib/themes";

const THEME_KEY = "wilder-theme";
const MAIN_SCREENS = new Set(["home", "mes-scans", "catalogue", "brief", "idees-jardins"]);

function resolveMainNav(screen, homeTab) {
  if (screen === "home") return homeTab;
  if (screen === "brief") return "brief";
  if (screen === "mes-scans") return "mes-scans";
  if (screen === "catalogue" || screen === "idees-jardins") return "catalogue";
  return "accueil";
}

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

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
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

function Viewfinder({ viewfinderRef, label }) {
  return (
    <div className="viewfinder-stack">
      <p className="viewfinder-label">{label}</p>
      <div ref={viewfinderRef} className="viewfinder-wilder" aria-hidden="true" />
    </div>
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
  const [camError, setCamError] = useState("");
  const [camLoading, setCamLoading] = useState(false);
  const [camZoom, setCamZoom] = useState(1);
  const [authBootState, setAuthBootState] = useState("loading");
  const [returnScreen, setReturnScreen] = useState("home");
  const [activePaletteId, setActivePaletteId] = useState(null);
  const [lang] = useState(() => detectLang());
  const [rescanDiscoveryId, setRescanDiscoveryId] = useState(null);
  const [homeScanCategory, setHomeScanCategory] = useState(null);
  const [premiumUserEmail, setPremiumUserEmail] = useState(null);
  const [homeGardenRefreshTick, setHomeGardenRefreshTick] = useState(0);
  const [homeTab, setHomeTab] = useState("accueil");
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

  const openMesScans = useCallback(() => {
    setReturnScreen("home");
    setScreen("mes-scans");
  }, []);

  const goHomeAccueil = useCallback(() => {
    setReturnScreen("home");
    setHomeTab("accueil");
    setScreen("home");
  }, []);

  const goHomeJardin = useCallback(() => {
    setReturnScreen("home");
    setHomeTab("jardin");
    setScreen("home");
  }, []);

  const openCatalogue = useCallback(() => {
    setReturnScreen("home");
    setScreen("catalogue");
  }, []);

  const openIdeesJardins = useCallback(() => {
    setReturnScreen("home");
    setScreen("idees-jardins");
  }, []);

  const openBrief = useCallback(() => {
    setReturnScreen("home");
    setScreen("brief");
  }, []);

  const openPaletteDetail = useCallback((palette) => {
    if (!palette?.id) return;
    setActivePaletteId(palette.id);
    setScreen("ma-palette-detail");
  }, []);

  const handleSignupAccountCreated = useCallback(async () => {
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
    if (screen === "home") {
      setHomeGardenRefreshTick((tick) => tick + 1);
    }
  }, [screen]);

  useEffect(() => {
    applyTheme(loadTheme());
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
      setDiscoveries(updated);
      setRescanDiscoveryId(null);

      const guestFirstScan = isGuest && !wasRescan && !guestFirstScanRef.current;
      if (isGuest && !wasRescan) guestFirstScanRef.current = true;

      const isFirstEver = guestFirstScan || (!isGuest && !wasRescan && updated.length === 1);
      if (isFirstEver) {
        scheduleInstallGuideAfterFirstScan();
      }

      setScreen("result");
    },
    [isGuest]
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

  useEffect(() => {
    const unsubscribe = subscribeToAuthSession(
      (session) => {
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
  }, []);

  useEffect(() => {
    if (authBootState !== "ready") return;
    if (tryConsumeInstallGuideAutoShow()) {
      openInstallGuideModal();
    }
  }, [screen, authBootState]);

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
    if (authBootState !== "ready") return;

    let cancelled = false;

    (async () => {
      const session = await getCloudSession();
      if (cancelled) return;

      const permanent = isPermanentAuthUser(session?.user);

      const items = loadDiscoveries();

      if (!permanent) {
        setDiscoveries(items);
        setAlbums(loadAlbums());
        logPersistenceBootState(session, items.length);
        return;
      }

      setDiscoveries(items);
      setAlbums(loadAlbums());

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

    return () => {
      cancelled = true;
    };
  }, [authBootState]);

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

  const clearScanSession = useCallback(() => {
    setResult(null);
    setCaptured(null);
    setCurrentDiscovery(null);
    setRescanDiscoveryId(null);
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
            favori: prev.favori ?? false,
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
          favori: false,
        };
        updated = [discovery, ...loadDiscoveries()];
      }
      const saveResult = persistDiscoveries(updated, discovery, { isPermanent: !isGuest });
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

  const handleUpdateCurrentDiscovery = useCallback(
    (updated) => {
      if (!updated?.id) return { ok: false, error: "missing_id" };
      const list = loadDiscoveries().map((d) => (d.id === updated.id ? updated : d));
      const saveResult = persistDiscoveries(list, updated, { isPermanent: !isGuest });
      if (!saveResult.ok) return { ok: false, error: saveResult.error };
      setDiscoveries(list);
      setCurrentDiscovery(updated);
      return { ok: true };
    },
    [isGuest]
  );

  const handleShareFromResult = useCallback(async () => {
    if (!shareDiscoveryPayload) return;
    if (isGuest && gateGuestShare()) return;
    await shareDiscovery(shareDiscoveryPayload, t, typeLabel, rarityLabel, "feed");
  }, [shareDiscoveryPayload, isGuest, gateGuestShare, t, typeLabel, rarityLabel]);

  const slogan = t("slogan");
  const pageTitle = `Wilder — ${slogan}`;

  const featureGateOverlay = (
    <FeatureGateModal
      open={featureGateOpen}
      t={t}
      messageKey={featureGateMessageKey}
      onClose={closeFeatureGateModal}
      onAccountCreated={handleSignupAccountCreated}
    />
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

  /* ── ÉCRANS PRINCIPAUX (barre fixe) ── */
  if (MAIN_SCREENS.has(screen)) {
    let pageTitleContent = pageTitle;
    let mainContent = null;

    if (screen === "home") {
      pageTitleContent = pageTitle;
      mainContent = (
        <MonJardinScreen
          t={t}
          isLoggedIn={!isGuest}
          accountUserEmail={premiumUserEmail || ""}
          onSignOut={async () => {
            await signOutCloud();
            setPremiumUserEmail(null);
            setDiscoveries([]);
            setAlbums([]);
            await refreshGuestAccount();
          }}
          onAccountCreated={handleSignupAccountCreated}
          onNavigatePalette={openMaPalette}
          onNavigateMesScans={openMesScans}
          onNavigateCatalogue={openCatalogue}
          onNavigateIdeesJardins={openIdeesJardins}
          onScan={() => startScan("home")}
          onOpenBrief={openBrief}
          gardenRefreshTick={homeGardenRefreshTick}
          homeTab={homeTab}
        />
      );
    } else if (screen === "mes-scans") {
      pageTitleContent = "Mes scans — Wilder";
      mainContent = (
        <MesScansScreen
          t={t}
          discoveries={discoveries}
          canAddToGarden={!isGuest}
          onScan={() => startScan("mes-scans")}
        />
      );
    } else if (screen === "catalogue") {
      pageTitleContent = `${t("catalogue.title")} — Wilder`;
      mainContent = (
        <CataloguePepiniereScreen
          t={t}
          canAddToGarden={!isGuest}
          onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
        />
      );
    } else if (screen === "idees-jardins") {
      pageTitleContent = `${t("idees_jardins.title")} — Wilder`;
      mainContent = (
        <IdeesJardinsScreen
          t={t}
          canAddToGarden={!isGuest}
          onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
        />
      );
    } else if (screen === "brief") {
      pageTitleContent = `${t("brief.title")} — Wilder`;
      mainContent = <ApercuBriefScreen t={t} />;
    }

    return (
      <>
        <Head>
          <title>{pageTitleContent}</title>
          {screen === "home" && <meta name="description" content={slogan} />}
        </Head>
        <WilderMainLayout
          className="screen-enter-fast"
          activeNav={resolveMainNav(screen, homeTab)}
          onNavAccueil={goHomeAccueil}
          onNavJardin={goHomeJardin}
          onNavBrief={openBrief}
          onNavScans={openMesScans}
          onNavCatalogue={openCatalogue}
        >
          {mainContent}
        </WilderMainLayout>
        {screen === "home" && featureGateOverlay}
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
  if (screen === "result" && result && currentDiscovery) {
    const resultPhoto =
      captured || getDiscoveryPhotoUrl(currentDiscovery) || currentDiscovery.photo;

    return (
      <>
        <Head>
          <title>{currentDiscovery.nom} — Wilder</title>
        </Head>
        <ResultatScanScreen
          t={t}
          discovery={currentDiscovery}
          photoSrc={resultPhoto}
          canAddToGarden={!isGuest}
          onBack={leaveResult}
          onScanAgain={scanAgainFromResult}
          onShare={handleShareFromResult}
          onDiscoveryUpdate={handleUpdateCurrentDiscovery}
          onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
        />
        {featureGateOverlay}
      </>
    );
  }

  return null;
}
