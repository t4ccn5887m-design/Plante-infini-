import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { createT, detectLang, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { playDiscoverySound, warmUpSounds } from "@/lib/sounds";
import AnimalSoundQuiz from "@/components/AnimalSoundQuiz";
import { shareDiscovery } from "@/lib/share";
import OnboardingScreen from "@/components/OnboardingScreen";
import {
  acquireCameraStream,
  completeOnboarding,
  isCameraGranted,
  isOnboardingComplete,
  syncCameraPermissionStatus,
} from "@/lib/permissions";

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

function applyTheme(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

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
      <ellipse cx="34" cy="38" rx="5" ry="6" fill="#E07A3A" opacity="0.9" transform="rotate(-25 34 38)" />
      <path
        d="M52 28c-4 6-6 14-4 22 2-10 8-16 16-18"
        fill="#2D5A45"
        stroke="#F5F2EB"
        strokeWidth="1"
        strokeLinecap="round"
      />
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

function IconBack({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

function IconLeafSmall({ className, style }) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
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
    <button type="button" className="btn-share" onClick={handleShare} disabled={sharing}>
      <IconShare size={18} />
      {sharing ? t("discovery.share_generating") : t("discovery.share")}
    </button>
  );
}

function DiscoveryBody({ data, discovery, t, lang, children }) {
  return (
    <>
      <span className="discovery-new-badge">{t("discovery.new")}</span>
      <h1 className="discovery-name">{data.nom}</h1>
      {data.nom_latin && <p className="discovery-latin">{data.nom_latin}</p>}
      {data.famille && <p className="discovery-family">{data.famille}</p>}
      {data.identification_note && <p className="discovery-id-note">{data.identification_note}</p>}

      {data.type && (
        <span className="discovery-type-chip">{getTypeLabel(t, data.type)}</span>
      )}

      <RarityBadge rarete={data.rarete} t={t} />
      <AnimalSoundQuiz data={data} t={t} />

      {data.description && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.description")}</div>
          <p className="result-card-text">{data.description}</p>
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

      {data.fun_fact && (
        <div className="result-card">
          <div className="result-card-title">{t("discovery.anecdotes")}</div>
          <p className="result-card-text">{data.fun_fact}</p>
        </div>
      )}

      {discovery?.photo && <ShareButton discovery={discovery} t={t} lang={lang} />}
      {children}
    </>
  );
}

export default function Wilder() {
  const [screen, setScreen] = useState("home");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [pokedexAnim, setPokedexAnim] = useState(true);
  const [camError, setCamError] = useState("");
  const [camLoading, setCamLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(
    () => typeof window !== "undefined" && !isOnboardingComplete()
  );
  const [camZoom, setCamZoom] = useState(1);
  const [lang] = useState(() => detectLang());
  const [theme, setTheme] = useState("dark");

  const t = useMemo(() => createT(lang), [lang]);
  const slogan = t("slogan");
  const pageTitle = `Wilder — ${slogan}`;
  const marquee = t("marquee");

  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef({ dist: 0, zoom: 1 });
  const hardwareZoomRef = useRef({ min: 1, max: 1, step: 0.1, supported: false });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
    streamRef.current?.getTracks().forEach((track) => track.stop());
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
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  useEffect(() => {
    syncCameraPermissionStatus().catch(() => {});
    const onFirstTouch = () => warmUpSounds();
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstTouch);
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
      const timer = setTimeout(() => setPokedexAnim(false), 900);
      return () => clearTimeout(timer);
    }
  }, [screen, result?.nom]);

  const goHome = () => {
    setResult(null);
    setCaptured(null);
    setErrorMsg("");
    setScreen("home");
  };

  const analyze = useCallback(
    async (base64, imgSrc) => {
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

        setResult(data);
        setScreen("result");
        playDiscoverySound();
      } catch (e) {
        console.error("[Wilder] analyze:", e);
        setErrorMsg("Erreur: " + e.message);
        setScreen("error");
      }
    },
    [t]
  );

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

  const onPinchStart = useCallback(
    (e) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom: camZoom };
    },
    [camZoom]
  );

  const onPinchMove = useCallback((e) => {
    if (e.touches.length !== 2 || pinchRef.current.dist <= 0) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / pinchRef.current.dist;
    setCamZoom(Math.min(4, Math.max(1, pinchRef.current.zoom * ratio)));
  }, []);

  const shareDiscoveryPayload = useMemo(() => {
    if (!result || !captured) return null;
    return { ...result, photo: captured };
  }, [result, captured]);

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
            completeOnboarding();
            setNeedsOnboarding(false);
          }}
        />
      </>
    );
  }

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

            <button type="button" className="btn-scanner stagger-2" onClick={() => setScreen("camera")}>
              <span className="btn-scanner-icon">
                <IconCamera size={32} color="white" />
              </span>
              {t("home.discover")}
            </button>

            <div className="discovery-marquee stagger-2" aria-hidden="true">
              <div className="discovery-marquee-track">
                <span>
                  {marquee}
                  {marquee}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (screen === "camera") {
    return (
      <>
        <Head>
          <title>Scanner — Wilder</title>
        </Head>
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

            <div className="scanner-center">{camReady && <Viewfinder />}</div>

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
                <button
                  type="button"
                  className="capture-btn-wilder"
                  onClick={takePhoto}
                  disabled={!camReady}
                  aria-label="Capturer"
                >
                  <div className="capture-btn-inner" />
                </button>
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

  if (screen === "analyzing") {
    return (
      <>
        <Head>
          <title>Analyse… — Wilder</title>
        </Head>
        <div className="analyze-screen screen-enter-fast">
          <div className="analyze-ring">
            <div className="analyze-ring-inner">
              {captured && (
                <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.4rem" }}>
              {t("analyze.title")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("analyze.subtitle")}</p>
          </div>
        </div>
      </>
    );
  }

  if (screen === "error") {
    return (
      <>
        <Head>
          <title>Non reconnu — Wilder</title>
        </Head>
        <div className="analyze-screen screen-enter" style={{ textAlign: "center", padding: "2rem" }}>
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
            <DiscoveryBody data={result} discovery={shareDiscoveryPayload} t={t} lang={lang}>
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
        </div>
      </>
    );
  }

  return null;
}
