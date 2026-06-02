import { useState, useRef, useEffect, useCallback } from "react";

const LIBRARY_KEY = "plante-infini-library";

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

export default function PlanteInfini() {
  const [screen, setScreen] = useState("home");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [library, setLibrary] = useState([]);
  const [savedNotice, setSavedNotice] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamReady(true);
    } catch { setCamReady(false); }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  useEffect(() => {
    if (screen === "home") startCamera();
    else stopCamera();
    return stopCamera;
  }, [screen]);

  const saveToLibrary = useCallback(() => {
    if (!captured || !result) return;
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

  const goHome = () => { setResult(null); setCaptured(null); setErrorMsg(""); setScreen("home"); };

  const analyze = useCallback(async (base64, imgSrc) => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      if (data.erreur) { setErrorMsg(data.erreur); setScreen("error"); }
      else { setResult(data); setScreen("result"); }
    } catch (e) { setErrorMsg("Erreur: " + e.message); setScreen("error"); }
  }, []);

  const takePhoto = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.5);
    analyze(dataUrl.split(",")[1], dataUrl);
  }, [analyze]);

  const fromGallery = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => analyze(e.target.result.split(",")[1], e.target.result);
    reader.readAsDataURL(file);
  }, [analyze]);

  const rescan = goHome;

  const s = {
    page: { minHeight: "100vh", fontFamily: "Georgia, serif", background: "#F7F9F5", color: "#1B2B22", display: "flex", flexDirection: "column", alignItems: "center" },
    home: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "3rem 2rem 4rem" },
    logo: { fontSize: "1.8rem", fontWeight: "bold", color: "#2D6A4F", marginBottom: "0.3rem" },
    tag: { fontSize: "0.9rem", color: "#7A9586" },
    circle: { width: 200, height: 200, borderRadius: "50%", background: "white", border: "2px solid #DCE8DC", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", boxShadow: "0 8px 40px rgba(45,106,79,0.12)", cursor: "pointer" },
    btn: { background: "#2D6A4F", color: "white", border: "none", padding: "1rem 2.5rem", borderRadius: "50px", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" },
    gallery: { fontSize: "0.85rem", color: "#7A9586", cursor: "pointer", position: "relative" },
    analyzing: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" },
    ring: { width: 190, height: 190, borderRadius: "50%", overflow: "hidden", border: "3px solid #52B788", boxShadow: "0 0 0 10px #D8EDDF" },
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
  };

  if (screen === "home") return (
    <div style={s.home}>
      <div style={{ textAlign: "center" }}>
        <div style={s.logo}>🌿 Plante Infini</div>
        <div style={s.tag}>Identifiez n'importe quelle plante</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
        <div style={s.circle} onClick={camReady ? takePhoto : undefined}>
          {camReady ? (
            <><video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /><canvas ref={canvasRef} style={{ display: "none" }} /></>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem" }}>📷</div>
              <div style={{ fontSize: "0.75rem", color: "#7A9586", marginTop: "0.5rem" }}>Autorisez la caméra</div>
            </div>
          )}
        </div>
        <button style={s.btn} onClick={camReady ? takePhoto : undefined}>📸 Prendre une photo</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <label style={s.gallery}>
          🖼️ Choisir depuis la galerie
          <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={e => fromGallery(e.target.files[0])} />
        </label>
        <button style={s.libBtn} onClick={() => setScreen("library")}>
          📚 Ma bibliothèque{library.length > 0 ? ` (${library.length})` : ""}
        </button>
      </div>
    </div>
  );

  if (screen === "analyzing") return (
    <div style={s.analyzing}>
      <div style={s.ring}>{captured && <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2D6A4F" }}>Analyse en cours…</div>
        <div style={{ fontSize: "0.85rem", color: "#7A9586" }}>Le botaniste examine votre plante</div>
      </div>
    </div>
  );

  if (screen === "error") return (
    <div style={s.error}>
      <div style={{ fontSize: "3rem" }}>🍃</div>
      <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>Non reconnu</div>
      <p style={{ color: "#7A9586" }}>{errorMsg}</p>
      <button style={s.btn} onClick={rescan}>Réessayer</button>
    </div>
  );

  if (screen === "result" && result) return (
    <div style={s.result}>
      {captured && <img style={s.photo} src={captured} alt={result.nom} />}
      <div style={s.header}>
        <button style={s.backBtn} onClick={rescan}>📷 Nouveau scan</button>
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
              {[{i:"💧",l:"Arrosage",v:result.entretien.arrosage},{i:"☀️",l:"Lumière",v:result.entretien.lumiere},{i:"🪱",l:"Sol",v:result.entretien.sol},{i:"🌡️",l:"Température",v:result.entretien.temperature}].filter(x=>x.v).map(({i,l,v})=>(
                <div key={l} style={s.gridItem}><div style={{fontSize:"1.2rem"}}>{i}</div><div style={{fontSize:"0.65rem",color:"#7A9586",textTransform:"uppercase"}}>{l}</div><div style={{fontSize:"0.82rem"}}>{v}</div></div>
              ))}
            </div>
          </div>
        )}
        {result.conseils && <div style={s.tip}><div style={s.cardTitle}>💡 Conseil du botaniste</div><div style={s.cardText}>{result.conseils}</div></div>}
        {result.caracteristiques?.length > 0 && <div style={s.card}><div style={s.cardTitle}>Caractéristiques</div><div style={s.tags}>{result.caracteristiques.map((c,i)=><span key={i} style={s.tagItem}>{c}</span>)}</div></div>}
        {result.utilisation?.length > 0 && <div style={s.card}><div style={s.cardTitle}>Utilisations</div><div style={s.tags}>{result.utilisation.map((u,i)=><span key={i} style={s.tagItem}>{u}</span>)}</div></div>}
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
