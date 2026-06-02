import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const DISCOVERIES_KEY = "wilder-discoveries";
const ALBUMS_KEY = "wilder-albums";

const RARITY_LABELS = {
  commun: "Commun",
  peu_commun: "Peu commun",
  rare: "Rare",
  tres_rare: "Très rare",
};

const TYPE_LABELS = {
  plante: "Plante",
  animal: "Animal",
  insecte: "Insecte",
  oiseau: "Oiseau",
  champignon: "Champignon",
  fleur: "Fleur",
  arbre: "Arbre",
  fruit: "Fruit",
  legume: "Légume",
  reptile: "Reptile",
  papillon: "Papillon",
};

const DISCOVERY_MARQUEE =
  "Plantes • Animaux • Champignons • Fleurs • Insectes • Oiseaux • Arbres • Fruits • Légumes • Reptiles • Papillons • ";

const DEFAULT_SLOGAN = "Explore the wild around you";

const SLOGAN_BY_LANG = {
  fr: "Explorez la nature sauvage autour de vous",
  es: "Explora la naturaleza salvaje a tu alrededor",
  it: "Esplora la natura selvaggia intorno a te",
  de: "Entdecke die wilde Natur um dich herum",
  pt: "Explore a natureza selvagem ao seu redor",
  en: DEFAULT_SLOGAN,
};

function getSloganFromNavigatorLanguage(language) {
  const code = (language || "en").split("-")[0].toLowerCase();
  return SLOGAN_BY_LANG[code] || DEFAULT_SLOGAN;
}

function loadDiscoveries() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISCOVERIES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDiscoveries(items) {
  localStorage.setItem(DISCOVERIES_KEY, JSON.stringify(items));
}

function loadAlbums() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALBUMS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAlbums(items) {
  localStorage.setItem(ALBUMS_KEY, JSON.stringify(items));
}

