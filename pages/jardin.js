import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { createT, detectLang, getLocale } from "@/lib/i18n";
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
import AccountMenu from "@/components/AccountMenu";
import { useGuestAccount } from "@/hooks/useGuestAccount";
import PaletteListScreen from "@/components/PaletteListScreen";
import PaletteDetailScreen from "@/components/PaletteDetailScreen";
import MonJardinScreen from "@/components/MonJardinScreen";
import MesScansScreen from "@/components/MesScansScreen";
import CoupsDeCoeurScreen from "@/components/CoupsDeCoeurScreen";
import IdeesAccueilScreen from "@/components/IdeesAccueilScreen";
import PartnersBientotScreen from "@/components/PartnersBientotScreen";
import PartnersDemoScreen from "@/components/PartnersDemoScreen";
import AncienneTrouvailleDetailScreen from "@/components/AncienneTrouvailleDetailScreen";
import CatalogueHubScreen from "@/components/CatalogueHubScreen";
import CatalogueFamillesScreen from "@/components/CatalogueFamillesScreen";
import CataloguePlantFicheScreen from "@/components/CataloguePlantFicheScreen";
import CatalogueUniverseFicheScreen from "@/components/CatalogueUniverseFicheScreen";
import IdeesJardinsScreen from "@/components/IdeesJardinsScreen";
import DossierScreen from "@/components/DossierScreen";
import GardenAmbianceListScreen from "@/components/garden/GardenAmbianceListScreen";
import GardenAmbianceDetailScreen from "@/components/garden/GardenAmbianceDetailScreen";
import GardenTerrainScreen from "@/components/garden/GardenTerrainScreen";
import GardenBudgetScreen from "@/components/garden/GardenBudgetScreen";
import GardenMotScreen from "@/components/garden/GardenMotScreen";
import GardenDetailsStepScreen from "@/components/garden/GardenDetailsStepScreen";
import StepQuotidien, { isQuotidienValid } from "@/components/brief/StepQuotidien";
import StepAEviter, { isAEviterValid } from "@/components/brief/StepAEviter";
import StepEntretien, { isEntretienValid } from "@/components/brief/StepEntretien";
import GardenDossierConfirmScreen from "@/components/garden/GardenDossierConfirmScreen";
import GardenStylesWallScreen from "@/components/garden/GardenStylesWallScreen";
import GardenStyleDetailScreen from "@/components/garden/GardenStyleDetailScreen";
import {
  firstIncompleteStepId,
  loadDossierProgressSnapshot,
  nextIncompleteStepId,
  fetchGardenCoupsCount,
} from "@/lib/gardenDossierGuidance";
import { loadGardenIntention } from "@/lib/gardenIntention";
import WilderMainLayout from "@/components/WilderMainLayout";
import { openInstallGuideModal } from "@/components/InstallGuideModalHost";
import { tryConsumeInstallGuideAutoShow } from "@/lib/installGuide";
import { loadAlbums, loadDiscoveries } from "@/lib/discoveriesStorage";

const THEME_KEY = "wilder-theme";
const MAIN_SCREENS = new Set([
  "home",
  "coups-de-coeur",
  "catalogue",
  "brief",
  "partners",
  "partners-demo",
]);

