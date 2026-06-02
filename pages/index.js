import { useState, useRef, useEffect, useCallback } from "react";

const LIBRARY_KEY = "plante-infini-library";

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
                    Ma bibliothèque
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
                    Retrouvez vos plantes sauvegardées
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
                {savedNotice ? "✓ Sauvegardée dans la bibliothèque" : "Sauvegarder dans la bibliothèque"}
              </button>
            </div>
          </div>
        </div>
      </ScreenWrap>
    );

  /* ── LIBRARY ── */
  if (screen === "library")
    return (
      <ScreenWrap>
        <div style={{ background: "var(--bg-deep)", minHeight: "100vh", paddingBottom: "3rem" }}>
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                }}
              >
                Ma bibliothèque
              </div>
              {library.length > 0 && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {library.length} plante{library.length > 1 ? "s" : ""} sauvegardée{library.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
            <button
              className="btn-secondary"
              style={{ padding: "0.5rem 0.85rem", borderRadius: 12 }}
              onClick={goHome}
            >
              <IconBack size={18} />
            </button>
          </div>

          {library.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 2rem",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ marginBottom: "1.25rem", animation: "float 3s ease-in-out infinite" }}>
                <IconLeaf size={56} color="rgba(52,211,153,0.3)" />
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Aucune plante sauvegardée
              </div>
              <div style={{ fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Analysez une plante et sauvegardez-la pour la retrouver ici.
              </div>
              <button className="btn-primary" onClick={() => openCamera("direct")}>
                Identifier une plante
              </button>
            </div>
          ) : (
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {library.map((plant, i) => (
                <div
                  key={plant.id}
                  className="lib-card"
                  style={{ animation: `slideUp 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <img
                    style={{ width: "100%", height: 180, objectFit: "cover" }}
                    src={plant.photo}
                    alt={plant.nom}
                  />
                  <div style={{ padding: "1.1rem" }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                      {plant.nom}
                    </div>
                    {plant.nom_latin && (
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {plant.nom_latin}
                      </div>
                    )}
                    {plant.description && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          lineHeight: 1.65,
                          color: "var(--text-secondary)",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {plant.description}
                      </div>
                    )}
                    <button
                      style={{
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#FCA5A5",
                        padding: "0.4rem 0.85rem",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                      onClick={() => deleteFromLibrary(plant.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScreenWrap>
    );

  return null;
}