function formatDate(iso) {
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

function defaultAlbumName() {
  const d = new Date();
  return `Album du ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatLocation(discovery) {
  if (discovery?.placeName) return discovery.placeName;
  if (discovery?.latitude != null && discovery?.longitude != null) {
    return `${discovery.latitude.toFixed(4)}°, ${discovery.longitude.toFixed(4)}°`;
  }
  return null;
}

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let placeName = null;
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            placeName = data.placeName || null;
          }
        } catch {
          /* ignore */
        }
        resolve({ latitude, longitude, placeName });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
    );
  });
}

function computeStats(items) {
  const uniqueSpecies = new Set(
    items.map((d) => (d.nom_latin || d.nom || "").toLowerCase()).filter(Boolean)
  );
  const rareCount = items.filter(
    (d) => d.rarete === "rare" || d.rarete === "tres_rare"
  ).length;
  const byType = {};
  items.forEach((d) => {
    const t = d.type || "plante";
    byType[t] = (byType[t] || 0) + 1;
  });
  const byRarity = { commun: 0, peu_commun: 0, rare: 0, tres_rare: 0 };
  items.forEach((d) => {
    const r = d.rarete in byRarity ? d.rarete : "commun";
    byRarity[r]++;
  });
  const now = new Date();
  const thisMonth = items.filter((d) => {
    const date = new Date(d.discoveredAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  return {
    total: items.length,
    uniqueSpecies: uniqueSpecies.size,
    rareCount,
    byType,
    byRarity,
    thisMonth,
  };
}

/* ── Icons ── */

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
      <path
        d="M32 48c3-6 8-10 14-12M48 36c4 2 7 6 8 12"
        stroke="#F5F2EB"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <ellipse cx="34" cy="38" rx="5" ry="6" fill="#E07A3A" opacity="0.9" transform="rotate(-25 34 38)" />
      <circle cx="33" cy="36" r="1.2" fill="#F5F2EB" />
      <circle cx="35" cy="40" r="1.2" fill="#F5F2EB" />
      <circle cx="37" cy="37" r="1.2" fill="#F5F2EB" />
      <path
        d="M52 28c-4 6-6 14-4 22 2-10 8-16 16-18"
        fill="#2D5A45"
        stroke="#F5F2EB"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M50 26c2-4 6-6 10-4" stroke="#F5F2EB" strokeWidth="1.2" strokeLinecap="round" />
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

function RarityBadge({ rarete }) {
  const key = rarete in RARITY_LABELS ? rarete : "commun";
  return (
    <span className={`rarity-badge rarity-${key}`}>
      ◆ {RARITY_LABELS[key]}
    </span>
  );
}

function LocationCard({ discovery }) {
  const label = formatLocation(discovery);
  if (!label) return null;
  const mapUrl =
    discovery.latitude != null && discovery.longitude != null
      ? `https://maps.apple.com/?ll=${discovery.latitude},${discovery.longitude}&q=${encodeURIComponent(discovery.nom || "Découverte")}`
      : null;

  return (
    <div className="result-card">
      <div className="result-card-title">Lieu de découverte</div>
      <div className="location-card">
        <IconLocation className="location-card-icon" size={18} color="#F4A261" />
        <div>
          <p className="result-card-text">{label}</p>
          {mapUrl && (
            <a
              className="location-map-link"
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir sur la carte →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DiscoveryBody({ data, discovery, showNewBadge, children }) {
  return (
    <>
      {showNewBadge && <span className="discovery-new-badge">Nouvelle découverte !</span>}
      <h1 className="discovery-name">{data.nom}</h1>
      {data.nom_latin && <p className="discovery-latin">{data.nom_latin}</p>}

      {data.type && (
        <span className="discovery-type-chip">
          {TYPE_LABELS[data.type] || data.type}
        </span>
      )}

      <RarityBadge rarete={data.rarete} />

      {data.description && (
        <div className="result-card">
          <div className="result-card-title">Description</div>
          <p className="result-card-text">{data.description}</p>
        </div>
      )}

      {data.habitat && (
        <div className="result-card">
          <div className="result-card-title">Habitat naturel</div>
          <p className="result-card-text">{data.habitat}</p>
        </div>
      )}

      {data.etat_sante && (
        <div className="result-card">
          <div className="result-card-title">État de santé</div>
          <p className="result-card-text">{data.etat_sante}</p>
        </div>
      )}

      {discovery && <LocationCard discovery={discovery} />}

      {children}
    </>
  );
}

function AlbumPickerModal({ albums, onSelect, onCreate, onClose }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    const name = newName.trim() || defaultAlbumName();
    onCreate(name);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Ajouter à un album</h2>
        {albums.map((a) => (
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
                {a.discoveryIds.length} découverte{a.discoveryIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        ))}
        {creating ? (
          <>
            <input
              className="modal-input"
              placeholder={defaultAlbumName()}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={handleCreate}>
                Créer
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn-create-album" onClick={() => setCreating(true)}>
            <IconPlus size={18} /> Nouvel album
          </button>
        )}
      </div>
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
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [savedToAlbum, setSavedToAlbum] = useState(false);
  const [pokedexAnim, setPokedexAnim] = useState(true);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [slogan, setSlogan] = useState(DEFAULT_SLOGAN);
  const [camError, setCamError] = useState("");
  const [viewingDiscovery, setViewingDiscovery] = useState(null);
  const [returnScreen, setReturnScreen] = useState("albums");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setSlogan(getSloganFromNavigatorLanguage(navigator.language));
  }, []);

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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Votre navigateur ne supporte pas la caméra.");
      return;
    }

    const constraints = [
      { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      { facingMode: "environment" },
      true,
    ];

    let stream = null;
    for (const video of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        break;
      } catch {
        /* next */
      }
    }

    if (!stream) {
      setCamError("Accès à la caméra refusé ou indisponible. Utilisez la galerie ou autorisez la caméra dans les réglages.");
      return;
    }
    streamRef.current = stream;
    setCamReady(true);
    await attachStreamToVideo();
  }, [attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  useEffect(() => {
    setDiscoveries(loadDiscoveries());
    setAlbums(loadAlbums());
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
      setPokedexAnim(true);
      const t = setTimeout(() => setPokedexAnim(false), 900);
      return () => clearTimeout(t);
    }
  }, [screen, result?.nom]);

  const goHome = () => {
    setResult(null);
    setCaptured(null);
    setCurrentDiscovery(null);
    setErrorMsg("");
    setSavedToAlbum(false);
    setShowAlbumPicker(false);
    setScreen("home");
  };

  const analyze = useCallback(async (base64, imgSrc) => {
    setCaptured(imgSrc);
    setScreen("analyzing");
    try {
      const [res, location] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        }),
        getCurrentLocation(),
      ]);

      const data = await res.json();
      if (!res.ok || data.erreur) {
        setErrorMsg(data.erreur || "Erreur lors de l'analyse");
        setScreen("error");
        return;
      }

      const discovery = {
        id: generateId(),
        photo: imgSrc,
        nom: data.nom,
        nom_latin: data.nom_latin || "",
        type: data.type || "plante",
        description: data.description || "",
        habitat: data.habitat || "",
        rarete: data.rarete || "commun",
        etat_sante: data.etat_sante || "",
        discoveredAt: new Date().toISOString(),
        ...(location || {}),
      };

      const updated = [discovery, ...loadDiscoveries()];
      saveDiscoveries(updated);
      setDiscoveries(updated);
      setCurrentDiscovery(discovery);
      setResult(data);
      setScreen("result");
    } catch (e) {
      setErrorMsg("Erreur: " + e.message);
      setScreen("error");
    }
  }, []);

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
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    handleCapturedImage(c.toDataURL("image/jpeg", 0.85));
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

  const addToAlbum = (albumId) => {
    if (!currentDiscovery) return;
    const allAlbums = loadAlbums();
    const idx = allAlbums.findIndex((a) => a.id === albumId);
    if (idx === -1) return;

    const album = allAlbums[idx];
    if (!album.discoveryIds.includes(currentDiscovery.id)) {
      album.discoveryIds = [currentDiscovery.id, ...album.discoveryIds];
      if (!album.coverPhoto) album.coverPhoto = currentDiscovery.photo;
      allAlbums[idx] = album;
      saveAlbums(allAlbums);
      setAlbums(allAlbums);
    }
    setShowAlbumPicker(false);
    setSavedToAlbum(true);
  };

  const createAlbum = (name) => {
    if (!currentDiscovery) return;
    const album = {
      id: generateId(),
      name: name.trim() || defaultAlbumName(),
      createdAt: new Date().toISOString(),
      coverPhoto: currentDiscovery.photo,
      discoveryIds: [currentDiscovery.id],
    };
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setShowAlbumPicker(false);
    setSavedToAlbum(true);
  };

  const createAlbumFromList = () => {
    const name = newAlbumName.trim() || defaultAlbumName();
    const album = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      coverPhoto: null,
      discoveryIds: [],
    };
    const updated = [album, ...loadAlbums()];
    saveAlbums(updated);
    setAlbums(updated);
    setNewAlbumName("");
    setCreatingAlbum(false);
  };

  const getAlbumDiscoveries = (album) => {
    const ids = new Set(album.discoveryIds);
    return loadDiscoveries()
      .filter((d) => ids.has(d.id))
      .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const stats = computeStats(discoveries);

  const pageTitle = `Wilder — ${slogan}`;

  /* ── HOME ── */
  if (screen === "home") {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={slogan} />
        </Head>
        <div className="wilder-home screen-enter">
          <div className="wilder-home-bg" />
          <div className="wilder-home-overlay" />
          <FallingLeaves />
          <div className="wilder-home-content">
            <div className="wilder-logo-wrap stagger-1">
              <IconWilderLogo />
              <h1 className="wilder-logo-title">Wilder</h1>
              <p className="wilder-logo-slogan">{slogan}</p>
            </div>

            <div className="discovery-counter stagger-2">
              <span className="discovery-counter-num">{discoveries.length}</span>
              <span>découverte{discoveries.length !== 1 ? "s" : ""}</span>
              {stats.rareCount > 0 && (
                <span className="discovery-counter-rare">
                  ◆ {stats.rareCount} rare{stats.rareCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <button type="button" className="btn-scanner stagger-2" onClick={() => setScreen("camera")}>
              <span className="btn-scanner-icon">
                <IconCamera size={32} color="white" />
              </span>
              Découvrir
            </button>

            <div className="discovery-marquee stagger-2" aria-hidden="true">
              <div className="discovery-marquee-track">
                <span>{DISCOVERY_MARQUEE}{DISCOVERY_MARQUEE}</span>
              </div>
            </div>

            <div className="home-nav-row stagger-3">
              <button type="button" className="btn-albums" onClick={() => setScreen("albums")}>
                <IconAlbums size={20} />
                Albums
              </button>
              <button type="button" className="btn-stats" onClick={() => setScreen("stats")}>
                <IconStats size={20} />
                Stats
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── SCANNER ── */
  if (screen === "camera") {
    return (
      <>
        <Head><title>Scanner — Wilder</title></Head>
        <div className="scanner-screen screen-enter-fast">
          <div className="scanner-video-wrap">
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
              <button type="button" className="scanner-back" onClick={goHome} aria-label="Retour">
                <IconBack size={20} color="white" />
              </button>
            </div>

            <div className="scanner-center">
              {camReady && <Viewfinder />}
            </div>

            <p className="scanner-hint">
              Pointe vers un animal, une plante, un insecte, un oiseau ou un champignon…
            </p>

            <div className="scanner-bottom">
              <div className="scanner-controls">
                <label className="gallery-btn">
                  <div className="gallery-btn-icon">
                    <IconAlbums size={20} color="white" />
                  </div>
                  Galerie
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
                  aria-label="Capturer"
                >
                  <div className="capture-btn-inner" />
                </button>

                <div style={{ width: 44 }} />
              </div>
            </div>
          </div>

          {!camReady && (
            <div className="camera-error-overlay">
              <div style={{ animation: "pulseGlow 2s ease-in-out infinite" }}>
                <IconCamera size={48} color="#E07A3A" />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.5 }}>
                {camError || "Autorisez l\u2019accès à la caméra"}
              </p>
              {camError && (
                <button type="button" className="btn-primary" onClick={startCamera}>
                  Réessayer
                </button>
              )}
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
        <div className="analyze-screen screen-enter-fast">
          <div className="analyze-ring">
            <div className="analyze-ring-inner">
              {captured && <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.4rem" }}>
              Identification…
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              La nature révèle ses secrets
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ── ERROR ── */
  if (screen === "error") {
    return (
      <>
        <Head><title>Non reconnu — Wilder</title></Head>
        <div
          className="analyze-screen screen-enter"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.75rem" }}>
            Pas de découverte
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 300, lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {errorMsg}
          </p>
          <button type="button" className="btn-primary" onClick={() => setScreen("camera")}>
            Réessayer
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
            <button
              type="button"
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem" }}
              onClick={goHome}
            >
              <IconBack size={16} /> Accueil
            </button>

            <DiscoveryBody data={result} discovery={currentDiscovery} showNewBadge>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={() => !savedToAlbum && setShowAlbumPicker(true)}
                disabled={savedToAlbum}
              >
                {savedToAlbum ? "✓ Ajouté à l'album" : "Ajouter à un album"}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={() => setScreen("camera")}
              >
                Scanner à nouveau
              </button>
            </DiscoveryBody>
          </div>

          {showAlbumPicker && (
            <AlbumPickerModal
              albums={albums}
              onSelect={addToAlbum}
              onCreate={createAlbum}
              onClose={() => setShowAlbumPicker(false)}
            />
          )}
        </div>
      </>
    );
  }

  /* ── ALBUM DETAIL ── */
  if (screen === "album-detail" && selectedAlbum) {
    const items = getAlbumDiscoveries(selectedAlbum);
    return (
      <>
        <Head>
          <title>{selectedAlbum.name} — Wilder</title>
        </Head>
        <div className="albums-screen screen-enter-fast">
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
                setScreen("albums");
              }}
              aria-label="Retour"
            >
              <IconBack size={20} color="white" />
            </button>
            <div className="album-detail-title-wrap">
              <h1>{selectedAlbum.name}</h1>
              <p>
                {items.length} découverte{items.length !== 1 ? "s" : ""} · {formatDate(selectedAlbum.createdAt)}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="albums-empty">
              <p>Cet album est vide. Scannez la nature et ajoutez vos découvertes ici.</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setScreen("camera")}
              >
                Scanner
              </button>
            </div>
          ) : (
            <div className="discovery-grid">
              {items.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="discovery-item"
                  onClick={() => {
                    setViewingDiscovery(d);
                    setReturnScreen("album-detail");
                    setScreen("discovery-detail");
                  }}
                >
                  <img src={d.photo} alt={d.nom} />
                  <div className="discovery-item-info">
                    <h4>{d.nom}</h4>
                    <p>{d.nom_latin}</p>
                    {(d.rarete === "rare" || d.rarete === "tres_rare") && (
                      <span className={`discovery-item-rarity rarity-${d.rarete}`}>
                        {RARITY_LABELS[d.rarete]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
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
      description: d.description,
      habitat: d.habitat,
      rarete: d.rarete,
      etat_sante: d.etat_sante,
    };

    return (
      <>
        <Head>
          <title>{d.nom} — Wilder</title>
        </Head>
        <div className="discovery-screen screen-enter-fast">
          <div className="discovery-hero">
            <img src={d.photo} alt={d.nom} />
          </div>

          <div className="discovery-body">
            <button
              type="button"
              className="btn-secondary"
              style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem" }}
              onClick={() => {
                setViewingDiscovery(null);
                setScreen(returnScreen);
              }}
            >
              <IconBack size={16} /> Retour
            </button>

            <DiscoveryBody data={data} discovery={d} showNewBadge={false}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Découvert le {formatDate(d.discoveredAt)}
              </p>
            </DiscoveryBody>
          </div>
        </div>
      </>
    );
  }

  /* ── STATS ── */
  if (screen === "stats") {
    const typeEntries = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
    const maxTypeCount = typeEntries[0]?.[1] || 1;

    return (
      <>
        <Head>
          <title>Mes Stats — Wilder</title>
        </Head>
        <div className="stats-screen screen-enter">
          <div className="albums-header">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
              onClick={goHome}
              aria-label="Retour"
            >
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">Mes Stats</h1>
          </div>

          <div className="stats-hero">
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Votre aventure nature en chiffres
            </p>
            <div className="stats-hero-grid">
              <div className="stat-card stat-card-highlight">
                <span className="stat-card-num">{stats.total}</span>
                <span className="stat-card-label">Découvertes</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.uniqueSpecies}</span>
                <span className="stat-card-label">Espèces uniques</span>
              </div>
              <div className="stat-card stat-card-highlight">
                <span className="stat-card-num">{stats.rareCount}</span>
                <span className="stat-card-label">Espèces rares</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-num">{stats.thisMonth}</span>
                <span className="stat-card-label">Ce mois-ci</span>
              </div>
            </div>
          </div>

          {typeEntries.length > 0 && (
            <div className="stats-section">
              <h2 className="stats-section-title">Par catégorie</h2>
              {typeEntries.map(([type, count]) => (
                <div key={type} className="stat-bar-row">
                  <span className="stat-bar-label">{TYPE_LABELS[type] || type}</span>
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
            <h2 className="stats-section-title">Par rareté</h2>
            <div className="rarity-stats-grid">
              {Object.entries(RARITY_LABELS).map(([key, label]) => (
                <div key={key} className={`rarity-stat-pill rarity-${key}`}>
                  <span>{label}</span>
                  <strong>{stats.byRarity[key] || 0}</strong>
                </div>
              ))}
            </div>
          </div>

          {stats.total === 0 && (
            <div className="albums-empty">
              <p>Scannez votre première découverte pour voir vos stats !</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setScreen("camera")}
              >
                Découvrir
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── ALBUMS LIST ── */
  if (screen === "albums") {
    const sortedAlbums = [...albums].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return (
      <>
        <Head>
          <title>Mes Albums — Wilder</title>
        </Head>
        <div className="albums-screen screen-enter">
          <div className="albums-header">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
              onClick={goHome}
              aria-label="Retour"
            >
              <IconBack size={18} />
            </button>
            <h1 className="albums-title">Mes Albums</h1>
          </div>

          <div className="albums-list">
            {sortedAlbums.length === 0 && !creatingAlbum ? (
              <div className="albums-empty">
                <IconAlbums size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                <p>Aucun album pour l&apos;instant.</p>
                <p className="album-examples">
                  Ex. : Vacances Paris, Balade forêt, Jardin maison
                </p>
              </div>
            ) : (
              sortedAlbums.map((album) => {
                const count = album.discoveryIds.length;
                return (
                  <button
                    key={album.id}
                    type="button"
                    className="album-card"
                    onClick={() => {
                      setSelectedAlbumId(album.id);
                      setScreen("album-detail");
                    }}
                  >
                    {album.coverPhoto ? (
                      <img src={album.coverPhoto} alt="" className="album-cover" />
                    ) : (
                      <div className="album-cover album-cover-placeholder">
                        <IconAlbums size={28} />
                      </div>
                    )}
                    <div className="album-info">
                      <h3>{album.name}</h3>
                      <p>
                        {count} découverte{count !== 1 ? "s" : ""} · {formatDate(album.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}

            {creatingAlbum ? (
              <>
                <input
                  className="modal-input"
                  placeholder={defaultAlbumName()}
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setCreatingAlbum(false)}>
                    Annuler
                  </button>
                  <button type="button" className="btn-primary" onClick={createAlbumFromList}>
                    Créer
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn-create-album" onClick={() => setCreatingAlbum(true)}>
                <IconPlus size={18} /> Créer un album
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
}
