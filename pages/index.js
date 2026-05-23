import { useState, useRef, useEffect, useCallback } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=Outfit:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #F7F9F5; --white: #FFFFFF; --green: #2D6A4F;
    --green-light: #52B788; --green-pale: #D8EDDF;
    --text: #1B2B22; --muted: #7A9586; --border: #DCE8DC;
    --shadow: rgba(45,106,79,0.12);
  }
  body { background: var(--bg); font-family: 'Outfit', sans-serif; color: var(--text); min-height: 100vh; }
  .home { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 3.5rem 2rem 4rem; }
  .home-top { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .logo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .logo-name { font-family: 'Fraunces', serif; font-weight: 600; font-size: 1.6rem; color: var(--green); letter-spacing: -0.02em; }
  .home-tagline { font-size: 0.88rem; color: var(--muted); font-weight: 300; }
  .home-center { display: flex; flex-direction: column; align-items: center; gap: 2.5rem; }
  .camera-circle { width: 200px; height: 200px; border-radius: 50%; background: var(--white); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 40px var(--shadow); position: relative; overflow: hidden; cursor: pointer; transition: all 0.3s ease; }
  .camera-circle:hover { box-shadow: 0 12px 50px rgba(45,106,79,0.2); border-color: var(--green-light); transform: scale(1.02); }
  .camera-circle video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .camera-circle canvas { display: none; }
  .camera-icon-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; z-index: 2; }
  .camera-hint { font-size: 0.75rem; color: var(--muted); text-align: center; line-height: 1.4; }
  .snap-btn { background: var(--green); color: white; border: none; padding: 1rem 2.5rem; border-radius: 50px; font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; box-shadow: 0 4px 20px var(--shadow); transition: all 0.25s ease; }
  .snap-btn:hover { background: #235C42; transform: translateY(-2px); }
  .gallery-link { font-size: 0.82rem; color: var(--muted); cursor: pointer; display: flex; align-items: center; gap: 0.3rem; position: relative; }
  .gallery-link input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .analyzing { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; padding: 2rem; background: var(--bg); }
  .preview-ring { width: 190px; height: 190px; border-radius: 50%; overflow: hidden; border: 3px solid var(--green-light); box-shadow: 0 0 0 8px var(--green-pale), 0 12px 40px var(--shadow); animation: breathe 2s ease-in-out infinite; }
  @keyframes breathe { 0%,100% { box-shadow: 0 0 0 8px var(--green-pale), 0 12px 40px var(--shadow); } 50% { box-shadow: 0 0 0 14px var(--green-pale), 0 16px 50px rgba(45,106,79,0.18); } }
  .preview-ring img { width: 100%; height: 100%; object-fit: cover; }
  .analyzing-label { text-align: center; }
  .analyzing-label h2 { font-family: 'Fraunces', serif; font-size: 1.5rem; font-weight: 600; color: var(--green); margin-bottom: 0.3rem; }
  .analyzing-label p { font-size: 0.85rem; color: var(--muted); font-weight: 300; }
  .dots { display: flex; gap: 6px; }
  .dots span { width: 8px; height: 8px; background: var(--green-light); border-radius: 50%; animation: ldot 1.2s ease-in-out infinite; }
  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes ldot { 0%,80%,100% { transform: scale(0.5); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
  .result { min-height: 100vh; background: var(--bg); padding-bottom: 3rem; }
  .result-photo { width: 100%; height: 280px; object-fit: cover; display: block; }
  .result-header { background: var(--white); padding: 1.5rem 1.5rem 1.2rem; border-bottom: 1px solid var(--border); position: relative; }
  .result-back { position: absolute; top: 1rem; right: 1rem; background: var(--green-pale); border: none; border-radius: 20px; padding: 0.4rem 0.9rem; font-size: 0.78rem; color: var(--green); font-family: 'Outfit', sans-serif; font-weight: 500; cursor: pointer; }
  .result-name { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 600; color: var(--text); line-height: 1.1; margin-bottom: 0.3rem; }
  .result-latin { font-family: 'Fraunces', serif; font-style: italic; font-size: 0.95rem; color: var(--muted); font-weight: 300; }
  .result-body { padding: 1.2rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .health-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 30px; font-size: 0.85rem; font-weight: 500; width: fit-content; }
  .health-pill.bon { background: #E6F4EC; color: #1E6B3A; }
  .health-pill.attention { background: #FEF3C7; color: #92400E; }
  .health-pill.mauvais { background: #FEE2E2; color: #991B1B; }
  .hdot { width: 8px; height: 8px; border-radius: 50%; }
  .bon .hdot { background: #22C55E; }
  .attention .hdot { background: #F59E0B; }
  .mauvais .hdot { background: #EF4444; }
  .card { background: var(--white); border-radius: 16px; padding: 1.2rem; border: 1px solid var(--border); }
  .card-title { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 0.7rem; }
  .card-text { font-size: 0.9rem; line-height: 1.7; color: var(--text); font-weight: 300; }
  .care-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .care-item { background: var(--bg); border-radius: 10px; padding: 0.8rem; }
  .care-icon { font-size: 1.2rem; margin-bottom: 0.25rem; }
  .care-lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.2rem; }
  .care-val { font-size: 0.82rem; color: var(--text); line-height: 1.4; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .tag { background: var(--green-pale); color: var(--green); padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
  .tip-card { background: linear-gradient(135deg, #EAF5EE, #F7F9F5); border: 1px solid #C3DFC9; border-radius: 16px; padding: 1.2rem; }
  .error-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 1rem; }
  .error-screen h3 { font-family: 'Fraunces', serif; font-size: 1.4rem; color: var(--text); }
  .error-screen p { font-size: 0.88rem; color: var(--muted); line-height: 1.6; max-width: 260px; }
  .retry-btn { background: var(--green); color: white; border: none; padding: 0.9rem 2rem; border-radius: 30px; font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
`;

const SYSTEM_PROMPT = `Tu es un botaniste expert. Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) :
{"nom":"Nom commun","nom_latin":"Nom scientifique","famille":"Famille botanique","description":"Description en 2-3 phrases","caracteristiques":["car1","car2","car3"],"entretien":{"arrosage":"...","lumiere":"...","sol":"...","temperature":"..."},"sante":{"etat":"bon","commentaire":"..."},"conseils":"Un conseil pratique","utilisation":["util1","util2"]}
"etat" doit être exactement "bon", "attention", ou "mauvais".
Si pas une plante : {"erreur": "Ce n'est pas une plante"}`;

export default function PlanteInfini() {
  const [screen, setScreen] = useState("home");
  const [captured, setCaptured] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camReady, setCamReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
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
    if (screen === "home") startCamera();
    else stopCamera();
    return stopCamera;
  }, [screen]);

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
    } catch { setErrorMsg("Erreur d'analyse. Vérifie ta connexion."); setScreen("error"); }
  }, []);

  const takePhoto = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.88);
    analyze(dataUrl.split(",")[1], dataUrl);
  }, [analyze]);

  const fromGallery = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => analyze(e.target.result.split(",")[1], e.target.result);
    reader.readAsDataURL(file);
  }, [analyze]);

  const rescan = () => { setResult(null); setCaptured(null); setErrorMsg(""); setScreen("home"); };

  if (screen === "home") return (
    <>
      <style>{css}</style>
      <div className="home">
        <div className="home-top">
          <div className="logo">
            <span style={{fontSize:"1.6rem"}}>🌿</span>
            <span className="logo-name">Plante Infini</span>
          </div>
          <span className="home-tagline">Identifiez n'importe quelle plante</span>
        </div>
        <div className="home-center">
          <div className="camera-circle" onClick={camReady ? takePhoto : undefined}>
            {camReady ? (
              <><video ref={videoRef} autoPlay playsInline muted /><canvas ref={canvasRef} /></>
            ) : (
              <div className="camera-icon-wrap">
                <span style={{fontSize:"2.8rem"}}>📷</span>
                <span className="camera-hint">Autorisez la caméra<br/>ou importez une photo</span>
              </div>
            )}
          </div>
          <button className="snap-btn" onClick={camReady ? takePhoto : undefined}>
            <span>📸</span> Prendre une photo
          </button>
        </div>
        <label className="gallery-link">
          🖼️ Choisir depuis la galerie
          <input type="file" accept="image/*" onChange={e => fromGallery(e.target.files[0])} />
        </label>
      </div>
    </>
  );

  if (screen === "analyzing") return (
    <>
      <style>{css}</style>
      <div className="analyzing">
        <div className="preview-ring">{captured && <img src={captured} alt="" />}</div>
        <div className="analyzing-label">
          <h2>Analyse en cours…</h2>
          <p>Le botaniste examine votre plante</p>
        </div>
        <div className="dots"><span /><span /><span /></div>
      </div>
    </>
  );

  if (screen === "error") return (
    <>
      <style>{css}</style>
      <div className="error-screen">
        <span style={{fontSize:"3rem"}}>🍃</span>
        <h3>Non reconnu</h3>
        <p>{errorMsg}</p>
        <button className="retry-btn" onClick={rescan}>Réessayer</button>
      </div>
    </>
  );

  if (screen === "result" && result) return (
    <>
      <style>{css}</style>
      <div className="result">
        {captured && <img className="result-photo" src={captured} alt={result.nom} />}
        <div className="result-header">
          <button className="result-back" onClick={rescan}>📷 Nouveau scan</button>
          <div className="result-name">{result.nom}</div>
          {result.nom_latin && <div className="result-latin">{result.nom_latin}</div>}
        </div>
        <div className="result-body">
          {result.sante && (
            <span className={`health-pill ${result.sante.etat}`}>
              <span className="hdot" />{result.sante.commentaire}
            </span>
          )}
          {result.description && <div className="card"><div className="card-title">Description</div><div className="card-text">{result.description}</div></div>}
          {result.entretien && (
            <div className="card">
              <div className="card-title">Guide d'entretien</div>
              <div className="care-grid">
                {[{icon:"💧",lbl:"Arrosage",v:result.entretien.arrosage},{icon:"☀️",lbl:"Lumière",v:result.entretien.lumiere},{icon:"🪱",lbl:"Sol",v:result.entretien.sol},{icon:"🌡️",lbl:"Température",v:result.entretien.temperature}].filter(x=>x.v).map(({icon,lbl,v})=>(
                  <div key={lbl} className="care-item"><div className="care-icon">{icon}</div><div className="care-lbl">{lbl}</div><div className="care-val">{v}</div></div>
                ))}
              </div>
            </div>
          )}
          {result.conseils && <div className="tip-card"><div className="card-title">💡 Conseil du botaniste</div><div className="card-text">{result.conseils}</div></div>}
          {result.caracteristiques?.length > 0 && <div className="card"><div className="card-title">Caractéristiques</div><div className="tags">{result.caracteristiques.map((c,i)=><span key={i} className="tag">{c}</span>)}</div></div>}
          {result.utilisation?.length > 0 && <div className="card"><div className="card-title">Utilisations</div><div className="tags">{result.utilisation.map((u,i)=><span key={i} className="tag">{u}</span>)}</div></div>}
        </div>
      </div>
    </>
  );

  return null;
}
