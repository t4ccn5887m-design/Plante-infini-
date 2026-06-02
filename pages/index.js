import { useState, useRef, useEffect, useCallback } from "react";

const LIBRARY_KEY = "plante-infini-library";

const MODES = [
  { id: "direct", label: "🌿 Rapide", hint: "Analyse immédiate" },
  { id: "selection", label: "✂️ Sélection", hint: "Recadrez la zone" },
  { id: "potager", label: "🥕 Potager", hint: "Toutes les plantes" },
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

function ViewfinderCorners() {
  const corner = (top, left, right, bottom) => ({
    position: "absolute",
    width: 22,
    height: 22,
    top,
    left,
    right,
    bottom,
    borderTop: top !== undefined ? "3px solid #52B788" : undefined,
    borderBottom: bottom !== undefined ? "3px solid #52B788" : undefined,
    borderLeft: left !== undefined ? "3px solid #52B788" : undefined,
    borderRight: right !== undefined ? "3px solid #52B788" : undefined,
  });
  return (
    <>
      <div style={corner(0, 0, undefined, undefined)} />
      <div style={corner(0, undefined, 0, undefined)} />
      <div style={corner(undefined, 0, undefined, 0)} />
      <div style={corner(undefined, undefined, 0, 0)} />
    </>
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
    background: "#111",
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
    if (screen !== "home" || !camReady) return;
    attachStreamToVideo();
  }, [screen, camReady, attachStreamToVideo]);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  useEffect(() => {
    if (screen === "home") startCamera();
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

  const analyze = useCallback(async (base64, imgSrc, mode = "single") => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode })
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

  const handleCapturedImage = useCallback((dataUrl) => {
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
  }, [analysisMode, analyze]);

  const takePhoto = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    handleCapturedImage(c.toDataURL("image/jpeg", 0.8));
  }, [handleCapturedImage]);

  const fromGallery = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => handleCapturedImage(e.target.result);
    reader.readAsDataURL(file);
  }, [handleCapturedImage]);

  const getRelativePos = useCallback((e) => {
    const rect = imgContainerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
    };
  }, []);

  const onSelStart = useCallback((e) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setSelStart(pos);
    setSelRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [getRelativePos]);

  const onSelMove = useCallback((e) => {
    if (!selStart) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setSelRect({
      x: Math.min(selStart.x, pos.x),
      y: Math.min(selStart.y, pos.y),
      width: Math.abs(pos.x - selStart.x),
      height: Math.abs(pos.y - selStart.y),
    });
  }, [selStart, getRelativePos]);

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
      selRect.x * scaleX, selRect.y * scaleY,
      canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    analyze(dataUrl.split(",")[1], dataUrl, "single");
  }, [selRect, analyze]);

  const s = {
    page: { minHeight: "100vh", fontFamily: "Georgia, serif", background: "#F7F9F5", color: "#1B2B22", display: "flex", flexDirection: "column", alignItems: "center" },
    home: { minHeight: "100vh", width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 1rem 2.5rem", gap: "1.25rem" },
    logo: { fontSize: "1.6rem", fontWeight: "bold", color: "#2D6A4F" },
    tag: { fontSize: "0.85rem", color: "#7A9586", marginTop: "0.2rem" },
    cameraWrap: { position: "relative", width: "100%", aspectRatio: "3/4", borderRadius: 20, overflow: "hidden", background: "#111", boxShadow: "0 8px 40px rgba(45,106,79,0.18)" },
    viewfinderHole: { position: "relative", width: "72%", height: "58%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.42)" },
    viewfinderOverlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
    modeBar: { display: "flex", gap: "0.35rem", background: "#EAF5EE", padding: "0.3rem", borderRadius: 30, width: "100%" },
    modeBtn: (active) => ({
      flex: 1, border: "none", borderRadius: 26, padding: "0.55rem 0.4rem", fontSize: "0.72rem",
      cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.2s",
      background: active ? "#2D6A4F" : "transparent",
      color: active ? "white" : "#2D6A4F",
      fontWeight: active ? "bold" : "normal",
    }),
    modeHint: { fontSize: "0.75rem", color: "#7A9586", textAlign: "center" },
    captureBtn: {
      width: 80, height: 80, borderRadius: "50%", background: "#2D6A4F",
      border: "5px solid white", boxShadow: "0 0 0 3px #2D6A4F, 0 6px 24px rgba(45,106,79,0.35)",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.8rem", flexShrink: 0,
    },
    captureBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
    captureRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", width: "100%" },
    btn: { background: "#2D6A4F", color: "white", border: "none", padding: "1rem 2.5rem", borderRadius: "50px", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" },
    btnSecondary: { background: "white", color: "#2D6A4F", border: "2px solid #2D6A4F", padding: "0.75rem 1.5rem", borderRadius: "50px", fontSize: "0.9rem", cursor: "pointer" },
    gallery: { fontSize: "0.85rem", color: "#7A9586", cursor: "pointer", position: "relative" },
    analyzing: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" },
    ring: { width: 190, height: 190, borderRadius: "50%", overflow: "hidden", border: "3px solid #52B788", boxShadow: "0 0 0 10px #D8EDDF" },
    selectScreen: { minHeight: "100vh", width: "100%", maxWidth: 600, display: "flex", flexDirection: "column" },
    selectHeader: { padding: "1.25rem", background: "white", borderBottom: "1px solid #DCE8DC" },
    selectTitle: { fontSize: "1.3rem", fontWeight: "bold", color: "#2D6A4F" },
    selectHint: { fontSize: "0.85rem", color: "#7A9586", marginTop: "0.3rem" },
    selectImgWrap: { position: "relative", flex: 1, margin: "1rem", borderRadius: 16, overflow: "hidden", background: "#111", touchAction: "none", userSelect: "none" },
    selectRect: { position: "absolute", border: "2px solid #52B788", background: "rgba(82,183,136,0.15)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" },
    selectActions: { padding: "1rem 1.25rem 2rem", display: "flex", gap: "0.75rem" },
    result: { width: "100%", maxWidth: 600, paddingBottom: "3rem" },
    photo: { width: "100%", height: 280, objectFit: "cover" },
    header: { background: "white", padding: "1.5rem", borderBottom: "1px solid #DCE8DC", position: "relative" },
    name: { fontSize: "2rem", fontWeight: "bold", color: "#1B2B22" },
    latin: { fontSize: "0.95rem", color: "#7A9586", fontStyle: "italic" },
    backBtn: { position: "absolute", top: "1rem", right: "1rem", background: "#D8EDDF", border: "none", borderRadius: "20px", padding: "0.4rem 1rem", color: "#2D6A4F", cursor: "pointer" },
    body: { padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
    card: { background: "white", borderRadius: 16, padding: "1.2rem", border: "1px solid #DCE8DC" },
    cardTitle: { fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", color: "#2D6A4F", marginBottom: "0.7rem" },
    cardText: { fontSize: "0.9rem", lineHeight: 1.7, color: "#1B2B22" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" },
    gridItem: { background: "#F7F9F5", borderRadius: 10, padding: "0.8rem" },
    tip: { background: "linear-gradient(135deg, #EAF5EE, #F7F9F5)", border: "1px solid #C3DFC9", borderRadius: 16, padding: "1.2rem" },
    tags: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
    tagItem: { background: "#D8EDDF", color: "#2D6A4F", padding: "0.3rem 0.75rem", borderRadius: 20, fontSize: "0.8rem" },
    health: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: 30, fontSize: "0.85rem", fontWeight: "bold" },
    error: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem", textAlign: "center" },
    libBtn: { background: "white", color: "#2D6A4F", border: "2px solid #2D6A4F", padding: "0.75rem 1.5rem", borderRadius: "50px", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" },
    saveBtn: { background: "#2D6A4F", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "50px", fontSize: "0.9rem", cursor: "pointer", width: "100%", marginTop: "0.5rem" },
    saveBtnDone: { background: "#52B788", cursor: "default" },
    library: { width: "100%", maxWidth: 600, minHeight: "100vh", paddingBottom: "3rem" },
    libHeader: { background: "white", padding: "1.5rem", borderBottom: "1px solid #DCE8DC", display: "flex", alignItems: "center", justifyContent: "space-between" },
    libTitle: { fontSize: "1.5rem", fontWeight: "bold", color: "#2D6A4F" },
    libEmpty: { textAlign: "center", padding: "4rem 2rem", color: "#7A9586" },
    libList: { padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" },
    libItem: { background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #DCE8DC" },
    libPhoto: { width: "100%", height: 180, objectFit: "cover" },
    libBody: { padding: "1rem" },
    libName: { fontSize: "1.1rem", fontWeight: "bold", color: "#1B2B22", marginBottom: "0.25rem" },
    libLatin: { fontSize: "0.85rem", color: "#7A9586", fontStyle: "italic", marginBottom: "0.5rem" },
    libDesc: { fontSize: "0.85rem", lineHeight: 1.6, color: "#1B2B22" },
    deleteBtn: { marginTop: "0.75rem", background: "none", border: "1px solid #FEE2E2", color: "#991B1B", padding: "0.4rem 0.8rem", borderRadius: 20, fontSize: "0.8rem", cursor: "pointer" },
    potagerBadge: { display: "inline-block", background: "#D8EDDF", color: "#2D6A4F", padding: "0.3rem 0.8rem", borderRadius: 20, fontSize: "0.8rem", marginBottom: "0.5rem" },
    plantCount: { fontSize: "0.9rem", color: "#7A9586", marginTop: "0.25rem" },
  };

  const activeMode = MODES.find(m => m.id === analysisMode);

  if (screen === "home") return (
    <div style={s.home}>
      <div style={{ textAlign: "center" }}>
        <div style={s.logo}>🌿 Plante Infini</div>
        <div style={s.tag}>Identifiez n'importe quelle plante</div>
      </div>

      <div style={s.cameraWrap}>
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
          <div style={s.viewfinderOverlay}>
            <div style={s.viewfinderHole}>
              <ViewfinderCorners />
            </div>
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
              gap: "0.5rem",
              background: "#111",
              zIndex: 1,
            }}
          >
            <div style={{ fontSize: "3rem" }}>📷</div>
            <div style={{ fontSize: "0.85rem", color: "#aaa" }}>Autorisez la caméra</div>
          </div>
        )}
      </div>

      <div style={{ width: "100%" }}>
        <div style={s.modeBar}>
          {MODES.map(m => (
            <button key={m.id} style={s.modeBtn(analysisMode === m.id)} onClick={() => setAnalysisMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ ...s.modeHint, marginTop: "0.5rem" }}>{activeMode?.hint}</div>
      </div>

      <div style={s.captureRow}>
        <label style={{ ...s.gallery, visibility: "hidden", width: 60 }} aria-hidden>·</label>
        <button
          style={{ ...s.captureBtn, ...(!camReady ? s.captureBtnDisabled : {}) }}
          onClick={camReady ? takePhoto : undefined}
          aria-label="Prendre une photo"
        >
          📸
        </button>
        <label style={{ ...s.gallery, width: 60, textAlign: "center" }} title="Galerie">
          🖼️
          <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={e => fromGallery(e.target.files[0])} />
        </label>
      </div>

      <button style={s.libBtn} onClick={() => setScreen("library")}>
        📚 Ma bibliothèque{library.length > 0 ? ` (${library.length})` : ""}
      </button>
    </div>
  );

  if (screen === "select") return (
    <div style={s.selectScreen}>
      <div style={s.selectHeader}>
        <div style={s.selectTitle}>✂️ Sélectionnez la zone</div>
        <div style={s.selectHint}>Tracez un rectangle autour de la plante à analyser</div>
      </div>
      <div
        ref={imgContainerRef}
        style={s.selectImgWrap}
        onMouseDown={onSelStart}
        onMouseMove={onSelMove}
        onMouseUp={onSelEnd}
        onMouseLeave={onSelEnd}
        onTouchStart={onSelStart}
        onTouchMove={onSelMove}
        onTouchEnd={onSelEnd}
      >
        {captured && (
          <img ref={selectImgRef} src={captured} alt="Photo à recadrer" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} draggable={false} />
        )}
        {selRect && selRect.width > 0 && selRect.height > 0 && (
          <div style={{ ...s.selectRect, left: selRect.x, top: selRect.y, width: selRect.width, height: selRect.height }} />
        )}
      </div>
      <div style={s.selectActions}>
        <button style={{ ...s.btnSecondary, flex: 1 }} onClick={goHome}>Annuler</button>
        <button
          style={{ ...s.btn, flex: 2, justifyContent: "center", opacity: selRect && selRect.width >= 20 && selRect.height >= 20 ? 1 : 0.5 }}
          onClick={confirmSelection}
          disabled={!selRect || selRect.width < 20 || selRect.height < 20}
        >
          🔍 Analyser cette zone
        </button>
      </div>
    </div>
  );

  if (screen === "analyzing") return (
    <div style={s.analyzing}>
      <div style={s.ring}>{captured && <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2D6A4F" }}>Analyse en cours…</div>
        <div style={{ fontSize: "0.85rem", color: "#7A9586" }}>
          {analysisMode === "potager" ? "Le botaniste parcourt votre potager" : "Le botaniste examine votre plante"}
        </div>
      </div>
    </div>
  );

  if (screen === "error") return (
    <div style={s.error}>
      <div style={{ fontSize: "3rem" }}>🍃</div>
      <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>Non reconnu</div>
      <p style={{ color: "#7A9586" }}>{errorMsg}</p>
      <button style={s.btn} onClick={goHome}>Réessayer</button>
    </div>
  );

  if (screen === "potager-result" && result?.plantes) return (
    <div style={s.result}>
      {captured && <img style={s.photo} src={captured} alt="Potager" />}
      <div style={s.header}>
        <button style={s.backBtn} onClick={goHome}>📷 Nouveau scan</button>
        <div style={s.potagerBadge}>🥕 Mode Potager</div>
        <div style={s.name}>{result.plantes.length} plante{result.plantes.length > 1 ? "s" : ""} détectée{result.plantes.length > 1 ? "s" : ""}</div>
        <div style={s.plantCount}>Analyse complète de la photo</div>
      </div>
      <div style={s.body}>
        {result.plantes.map((plante, i) => (
          <div key={i} style={s.card}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🌱</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#1B2B22" }}>{plante.nom}</span>
              {plante.nom_latin && <span style={{ fontSize: "0.85rem", color: "#7A9586", fontStyle: "italic" }}>{plante.nom_latin}</span>}
            </div>
            {plante.description && <div style={s.cardText}>{plante.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === "result" && result) return (
    <div style={s.result}>
      {captured && <img style={s.photo} src={captured} alt={result.nom} />}
      <div style={s.header}>
        <button style={s.backBtn} onClick={goHome}>📷 Nouveau scan</button>
        <div style={s.name}>{result.nom}</div>
        {result.nom_latin && <div style={s.latin}>{result.nom_latin}</div>}
      </div>
      <div style={s.body}>
        {result.sante && (
          <div style={{ ...s.health, background: result.sante.etat === "bon" ? "#E6F4EC" : result.sante.etat === "attention" ? "#FEF3C7" : "#FEE2E2", color: result.sante.etat === "bon" ? "#1E6B3A" : result.sante.etat === "attention" ? "#92400E" : "#991B1B" }}>
            {result.sante.etat === "bon" ? "✅" : result.sante.etat === "attention" ? "⚠️" : "❌"} {result.sante.commentaire}
          </div>
        )}
        {result.description && <div style={s.card}><div style={s.cardTitle}>Description</div><div style={s.cardText}>{result.description}</div></div>}
        {result.entretien && (
          <div style={s.card}>
            <div style={s.cardTitle}>Guide d'entretien</div>
            <div style={s.grid}>
              {[{ i: "💧", l: "Arrosage", v: result.entretien.arrosage }, { i: "☀️", l: "Lumière", v: result.entretien.lumiere }, { i: "🪱", l: "Sol", v: result.entretien.sol }, { i: "🌡️", l: "Température", v: result.entretien.temperature }].filter(x => x.v).map(({ i, l, v }) => (
                <div key={l} style={s.gridItem}><div style={{ fontSize: "1.2rem" }}>{i}</div><div style={{ fontSize: "0.65rem", color: "#7A9586", textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: "0.82rem" }}>{v}</div></div>
              ))}
            </div>
          </div>
        )}
        {result.conseils && <div style={s.tip}><div style={s.cardTitle}>💡 Conseil du botaniste</div><div style={s.cardText}>{result.conseils}</div></div>}
        {result.caracteristiques?.length > 0 && <div style={s.card}><div style={s.cardTitle}>Caractéristiques</div><div style={s.tags}>{result.caracteristiques.map((c, i) => <span key={i} style={s.tagItem}>{c}</span>)}</div></div>}
        {result.utilisation?.length > 0 && <div style={s.card}><div style={s.cardTitle}>Utilisations</div><div style={s.tags}>{result.utilisation.map((u, i) => <span key={i} style={s.tagItem}>{u}</span>)}</div></div>}
        <button
          style={{ ...s.saveBtn, ...(savedNotice ? s.saveBtnDone : {}) }}
          onClick={savedNotice ? undefined : saveToLibrary}
        >
          {savedNotice ? "✓ Sauvegardée dans la bibliothèque" : "📚 Sauvegarder dans la bibliothèque"}
        </button>
      </div>
    </div>
  );

  if (screen === "library") return (
    <div style={s.library}>
      <div style={s.libHeader}>
        <div style={s.libTitle}>📚 Ma bibliothèque</div>
        <button style={s.backBtn} onClick={goHome}>← Retour</button>
      </div>
      {library.length === 0 ? (
        <div style={s.libEmpty}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Aucune plante sauvegardée</div>
          <div>Analysez une plante et sauvegardez-la pour la retrouver ici.</div>
        </div>
      ) : (
        <div style={s.libList}>
          {library.map((plant) => (
            <div key={plant.id} style={s.libItem}>
              <img style={s.libPhoto} src={plant.photo} alt={plant.nom} />
              <div style={s.libBody}>
                <div style={s.libName}>{plant.nom}</div>
                {plant.nom_latin && <div style={s.libLatin}>{plant.nom_latin}</div>}
                {plant.description && <div style={s.libDesc}>{plant.description}</div>}
                <button style={s.deleteBtn} onClick={() => deleteFromLibrary(plant.id)}>
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return null;
}
