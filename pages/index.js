import { useState, useRef, useEffect, useCallback } from "react";

const LIBRARY_KEY = "plante-infini-library";
const USERNAME_KEY = "plante-infini-username";

const MODES = [
  { id: "direct", label: "Rapide", hint: "Analyse immédiate de la plante" },
  { id: "selection", label: "Sélection", hint: "Recadrez la zone à analyser" },
  { id: "potager", label: "Potager", hint: "Détecte toutes les plantes visibles" },
];

function loadLibrary() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLibrary(plants) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(plants));
}

function loadUserName() {
  if (typeof window === "undefined") return "Botaniste";
  return localStorage.getItem(USERNAME_KEY) || "Botaniste";
}

function saveUserName(name) {
  localStorage.setItem(USERNAME_KEY, name);
}

function formatDiscoveryDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function IconLeaf({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function IconCamera({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconBook({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconGarden({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-7" />
      <path d="M9 22v-4" />
      <path d="M15 22v-4" />
      <path d="M12 15c-4-2-6-5-6-9 0 3 2 5 6 5s6-2 6-5c0 4-2 7-6 9z" />
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

function IconGallery({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function IconChevronLeft({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function BotanicalDeco({ className = "", size = 48 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 58V28" />
      <path d="M32 28C32 28 18 24 14 14C10 4 22 8 32 18" />
      <path d="M32 28C32 28 46 24 50 14C54 4 42 8 32 18" />
      <path d="M32 38C32 38 22 36 18 30" />
      <path d="M32 38C32 38 42 36 46 30" />
      <circle cx="32" cy="12" r="3" fill="currentColor" opacity="0.3" stroke="none" />
    </svg>
  );
}

function BotanicalFlower({ className = "", size = 40 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="32" cy="24" r="5" fill="currentColor" opacity="0.15" stroke="currentColor" />
      <path d="M32 29v22" />
      <path d="M32 24c-8-2-14 2-16 10 6-2 12 0 16 6" />
      <path d="M32 24c8-2 14 2 16 10-6-2-12 0-16 6" />
      <path d="M26 20c-4 0-7 3-7 7 3-1 6-1 9-3" />
      <path d="M38 20c4 0 7 3 7 7-3-1-6-1-9-3" />
      <path d="M32 51c-6 2-10 0-12-4 4 1 8 2 12 0" />
      <path d="M32 51c6 2 10 0 12-4-4 1-8 2-12 0" />
    </svg>
  );
}

function CoverBotanicalDeco({ className = "" }) {
  return (
    <svg className={className} width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M32 56V30" />
      <path d="M32 30C20 26 12 18 16 8C22 14 28 22 32 30" />
      <path d="M32 30C44 26 52 18 48 8C42 14 36 22 32 30" />
      <path d="M26 20c-2 4-2 8 0 12" />
      <path d="M38 20c2 4 2 8 0 12" />
    </svg>
  );
}

function HerbariumPlantPage({ plant, pageNum, total, onDelete, className = "" }) {
  return (
    <div className={`herbarium-page ${className}`.trim()}>
      <div className="herbarium-page-lines" />
      <BotanicalDeco className="herbarium-deco herbarium-deco--tl" size={42} />
      <BotanicalFlower className="herbarium-deco herbarium-deco--tr" size={34} />
      <BotanicalFlower className="herbarium-deco herbarium-deco--bl" size={30} />
      <BotanicalDeco className="herbarium-deco herbarium-deco--br" size={38} />

      <div className="herbarium-page-header">
        <span className="herbarium-page-label">Specimen botanique</span>
        <span className="herbarium-page-num">
          Planche {pageNum} / {total}
        </span>
      </div>

      <div className="herbarium-specimen">
        <div className="herbarium-specimen-frame">
          <div className="herbarium-tape herbarium-tape--tl" />
          <div className="herbarium-tape herbarium-tape--tr" />
          <img src={plant.photo} alt={plant.nom} />
          <div className="herbarium-specimen-caption">Spécimen n° {String(pageNum).padStart(3, "0")}</div>
        </div>
      </div>

      <h2 className="herbarium-plant-name">{plant.nom}</h2>
      {plant.nom_latin && <p className="herbarium-plant-latin">{plant.nom_latin}</p>}

      {plant.description && (
        <div className="herbarium-scientific">
          <div className="herbarium-scientific-title">Observations &amp; description</div>
          <p className="herbarium-scientific-text">{plant.description}</p>
        </div>
      )}

      <div className="herbarium-date">
        <span>Découverte le {formatDiscoveryDate(plant.savedAt)}</span>
        <div className="herbarium-date-line" />
      </div>

      <button className="herbarium-delete" onClick={() => onDelete(plant.id)}>
        Retirer de l&apos;herbier
      </button>
    </div>
  );
}

function HerbariumView({ library, onBack, onDelete, onIdentify }) {
  const [phase, setPhase] = useState("closed");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageAnim, setPageAnim] = useState(null);
  const [userName, setUserName] = useState("Botaniste");
  const [editingName, setEditingName] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    setUserName(loadUserName());
    setPhase("closed");
    setPageIndex(0);
    setPageAnim(null);

    const openTimer = setTimeout(() => setPhase("opening"), 800);
    const revealTimer = setTimeout(() => setPhase("open"), 2200);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    if (pageIndex >= library.length && library.length > 0) {
      setPageIndex(Math.max(0, library.length - 1));
    }
  }, [library.length, pageIndex]);

  const turnPage = (dir) => {
    if (pageAnim) return;
    const next = dir === "next" ? pageIndex + 1 : pageIndex - 1;
    if (next < 0 || next >= library.length) return;

    setPageAnim(dir === "next" ? "turn-next" : "turn-prev");
    setTimeout(() => {
      setPageIndex(next);
      setPageAnim(dir === "next" ? "enter-next" : "enter-prev");
      setTimeout(() => setPageAnim(null), 550);
    }, 650);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setUserName(val);
    saveUserName(val);
  };

  const openBook = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    setTimeout(() => setPhase("open"), 1500);
  };

  const onTouchStart = (e) => {
    if (phase !== "open" || library.length < 2) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null || phase !== "open") return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) turnPage("next");
    else turnPage("prev");
  };

  const pageAnimClass =
    pageAnim === "turn-next"
      ? "herbarium-page--turn-next"
      : pageAnim === "turn-prev"
        ? "herbarium-page--turn-prev"
        : pageAnim === "enter-next"
          ? "herbarium-page--enter-next"
          : pageAnim === "enter-prev"
            ? "herbarium-page--enter-prev"
            : "";

  const showCover = phase === "closed" || phase === "opening";
  const showPages = phase === "open" || phase === "opening";

  return (
    <div
      className="herbarium-scene"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="herbarium-topbar">
        <button className="herbarium-back" onClick={onBack} aria-label="Retour">
          <IconBack size={18} />
        </button>
        {phase === "open" && library.length > 0 && (
          <span className="herbarium-nav-indicator">
            {pageIndex + 1} / {library.length}
          </span>
        )}
        <div style={{ width: 40 }} />
      </div>

      <div className="herbarium-stage">
        <div className="herbarium-book-wrap">
          {showCover && (
            <div
              className={`herbarium-cover${phase === "opening" ? " herbarium-cover--opening" : ""}`}
              onClick={openBook}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openBook()}
            >
              <div className="herbarium-cover-spine" />
              <CoverBotanicalDeco className="herbarium-cover-deco herbarium-cover-deco--tl" />
              <CoverBotanicalDeco className="herbarium-cover-deco herbarium-cover-deco--br" />
              <div className="herbarium-cover-border" />
              <div className="herbarium-cover-seal" aria-hidden="true" />
              <div className="herbarium-cover-inner">
                <h1 className="herbarium-cover-title">Mon Herbier</h1>
                <p className="herbarium-cover-subtitle">Collection botanique personnelle</p>
                {editingName ? (
                  <input
                    className="herbarium-cover-owner"
                    value={userName}
                    onChange={handleNameChange}
                    onBlur={() => setEditingName(false)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <button
                    className="herbarium-cover-owner"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingName(true);
                    }}
                  >
                    de {userName || "Botaniste"}
                  </button>
                )}
              </div>
              {phase === "closed" && (
                <div className="herbarium-cover-hint">Toucher pour ouvrir</div>
              )}
            </div>
          )}

          <div className={`herbarium-pages${showPages && phase === "open" ? " herbarium-pages--visible" : ""}`}>
            {library.length === 0 ? (
              <div className="herbarium-page">
                <div className="herbarium-page-lines" />
                <BotanicalDeco className="herbarium-deco herbarium-deco--tl" size={40} />
                <BotanicalDeco className="herbarium-deco herbarium-deco--br" size={36} />
                <div className="herbarium-empty">
                  <div className="herbarium-empty-icon">
                    <IconLeaf size={52} />
                  </div>
                  <div className="herbarium-empty-title">Herbier vide</div>
                  <p className="herbarium-empty-text">
                    Identifiez une plante et sauvegardez-la pour commencer votre collection.
                  </p>
                  <button className="herbarium-btn-identify" onClick={onIdentify}>
                    <IconCamera size={16} />
                    Identifier une plante
                  </button>
                </div>
              </div>
            ) : (
              <HerbariumPlantPage
                key={library[pageIndex]?.id}
                plant={library[pageIndex]}
                pageNum={pageIndex + 1}
                total={library.length}
                onDelete={onDelete}
                className={pageAnimClass}
              />
            )}
          </div>
        </div>
      </div>

      {phase === "open" && library.length > 1 && (
        <div className="herbarium-nav">
          <button
            className="herbarium-nav-btn"
            onClick={() => turnPage("prev")}
            disabled={pageIndex === 0 || !!pageAnim}
            aria-label="Page précédente"
          >
            <IconChevronLeft size={20} />
          </button>
          <span className="herbarium-nav-indicator">
            {library[pageIndex]?.nom}
          </span>
          <button
            className="herbarium-nav-btn"
            onClick={() => turnPage("next")}
            disabled={pageIndex >= library.length - 1 || !!pageAnim}
            aria-label="Page suivante"
          >
            <IconChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function Particles() {
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + (i * 7.5) % 85}%`,
    delay: `${i * 1.7}s`,
    duration: `${12 + (i % 4) * 3}s`,
    size: 2 + (i % 3),
  }));
  return (
    <div className="particles">
      {items.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function Logo({ subtitle }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="logo-text">
        <span className="logo-leaf">🌿</span>
        Plante Infini
      </div>
      {subtitle && <div className="logo-sub">{subtitle}</div>}
    </div>
  );
}

function Viewfinder() {
  return (
    <div className="viewfinder-frame">
      <div className="viewfinder-corner tl" />
      <div className="viewfinder-corner tr" />
      <div className="viewfinder-corner bl" />
      <div className="viewfinder-corner br" />
      <div className="scan-line" />
    </div>
  );
}

function ScreenWrap({ children, className = "screen-enter" }) {
  return (
    <div className={className} style={{ minHeight: "100vh", width: "100%", maxWidth: 480, margin: "0 auto" }}>
      {children}
    </div>
  );
}

export default function PlanteInfini() {
  const [screen, setScreen] = useState("home");
  const [analysisMode, setAnalysisMode] = useState("direct");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [library, setLibrary] = useState([]);
  const [savedNotice, setSavedNotice] = useState(false);
  const [selStart, setSelStart] = useState(null);
  const [selRect, setSelRect] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const imgContainerRef = useRef(null);
  const selectImgRef = useRef(null);

  const videoStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#060D09",
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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamReady(false);
      return;
    }

    const videoConstraints = [
      { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      { facingMode: "environment" },
      true,
    ];

    let stream = null;
    for (const video of videoConstraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        break;
      } catch {
        /* try next constraint set */
      }
    }

    if (!stream) {
      setCamReady(false);
      return;
    }

    streamRef.current = stream;
    setCamReady(true);
    await attachStreamToVideo();
  }, [attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCamReady(false);
  }, []);

  useEffect(() => {
    if (screen !== "camera" || !camReady) return;
    attachStreamToVideo();
  }, [screen, camReady, attachStreamToVideo]);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  useEffect(() => {
    if (screen === "camera") startCamera();
    else stopCamera();
    return stopCamera;
  }, [screen, startCamera, stopCamera]);

  const saveToLibrary = useCallback(() => {
    if (!captured || !result || result.plantes) return;
    const entry = {
      id: Date.now().toString(),
      photo: captured,
      nom: result.nom,
      nom_latin: result.nom_latin || "",
      description: result.description || "",
      savedAt: new Date().toISOString(),
    };
    const updated = [entry, ...loadLibrary()];
    saveLibrary(updated);
    setLibrary(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }, [captured, result]);

  const deleteFromLibrary = useCallback((id) => {
    const updated = loadLibrary().filter((p) => p.id !== id);
    saveLibrary(updated);
    setLibrary(updated);
  }, []);

  const goHome = () => {
    setResult(null);
    setCaptured(null);
    setErrorMsg("");
    setSelStart(null);
    setSelRect(null);
    setScreen("home");
  };

  const openCamera = (mode) => {
    setAnalysisMode(mode);
    setScreen("camera");
  };

  const analyze = useCallback(async (base64, imgSrc, mode = "single") => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode }),
      });
      const data = await res.json();
      if (data.erreur) {
        setErrorMsg(data.erreur);
        setScreen("error");
      } else if (mode === "potager") {
        setResult(data);
        setScreen("potager-result");
      } else {
        setResult(data);
        setScreen("result");
      }
    } catch (e) {
      setErrorMsg("Erreur: " + e.message);
      setScreen("error");
    }
  }, []);

  const handleCapturedImage = useCallback(
    (dataUrl) => {
      const base64 = dataUrl.split(",")[1];
      if (analysisMode === "selection") {
        setCaptured(dataUrl);
        setSelStart(null);
        setSelRect(null);
        setScreen("select");
      } else if (analysisMode === "potager") {
        analyze(base64, dataUrl, "potager");
      } else {
        analyze(base64, dataUrl, "single");
      }
    },
    [analysisMode, analyze]
  );

  const takePhoto = useCallback(() => {
    const v = videoRef.current,
      c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    handleCapturedImage(c.toDataURL("image/jpeg", 0.8));
  }, [handleCapturedImage]);

  const fromGallery = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => handleCapturedImage(e.target.result);
      reader.readAsDataURL(file);
    },
    [handleCapturedImage]
  );

  const getRelativePos = useCallback((e) => {
    const rect = imgContainerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
    };
  }, []);

  const onSelStart = useCallback(
    (e) => {
      e.preventDefault();
      const pos = getRelativePos(e);
      setSelStart(pos);
      setSelRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    },
    [getRelativePos]
  );

  const onSelMove = useCallback(
    (e) => {
      if (!selStart) return;
      e.preventDefault();
      const pos = getRelativePos(e);
      setSelRect({
        x: Math.min(selStart.x, pos.x),
        y: Math.min(selStart.y, pos.y),
        width: Math.abs(pos.x - selStart.x),
        height: Math.abs(pos.y - selStart.y),
      });
    },
    [selStart, getRelativePos]
  );

  const onSelEnd = useCallback(() => {
    setSelStart(null);
  }, []);

  const confirmSelection = useCallback(() => {
    if (!selRect || selRect.width < 20 || selRect.height < 20) return;
    const container = imgContainerRef.current;
    const img = selectImgRef.current;
    if (!container || !img) return;

    const scaleX = img.naturalWidth / container.clientWidth;
    const scaleY = img.naturalHeight / container.clientHeight;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(selRect.width * scaleX);
    canvas.height = Math.round(selRect.height * scaleY);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      selRect.x * scaleX,
      selRect.y * scaleY,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    analyze(dataUrl.split(",")[1], dataUrl, "single");
  }, [selRect, analyze]);

  const activeMode = MODES.find((m) => m.id === analysisMode);

  const healthClass =
    result?.sante?.etat === "bon"
      ? "health-good"
      : result?.sante?.etat === "attention"
        ? "health-warn"
        : "health-bad";

  /* ── HOME ── */
  if (screen === "home")
    return (
      <div className="home-bg screen-enter">
        <Particles />
        <ScreenWrap>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "3rem 1.5rem 2.5rem",
              gap: "2.5rem",
              minHeight: "100vh",
            }}
          >
            <div className="stagger-1" style={{ paddingTop: "1rem" }}>
              <Logo subtitle="Botanique intelligente" />
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <button className="action-card stagger-2" onClick={() => openCamera("direct")}>
                <div className="action-icon" style={{ background: "rgba(52, 211, 153, 0.12)" }}>
                  <IconCamera size={22} color="#34D399" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.2rem" }}>
                    Identifier une plante
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Photographiez ou importez une image
                  </div>
                </div>
              </button>

              <button className="action-card stagger-3" onClick={() => setScreen("library")}>
                <div className="action-icon" style={{ background: "rgba(212, 175, 55, 0.12)" }}>
                  <IconBook size={22} color="#D4AF37" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.2rem" }}>
                    Mon Herbier
                    {library.length > 0 && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.75rem",
                          background: "rgba(212, 175, 55, 0.2)",
                          color: "#D4AF37",
                          padding: "0.15rem 0.5rem",
                          borderRadius: 10,
                        }}
                      >
                        {library.length}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Votre collection botanique personnelle
                  </div>
                </div>
              </button>

              <button className="action-card gold-accent stagger-4" onClick={() => openCamera("potager")}>
                <div className="action-icon" style={{ background: "rgba(45, 106, 79, 0.25)" }}>
                  <IconGarden size={22} color="#40916C" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.2rem" }}>
                    Mode potager
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Analysez toutes les plantes d'un coup
                  </div>
                </div>
              </button>
            </div>

            <div
              className="stagger-4"
              style={{
                marginTop: "auto",
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              Propulsé par l'intelligence artificielle
            </div>
          </div>
        </ScreenWrap>
      </div>
    );

  /* ── CAMERA ── */
  if (screen === "camera")
    return (
      <ScreenWrap>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-deep)",
            padding: "1rem 1rem 2rem",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              className="btn-secondary"
              style={{ padding: "0.5rem 0.85rem", borderRadius: 12 }}
              onClick={goHome}
            >
              <IconBack size={18} />
            </button>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {analysisMode === "potager" ? "Mode Potager" : "Identification"}
            </div>
            <div style={{ width: 36 }} />
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              flex: 1,
              minHeight: "55vh",
              borderRadius: 20,
              overflow: "hidden",
              background: "#060D09",
              boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.08)",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => attachStreamToVideo()}
              style={{
                ...videoStyle,
                opacity: camReady ? 1 : 0,
                pointerEvents: camReady ? "auto" : "none",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {camReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Viewfinder />
              </div>
            )}
            {!camReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "1rem",
                  background: "#060D09",
                  zIndex: 1,
                }}
              >
                <div style={{ animation: "pulseGlow 2s ease-in-out infinite" }}>
                  <IconCamera size={48} color="#34D399" />
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Autorisez l'accès à la caméra
                </div>
              </div>
            )}
          </div>

          {analysisMode !== "potager" && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: "0.3rem",
                  background: "rgba(255,255,255,0.04)",
                  padding: "0.3rem",
                  borderRadius: 28,
                  border: "1px solid var(--border)",
                }}
              >
                {MODES.filter((m) => m.id !== "potager").map((m) => (
                  <button
                    key={m.id}
                    className={`mode-pill${analysisMode === m.id ? " active" : ""}`}
                    onClick={() => setAnalysisMode(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
                {activeMode?.hint}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2.5rem",
              paddingTop: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.3rem",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "0.72rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconGallery size={20} color="var(--text-secondary)" />
              </div>
              Galerie
              <input
                type="file"
                accept="image/*"
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                onChange={(e) => fromGallery(e.target.files[0])}
              />
            </label>

            <button className="capture-ring" onClick={camReady ? takePhoto : undefined} disabled={!camReady}>
              <div className="capture-ring-inner" />
            </button>

            <div style={{ width: 44 }} />
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── SELECT ── */
  if (screen === "select")
    return (
      <ScreenWrap>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-deep)" }}>
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button
              className="btn-secondary"
              style={{ padding: "0.5rem 0.85rem", borderRadius: 12 }}
              onClick={goHome}
            >
              <IconBack size={18} />
            </button>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>Sélectionnez la zone</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Tracez un rectangle autour de la plante
              </div>
            </div>
          </div>
          <div
            ref={imgContainerRef}
            style={{
              position: "relative",
              flex: 1,
              margin: "1rem",
              borderRadius: 16,
              overflow: "hidden",
              background: "#060D09",
              touchAction: "none",
              userSelect: "none",
              border: "1px solid var(--border)",
            }}
            onMouseDown={onSelStart}
            onMouseMove={onSelMove}
            onMouseUp={onSelEnd}
            onMouseLeave={onSelEnd}
            onTouchStart={onSelStart}
            onTouchMove={onSelMove}
            onTouchEnd={onSelEnd}
          >
            {captured && (
              <img
                ref={selectImgRef}
                src={captured}
                alt="Photo à recadrer"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                draggable={false}
              />
            )}
            {selRect && selRect.width > 0 && selRect.height > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: selRect.x,
                  top: selRect.y,
                  width: selRect.width,
                  height: selRect.height,
                  border: "2px solid var(--emerald)",
                  background: "rgba(52, 211, 153, 0.12)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  borderRadius: 4,
                }}
              />
            )}
          </div>
          <div style={{ padding: "1rem 1.25rem 2rem", display: "flex", gap: "0.75rem" }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={goHome}>
              Annuler
            </button>
            <button
              className="btn-primary"
              style={{
                flex: 2,
                opacity: selRect && selRect.width >= 20 && selRect.height >= 20 ? 1 : 0.45,
              }}
              onClick={confirmSelection}
              disabled={!selRect || selRect.width < 20 || selRect.height < 20}
            >
              Analyser cette zone
            </button>
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── ANALYZING ── */
  if (screen === "analyzing")
    return (
      <ScreenWrap className="screen-enter-fast">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            background: "var(--bg-deep)",
            padding: "2rem",
          }}
        >
          <div className="analyze-ring">
            <div className="analyze-ring-inner">
              {captured && (
                <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Analyse en cours…
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {analysisMode === "potager"
                ? "Le botaniste parcourt votre potager"
                : "Le botaniste examine votre plante"}
            </div>
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── ERROR ── */
  if (screen === "error")
    return (
      <ScreenWrap>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            padding: "2rem",
            textAlign: "center",
            background: "var(--bg-deep)",
          }}
        >
          <div style={{ fontSize: "3.5rem", animation: "float 3s ease-in-out infinite" }}>🍃</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 600 }}>
            Non reconnu
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <button className="btn-primary" onClick={goHome} style={{ marginTop: "0.5rem" }}>
            Réessayer
          </button>
        </div>
      </ScreenWrap>
    );

  /* ── POTAGER RESULT ── */
  if (screen === "potager-result" && result?.plantes)
    return (
      <ScreenWrap>
        <div style={{ background: "var(--bg-deep)", minHeight: "100vh", paddingBottom: "3rem" }}>
          {captured && (
            <div className="photo-hero-wrap">
              <img className="photo-hero" src={captured} alt="Potager" />
            </div>
          )}
          <div style={{ padding: "1.5rem", marginTop: captured ? "-2rem" : 0, position: "relative", zIndex: 1 }}>
            <button
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem", borderRadius: 12 }}
              onClick={goHome}
            >
              <IconBack size={18} /> Nouveau scan
            </button>
            <div
              style={{
                display: "inline-block",
                background: "rgba(45, 106, 79, 0.25)",
                color: "var(--emerald)",
                padding: "0.3rem 0.85rem",
                borderRadius: 20,
                fontSize: "0.75rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                border: "1px solid rgba(52, 211, 153, 0.2)",
              }}
            >
              Mode Potager
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "0.25rem",
              }}
            >
              {result.plantes.length} plante{result.plantes.length > 1 ? "s" : ""} détectée
              {result.plantes.length > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Analyse complète de la photo
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {result.plantes.map((plante, i) => (
                <div key={i} className="result-card" style={{ animation: `slideUp 0.4s ease-out ${i * 0.08}s both` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <IconLeaf size={18} color="#34D399" />
                    <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>{plante.nom}</span>
                    {plante.nom_latin && (
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        {plante.nom_latin}
                      </span>
                    )}
                  </div>
                  {plante.description && (
                    <div style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
                      {plante.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── RESULT ── */
  if (screen === "result" && result)
    return (
      <ScreenWrap>
        <div style={{ background: "var(--bg-deep)", minHeight: "100vh", paddingBottom: "3rem" }}>
          {captured && (
            <div className="photo-hero-wrap">
              <img className="photo-hero" src={captured} alt={result.nom} />
            </div>
          )}
          <div style={{ padding: "1.5rem", marginTop: captured ? "-2rem" : 0, position: "relative", zIndex: 1 }}>
            <button
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem", borderRadius: 12 }}
              onClick={goHome}
            >
              <IconBack size={18} /> Nouveau scan
            </button>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.2rem",
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: "0.25rem",
              }}
            >
              {result.nom}
            </div>
            {result.nom_latin && (
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  marginBottom: "1.25rem",
                }}
              >
                {result.nom_latin}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {result.sante && (
                <div className={`health-badge ${healthClass}`}>
                  {result.sante.etat === "bon" ? "✓" : result.sante.etat === "attention" ? "!" : "✕"}{" "}
                  {result.sante.commentaire}
                </div>
              )}

              {result.description && (
                <div className="result-card">
                  <div className="result-card-title">Description</div>
                  <div style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-secondary)" }}>
                    {result.description}
                  </div>
                </div>
              )}

              {result.entretien && (
                <div className="result-card">
                  <div className="result-card-title">Guide d'entretien</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                    {[
                      { i: "💧", l: "Arrosage", v: result.entretien.arrosage },
                      { i: "☀️", l: "Lumière", v: result.entretien.lumiere },
                      { i: "🪱", l: "Sol", v: result.entretien.sol },
                      { i: "🌡️", l: "Température", v: result.entretien.temperature },
                    ]
                      .filter((x) => x.v)
                      .map(({ i, l, v }) => (
                        <div key={l} className="care-grid-item">
                          <div style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{i}</div>
                          <div
                            style={{
                              fontSize: "0.62rem",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {l}
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{v}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {result.conseils && (
                <div className="tip-card">
                  <div className="result-card-title" style={{ color: "var(--gold-light)" }}>
                    Conseil du botaniste
                  </div>
                  <div style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-secondary)" }}>
                    {result.conseils}
                  </div>
                </div>
              )}

              {result.caracteristiques?.length > 0 && (
                <div className="result-card">
                  <div className="result-card-title">Caractéristiques</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {result.caracteristiques.map((c, i) => (
                      <span key={i} className="tag-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.utilisation?.length > 0 && (
                <div className="result-card">
                  <div className="result-card-title">Utilisations</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {result.utilisation.map((u, i) => (
                      <span key={i} className="tag-chip">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className={`btn-primary${savedNotice ? "" : ""}`}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  background: savedNotice
                    ? "linear-gradient(135deg, #40916C, #34D399)"
                    : undefined,
                }}
                onClick={savedNotice ? undefined : saveToLibrary}
              >
                {savedNotice ? "✓ Ajoutée à l'herbier" : "Ajouter à l'herbier"}
              </button>
            </div>
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── HERBARIUM ── */
  if (screen === "library")
    return (
      <div className="herbarium-screen-wrap screen-enter-fast">
        <HerbariumView
          library={library}
          onBack={goHome}
          onDelete={deleteFromLibrary}
          onIdentify={() => openCamera("direct")}
        />
      </div>
    );

  return null;
}