function resolveMainNav(screen) {
  if (screen === "home") return "accueil";
  if (screen === "brief") return "dossier";
  if (screen === "coups-de-coeur" || screen === "mes-scans" || screen === "ancienne-trouvaille") {
    return "coups-de-coeur";
  }
  if (screen === "catalogue") return "idees";
  if (screen === "partners" || screen === "partners-demo") return "partenaires";
  return "accueil";
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

function getAccountInitials(email) {
  const trimmed = String(email || "").trim();
  if (!trimmed) return "";
  const local = trimmed.split("@")[0] || "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "W";
}

export default function Wilder() {
  const [screen, setScreen] = useState("home");
  const [archivedDiscovery, setArchivedDiscovery] = useState(null);
  const [discoveries, setDiscoveries] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [authBootState, setAuthBootState] = useState("loading");
  const [returnScreen, setReturnScreen] = useState("home");
  const [activePaletteId, setActivePaletteId] = useState(null);
  const [lang] = useState(() => detectLang());
  const [premiumUserEmail, setPremiumUserEmail] = useState(null);
  const [homeGardenRefreshTick, setHomeGardenRefreshTick] = useState(0);
  const [contactRefreshTick, setContactRefreshTick] = useState(0);
  const [profileOpenRequest, setProfileOpenRequest] = useState(null);
  const [homeTab, setHomeTab] = useState("accueil");
  const [catalogueView, setCatalogueView] = useState(null);
  const [catalogueFilters, setCatalogueFilters] = useState({});
  const [catalogueFamiliesUniverse, setCatalogueFamiliesUniverse] = useState(null);
  const [catalogueFiche, setCatalogueFiche] = useState(null);
  const [featureGateOpen, setFeatureGateOpen] = useState(false);
  const [featureGateMessageKey, setFeatureGateMessageKey] = useState("feature_gate.message");
  const [featureGateInitialStep, setFeatureGateInitialStep] = useState("prompt");
  const [gardenFlowReturn, setGardenFlowReturn] = useState("home");
  const [gardenAmbianceName, setGardenAmbianceName] = useState("");
  const [dossierConfirmProgress, setDossierConfirmProgress] = useState(null);
  const [lastValidatedStepId, setLastValidatedStepId] = useState(null);
  const [guidedCoupsBanner, setGuidedCoupsBanner] = useState(false);
  const [gardenStyleId, setGardenStyleId] = useState(null);

  const { isGuest, refreshGuestAccount } = useGuestAccount();

  const pendingGuestActionRef = useRef(null);

  const openFeatureGateModal = useCallback((pendingAction, messageKey = "feature_gate.message") => {
    pendingGuestActionRef.current = pendingAction ?? null;
    setFeatureGateMessageKey(messageKey);
    setFeatureGateInitialStep("prompt");
    setFeatureGateOpen(true);
  }, []);

  const openRequireAccount = useCallback((pendingAction, messageKey = "mes_scans.garden_gate") => {
    pendingGuestActionRef.current = pendingAction ?? null;
    setFeatureGateMessageKey(messageKey);
    setFeatureGateInitialStep("auth");
    setFeatureGateOpen(true);
  }, []);

  const closeFeatureGateModal = useCallback(() => {
    setFeatureGateOpen(false);
    setFeatureGateMessageKey("feature_gate.message");
    setFeatureGateInitialStep("prompt");
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

  const openCoupsDeCoeur = useCallback(() => {
    setReturnScreen("coups-de-coeur");
    setScreen("coups-de-coeur");
  }, []);

  const openMesScansHistory = useCallback(() => {
    setReturnScreen("coups-de-coeur");
    setScreen("mes-scans");
  }, []);

  const openCataloguePlantFiche = useCallback((plantId, returnTo = "catalogue") => {
    if (!plantId) return;
    setCatalogueFiche({ universe: "vegetal", id: plantId });
    setReturnScreen(returnTo);
    setScreen("catalogue-fiche");
  }, []);

  const openCatalogueItemFiche = useCallback((universe, itemId, returnTo = "catalogue") => {
    if (!itemId || !universe) return;
    setCatalogueFiche({ universe, id: itemId });
    setReturnScreen(returnTo);
    setScreen("catalogue-fiche");
  }, []);

  const leaveCatalogueFiche = useCallback(() => {
    setCatalogueFiche(null);
    setScreen(returnScreen || "catalogue");
  }, [returnScreen]);

  const openGardenItemDetail = useCallback(
    (discovery, returnTo = "coups-de-coeur") => {
      if (!discovery) return;
      if (discovery.catalogue_plant_id) {
        openCataloguePlantFiche(discovery.catalogue_plant_id, returnTo);
        return;
      }
      if (discovery.catalogue_mineral_id) {
        openCatalogueItemFiche("mineral", discovery.catalogue_mineral_id, returnTo);
        return;
      }
      if (discovery.catalogue_deco_id) {
        openCatalogueItemFiche("deco", discovery.catalogue_deco_id, returnTo);
        return;
      }
      if (discovery.catalogue_style_id) {
        setReturnScreen(returnTo);
        setGardenStyleId(discovery.catalogue_style_id);
        setCatalogueView("style-detail");
        setScreen("catalogue");
        return;
      }
      const latest =
        discovery.id != null
          ? loadDiscoveries().find((d) => d.id === discovery.id) || discovery
          : discovery;
      setArchivedDiscovery(latest);
      setReturnScreen(returnTo);
      setScreen("ancienne-trouvaille");
    },
    [openCataloguePlantFiche, openCatalogueItemFiche]
  );

  const openArchivedDiscovery = useCallback((discovery) => {
    openGardenItemDetail(discovery, "mes-scans");
  }, [openGardenItemDetail]);

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
    setReturnScreen("catalogue");
    setCatalogueView(null);
    setCatalogueFilters({});
    setCatalogueFamiliesUniverse(null);
    setScreen("catalogue");
  }, []);

  const openCatalogueFamilles = useCallback((tab) => {
    setReturnScreen("catalogue");
    setCatalogueFamiliesUniverse(tab);
    setCatalogueFilters({});
    setCatalogueView("familles");
    setScreen("catalogue");
  }, []);

  const openCatalogueTab = useCallback((tab, filters = {}) => {
    setReturnScreen("catalogue");
    setCatalogueFilters(filters);
    setCatalogueView(tab);
    setScreen("catalogue");
  }, []);

  const openCatalogueHubFromFamilles = useCallback(
    (tab, filters = {}) => {
      const famillesKey =
        tab === "bordures" || (tab === "deco" && filters.univers === "Bordures") ? "bordures" : tab;
      setCatalogueFamiliesUniverse(famillesKey);
      const viewTab = tab === "bordures" ? "deco" : tab;
      openCatalogueTab(viewTab, filters);
    },
    [openCatalogueTab]
  );

  const backFromCatalogueHub = useCallback(() => {
    if (catalogueFamiliesUniverse) {
      setCatalogueView("familles");
      setCatalogueFilters({});
      return;
    }
    setCatalogueView(null);
    setCatalogueFilters({});
    setCatalogueFamiliesUniverse(null);
  }, [catalogueFamiliesUniverse]);

  const backFromCatalogueFamilles = useCallback(() => {
    setCatalogueFamiliesUniverse(null);
    setCatalogueView(null);
    setCatalogueFilters({});
  }, []);

  const openIdeesJardins = useCallback(() => {
    setReturnScreen("catalogue");
    setCatalogueView("idees");
    setScreen("catalogue");
  }, []);

  const openGardenStylesWall = useCallback(() => {
    setReturnScreen("catalogue");
    setGardenStyleId(null);
    setCatalogueView("styles-wall");
    setScreen("catalogue");
  }, []);

  const openGardenStyleDetail = useCallback((id) => {
    setGardenStyleId(id);
    setCatalogueView("style-detail");
  }, []);

  const backToCatalogueHall = useCallback(() => {
    setCatalogueView(null);
    setCatalogueFilters({});
    setCatalogueFamiliesUniverse(null);
    setGardenStyleId(null);
  }, []);

  const openBrief = useCallback(() => {
    setReturnScreen("brief");
    setScreen("brief");
  }, []);

  const openPartners = useCallback(() => {
    setReturnScreen("partners");
    setScreen("partners");
  }, []);

  const openPartnersDemo = useCallback(() => {
    setReturnScreen("partners");
    setScreen("partners-demo");
  }, []);

  const backFromPartnersDemo = useCallback(() => {
    setScreen("partners");
  }, []);

  const leaveArchivedDiscovery = useCallback(() => {
    setArchivedDiscovery(null);
    setScreen(returnScreen || "coups-de-coeur");
  }, [returnScreen]);

  const bumpGardenDossier = useCallback(() => {
    setHomeGardenRefreshTick((tick) => tick + 1);
  }, []);

  const closeGardenFlow = useCallback(() => {
    setScreen(gardenFlowReturn || "home");
  }, [gardenFlowReturn]);

  const openGardenAmbiances = useCallback(
    (returnTo) => {
      setGardenFlowReturn(returnTo ?? screen);
      setScreen("garden-ambiances");
    },
    [screen]
  );

  const openGardenAmbianceDetail = useCallback((name) => {
    setGardenAmbianceName(name);
    setScreen("garden-ambiance-detail");
  }, []);

  const openGardenTerrain = useCallback(
    (returnTo) => {
      setGardenFlowReturn(returnTo ?? screen);
      setScreen("garden-terrain");
    },
    [screen]
  );

  const openGardenBudget = useCallback(() => {
    setGardenFlowReturn(screen);
    setScreen("garden-budget");
  }, [screen]);

  const openGardenMot = useCallback(
    (returnTo) => {
      setGardenFlowReturn(returnTo ?? screen);
      setScreen("garden-mot");
    },
    [screen]
  );

  const openGardenDetailsStep = useCallback(
    (stepScreen, returnTo = "brief") => {
      setGardenFlowReturn(returnTo ?? screen);
      setScreen(stepScreen);
    },
    [screen]
  );

  const openDossierStepById = useCallback(
    (stepId) => {
      if (stepId === "coups-de-coeur") {
        setGuidedCoupsBanner(true);
        setReturnScreen("catalogue");
        setCatalogueView(null);
        setCatalogueFilters({});
        setScreen("catalogue");
        return;
      }
      if (stepId === "mot-paysagiste") {
        setScreen("garden-mot");
        return;
      }
      if (stepId === "ambiance") {
        setScreen("garden-ambiances");
        return;
      }
      if (stepId === "quotidien") {
        setScreen("garden-quotidien");
        return;
      }
      if (stepId === "a-eviter") {
        setScreen("garden-a-eviter");
        return;
      }
      if (stepId === "terrain") {
        setScreen("garden-terrain");
        return;
      }
      if (stepId === "entretien") {
        setScreen("garden-entretien");
        return;
      }
      if (stepId === "budget") {
        setScreen("garden-budget");
      }
    },
    []
  );

  const showDossierStepConfirm = useCallback(
    async (completedStepId) => {
      bumpGardenDossier();
      const progress = await loadDossierProgressSnapshot();
      setDossierConfirmProgress(progress);
      setLastValidatedStepId(completedStepId || null);
      setScreen("garden-dossier-confirm");
    },
    [bumpGardenDossier]
  );

  const openFirstIncompleteDossierStep = useCallback(async () => {
    const progress = await loadDossierProgressSnapshot();
    const stepId = firstIncompleteStepId(progress);
    if (!stepId) {
      openBrief();
      return;
    }
    setGardenFlowReturn("home");
    openDossierStepById(stepId);
  }, [openBrief, openDossierStepById]);

  const continueCoupsGuidance = useCallback(async () => {
    const count = await fetchGardenCoupsCount();
    if (count < 1) return;
    setGuidedCoupsBanner(false);
    await showDossierStepConfirm("coups-de-coeur");
  }, [showDossierStepConfirm]);

  const handleDossierConfirmNext = useCallback(
    (stepId) => {
      openDossierStepById(stepId);
    },
    [openDossierStepById]
  );

  const gardenDossierRefreshKey = useMemo(
    () => `${homeGardenRefreshTick}-${contactRefreshTick}`,
    [homeGardenRefreshTick, contactRefreshTick]
  );

  const requestOpenProfile = useCallback((message = "") => {
    setProfileOpenRequest({
      id: Date.now(),
      message: message || "",
    });
  }, []);

  const handleProfileSaved = useCallback(() => {
    setContactRefreshTick((n) => n + 1);
    setProfileOpenRequest(null);
  }, []);

  const handleProfileDismiss = useCallback(() => {
    setProfileOpenRequest(null);
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
      setHomeGardenRefreshTick((tick) => tick + 1);
    }
    await refreshGuestAccount();
    setFeatureGateOpen(false);
    setFeatureGateInitialStep("prompt");
    const fn = pendingGuestActionRef.current;
    pendingGuestActionRef.current = null;
    if (fn) fn();
  }, [refreshGuestAccount]);

  const t = useMemo(() => createT(lang), [lang]);
  const locale = useMemo(() => getLocale(lang), [lang]);

  const mainNavProps = useMemo(
    () => ({
      onNavAccueil: goHomeAccueil,
      onNavIdees: openCatalogue,
      onNavCoupsDeCoeur: openCoupsDeCoeur,
      onNavDossier: openBrief,
      onNavPartenaires: openPartners,
    }),
    [goHomeAccueil, openCatalogue, openCoupsDeCoeur, openBrief, openPartners]
  );

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

  const slogan = t("slogan");
  const pageTitle = `Sevya — ${slogan}`;

  const featureGateOverlay = (
    <FeatureGateModal
      open={featureGateOpen}
      t={t}
      messageKey={featureGateMessageKey}
      initialStep={featureGateInitialStep}
      onClose={closeFeatureGateModal}
      onAccountCreated={handleSignupAccountCreated}
    />
  );

  const accountInitials = useMemo(() => getAccountInitials(premiumUserEmail), [premiumUserEmail]);
  const accueilDossierHome = screen === "home" && homeTab === "accueil";

  const accountMenu = useMemo(
    () => (
      <AccountMenu
        t={t}
        isLoggedIn={!isGuest}
        userEmail={premiumUserEmail || ""}
        initials={accountInitials}
        avatarSize={accueilDossierHome ? "accueil" : "default"}
        onHero={false}
        onSignOut={async () => {
          await signOutCloud();
          setPremiumUserEmail(null);
          setDiscoveries([]);
          setAlbums([]);
          await refreshGuestAccount();
        }}
        onAccountCreated={handleSignupAccountCreated}
        openProfileRequest={profileOpenRequest}
        onProfileDismiss={handleProfileDismiss}
        onProfileSaved={handleProfileSaved}
      />
    ),
    [
      t,
      isGuest,
      premiumUserEmail,
      accountInitials,
      accueilDossierHome,
      refreshGuestAccount,
      handleSignupAccountCreated,
      profileOpenRequest,
      handleProfileDismiss,
      handleProfileSaved,
    ]
  );

  if (authBootState === "loading") {
    return (
      <>
        <Head>
          <title>Sevya</title>
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
          onNavigateCatalogue={openCatalogue}
          onNavigateIdeesJardins={openIdeesJardins}
          onOpenBrief={openBrief}
          onOpenDossier={openBrief}
          onOpenCoupsDeCoeur={openCoupsDeCoeur}
          onOpenAmbiances={() => openGardenAmbiances("home")}
          onOpenTerrain={() => openGardenTerrain("home")}
          onOpenBudget={openGardenBudget}
          onOpenMot={() => openGardenMot("home")}
          onOpenQuotidien={() => openGardenDetailsStep("garden-quotidien", "home")}
          onOpenAEviter={() => openGardenDetailsStep("garden-a-eviter", "home")}
          onOpenEntretien={() => openGardenDetailsStep("garden-entretien", "home")}
          onContinueDossier={openFirstIncompleteDossierStep}
          accountMenu={accueilDossierHome && !isGuest ? accountMenu : null}
          gardenRefreshTick={homeGardenRefreshTick}
          homeTab={homeTab}
        />
      );
    } else if (screen === "coups-de-coeur") {
      pageTitleContent = "Coups de cœur — Sevya";
      mainContent = (
        <CoupsDeCoeurScreen
          refreshTick={homeGardenRefreshTick}
          scansCount={discoveries.length}
          onOpenItem={(item) => openGardenItemDetail(item.discovery, "coups-de-coeur")}
          onOpenMesScans={discoveries.length > 0 ? openMesScansHistory : undefined}
          onOpenIdees={openIdeesJardins}
          onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
        />
      );
    } else if (screen === "partners") {
      pageTitleContent = "Partenaires — Sevya";
      mainContent = <PartnersBientotScreen onOpenDemo={openPartnersDemo} />;
    } else if (screen === "partners-demo") {
      pageTitleContent = "Exemple partenaire — Sevya";
      mainContent = <PartnersDemoScreen onBack={backFromPartnersDemo} />;
    } else if (screen === "catalogue") {
      const catalogueProps = {
        t,
        canAddToGarden: true,
        onGardenChange: () => setHomeGardenRefreshTick((tick) => tick + 1),
        onRequireAccount: openRequireAccount,
      };

      if (catalogueView === "idees") {
        pageTitleContent = `${t("idees_jardins.title")} — Sevya`;
        mainContent = <IdeesJardinsScreen {...catalogueProps} onBack={backToCatalogueHall} />;
      } else if (catalogueView === "styles-wall") {
        pageTitleContent = "Styles de jardin — Sevya";
        mainContent = (
          <GardenStylesWallScreen onBack={backToCatalogueHall} onOpenStyle={openGardenStyleDetail} />
        );
      } else if (catalogueView === "style-detail" && gardenStyleId) {
        pageTitleContent = "Style de jardin — Sevya";
        mainContent = (
          <GardenStyleDetailScreen
            styleId={gardenStyleId}
            t={t}
            canAddToGarden
            onRequireAccount={openRequireAccount}
            onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
            onBack={() => {
              setGardenStyleId(null);
              if (returnScreen === "coups-de-coeur") {
                setCatalogueView(null);
                setScreen("coups-de-coeur");
              } else {
                setCatalogueView("styles-wall");
              }
            }}
          />
        );
      } else if (
        catalogueView === "familles" &&
        catalogueFamiliesUniverse &&
        ["vegetal", "mineral", "bordures"].includes(catalogueFamiliesUniverse)
      ) {
        pageTitleContent = "Catalogue — Sevya";
        mainContent = (
          <CatalogueFamillesScreen
            universe={catalogueFamiliesUniverse}
            onBack={backFromCatalogueFamilles}
            onOpenHub={openCatalogueHubFromFamilles}
          />
        );
      } else if (catalogueView === "vegetal" || catalogueView === "mineral" || catalogueView === "deco") {
        pageTitleContent = "Catalogue — Sevya";
        mainContent = (
          <CatalogueHubScreen
            {...catalogueProps}
            initialTab={catalogueView}
            initialFilters={catalogueFilters}
            onBack={backFromCatalogueHub}
            onOpenItemDetail={(discovery) => openGardenItemDetail(discovery, "catalogue")}
            onOpenCataloguePlant={openCataloguePlantFiche}
            onOpenCatalogueItem={openCatalogueItemFiche}
          />
        );
      } else {
        pageTitleContent = "Idées — Sevya";
        mainContent = (
          <IdeesAccueilScreen
            t={t}
            canAddToGarden
            onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
            onRequireAccount={openRequireAccount}
            onOpenCatalogueTab={openCatalogueTab}
            onOpenCatalogueFamilles={openCatalogueFamilles}
            onOpenAmbiances={() => openGardenAmbiances("catalogue")}
            onOpenGardenStyles={openGardenStylesWall}
            onOpenItemDetail={(discovery) => openGardenItemDetail(discovery, "catalogue")}
            onOpenCataloguePlant={openCataloguePlantFiche}
            onOpenCatalogueItem={openCatalogueItemFiche}
            dossierCoupsGuidance={guidedCoupsBanner}
            onContinueDossierGuidance={continueCoupsGuidance}
          />
        );
      }
    } else if (screen === "brief") {
      pageTitleContent = "Mon dossier jardin — Sevya";
      mainContent = (
        <DossierScreen
          t={t}
          refreshTick={gardenDossierRefreshKey}
          onOpenCoupsDeCoeur={openCoupsDeCoeur}
          onOpenMot={() => openGardenMot("brief")}
          onOpenAmbiance={() => openGardenAmbiances("brief")}
          onOpenTerrain={() => openGardenTerrain("brief")}
          onOpenBudget={openGardenBudget}
          onOpenQuotidien={() => openGardenDetailsStep("garden-quotidien", "brief")}
          onOpenAEviter={() => openGardenDetailsStep("garden-a-eviter", "brief")}
          onOpenEntretien={() => openGardenDetailsStep("garden-entretien", "brief")}
          onOpenProfile={requestOpenProfile}
        />
      );
    }

    return (
      <>
        <Head>
          <title>{pageTitleContent}</title>
          {screen === "home" && <meta name="description" content={slogan} />}
        </Head>
        <WilderMainLayout
          className="screen-enter-fast"
          activeNav={resolveMainNav(screen)}
          accountMenu={accueilDossierHome ? null : accountMenu}
          {...mainNavProps}
        >
          {mainContent}
        </WilderMainLayout>
        {featureGateOverlay}
      </>
    );
  }

  /* ── DOSSIER PARTICULIER : ambiance / terrain / budget ── */
  if (
    screen === "garden-ambiances" ||
    screen === "garden-ambiance-detail" ||
    screen === "garden-terrain" ||
    screen === "garden-budget" ||
    screen === "garden-mot" ||
    screen === "garden-quotidien" ||
    screen === "garden-a-eviter" ||
    screen === "garden-entretien" ||
    screen === "garden-dossier-confirm"
  ) {
    let title = "Mon dossier — Sevya";
    let body = null;
    if (screen === "garden-ambiances") {
      title = "Ambiances — Sevya";
      body = (
        <GardenAmbianceListScreen
          onBack={closeGardenFlow}
          onOpenAmbiance={openGardenAmbianceDetail}
        />
      );
    } else if (screen === "garden-ambiance-detail" && gardenAmbianceName) {
      title = `${gardenAmbianceName} — Sevya`;
      body = (
        <GardenAmbianceDetailScreen
          ambianceName={gardenAmbianceName}
          onBack={() => setScreen("garden-ambiances")}
          onValidated={() => showDossierStepConfirm("ambiance")}
        />
      );
    } else if (screen === "garden-terrain") {
      title = "Mon terrain — Sevya";
      body = (
        <GardenTerrainScreen
          onBack={closeGardenFlow}
          onChanged={bumpGardenDossier}
          onValidated={() => showDossierStepConfirm("terrain")}
        />
      );
    } else if (screen === "garden-budget") {
      title = "Mon budget — Sevya";
      body = (
        <GardenBudgetScreen
          onBack={closeGardenFlow}
          onValidated={() => showDossierStepConfirm("budget")}
        />
      );
    } else if (screen === "garden-mot") {
      title = "Mot pour le paysagiste — Sevya";
      body = (
        <GardenMotScreen
          onBack={closeGardenFlow}
          onValidated={() => showDossierStepConfirm("mot-paysagiste")}
        />
      );
    } else if (screen === "garden-quotidien") {
      title = "Votre quotidien — Sevya";
      body = (
        <GardenDetailsStepScreen
          kicker="Étape 4 · Votre quotidien"
          title={
            <>
              Qui va vivre
              <br />
              ce jardin ?
            </>
          }
          subtitle="Pour qu'il soit pensé pour vous, pas pour une photo."
          onBack={closeGardenFlow}
          valid={isQuotidienValid}
          onValidated={() => showDossierStepConfirm("quotidien")}
        >
          {(details, onDetailsChange) => (
            <StepQuotidien details={details} onDetailsChange={onDetailsChange} />
          )}
        </GardenDetailsStepScreen>
      );
    } else if (screen === "garden-a-eviter") {
      title = "Ce que vous ne voulez pas — Sevya";
      body = (
        <GardenDetailsStepScreen
          kicker="Étape 5 · À éviter"
          title={
            <>
              Ce que vous
              <br />
              ne voulez pas.
            </>
          }
          subtitle="Aussi utile que ce que vous aimez. Plusieurs choix possibles."
          onBack={closeGardenFlow}
          valid={isAEviterValid}
          onValidated={() => showDossierStepConfirm("a-eviter")}
        >
          {(details, onDetailsChange) => (
            <StepAEviter details={details} onDetailsChange={onDetailsChange} />
          )}
        </GardenDetailsStepScreen>
      );
    } else if (screen === "garden-entretien") {
      title = "Entretien et calendrier — Sevya";
      body = (
        <GardenDetailsStepScreen
          kicker="Étape 7 · Entretien et calendrier"
          title={
            <>
              Et après
              <br />
              les travaux ?
            </>
          }
          subtitle="Un jardin se pense aussi pour le temps que vous avez."
          onBack={closeGardenFlow}
          valid={isEntretienValid}
          onValidated={() => showDossierStepConfirm("entretien")}
        >
          {(details, onDetailsChange) => (
            <StepEntretien details={details} onDetailsChange={onDetailsChange} />
          )}
        </GardenDetailsStepScreen>
      );
    } else if (screen === "garden-dossier-confirm" && dossierConfirmProgress) {
      title = "Dossier enregistré — Sevya";
      const nextStepId = nextIncompleteStepId(dossierConfirmProgress, lastValidatedStepId);
      body = (
        <GardenDossierConfirmScreen
          progress={dossierConfirmProgress}
          nextStepId={nextStepId}
          onNextStep={handleDossierConfirmNext}
          onViewDossier={openBrief}
          refreshTick={gardenDossierRefreshKey}
          onOpenProfile={requestOpenProfile}
        />
      );
    } else if (screen === "garden-ambiance-detail") {
      title = "Ambiances — Sevya";
      body = (
        <GardenAmbianceListScreen
          onBack={closeGardenFlow}
          onOpenAmbiance={openGardenAmbianceDetail}
        />
      );
    }

    if (body) {
      return (
        <>
          <Head>
            <title>{title}</title>
          </Head>
          <WilderMainLayout
            className="screen-enter-fast"
            activeNav={resolveMainNav(gardenFlowReturn)}
            accountMenu={accountMenu}
            {...mainNavProps}
          >
            {body}
          </WilderMainLayout>
          {featureGateOverlay}
        </>
      );
    }
  }

  /* ── MA PALETTE ── */
  if (screen === "ma-palette") {
    return (
      <>
        <Head>
          <title>{t("palette.title")} — Sevya</title>
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
          <title>{t("palette.zone.title")} — Sevya</title>
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

  /* ── ANCIENNES TROUVAILLES (lecture seule) ── */
  if (screen === "mes-scans") {
    return (
      <>
        <Head>
          <title>Mes anciennes trouvailles — Sevya</title>
        </Head>
        <WilderMainLayout
          className="screen-enter-fast"
          activeNav={resolveMainNav(screen)}
          accountMenu={accountMenu}
          {...mainNavProps}
        >
          <MesScansScreen
            t={t}
            discoveries={discoveries}
            readOnly
            onBack={openCoupsDeCoeur}
            onOpenScan={openArchivedDiscovery}
          />
        </WilderMainLayout>
        {featureGateOverlay}
      </>
    );
  }

  if (screen === "ancienne-trouvaille" && archivedDiscovery) {
    return (
      <>
        <Head>
          <title>{archivedDiscovery.nom} — Sevya</title>
        </Head>
        <WilderMainLayout
          className="screen-enter-fast"
          activeNav={resolveMainNav(screen)}
          accountMenu={accountMenu}
          {...mainNavProps}
        >
          <AncienneTrouvailleDetailScreen discovery={archivedDiscovery} onBack={leaveArchivedDiscovery} />
        </WilderMainLayout>
        {featureGateOverlay}
      </>
    );
  }

  /* ── FICHE PLANTE CATALOGUE ── */
  if (screen === "catalogue-fiche" && catalogueFiche?.id) {
    const ficheTitle =
      catalogueFiche.universe === "vegetal"
        ? "Fiche plante — Sevya"
        : "Fiche catalogue — Sevya";
    return (
      <>
        <Head>
          <title>{ficheTitle}</title>
        </Head>
        <div className="screen-enter-fast" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
          {catalogueFiche.universe === "vegetal" ? (
            <CataloguePlantFicheScreen
              plantId={catalogueFiche.id}
              t={t}
              onBack={leaveCatalogueFiche}
              canAddToGarden
              onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
              onRequireAccount={openRequireAccount}
            />
          ) : (
            <CatalogueUniverseFicheScreen
              universe={catalogueFiche.universe}
              itemId={catalogueFiche.id}
              t={t}
              onBack={leaveCatalogueFiche}
              canAddToGarden
              onGardenChange={() => setHomeGardenRefreshTick((tick) => tick + 1)}
              onRequireAccount={openRequireAccount}
            />
          )}
        </div>
        {featureGateOverlay}
      </>
    );
  }

  return null;
}
