import { useCallback, useEffect, useState } from "react";
import Head from "next/head";

function formatNum(n) {
  return new Intl.NumberFormat("fr-FR").format(n ?? 0);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatDelay(hours) {
  if (hours == null || !Number.isFinite(hours)) return "—";
  if (hours < 1) return "< 1 h";
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} j`;
}

function LinksChart({ series }) {
  const data = series?.length ? series : [];
  const width = 320;
  const height = 140;
  const padX = 6;
  const padY = 10;
  const max = Math.max(1, ...data.map((d) => Math.max(d.sent, d.filled)));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.max(2, slot * 0.38);
  const h = (v) => (v / max) * innerH;

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Liens envoyés et briefs remplis par jour">
        <line x1={padX} x2={width - padX} y1={padY + innerH} y2={padY + innerH} stroke="rgba(27,61,47,0.15)" strokeWidth="1" />
        {data.map((d, i) => {
          const x0 = padX + i * slot + slot * 0.1;
          return (
            <g key={d.date}>
              {d.sent > 0 && (
                <rect x={x0} y={padY + innerH - h(d.sent)} width={barW} height={h(d.sent)} rx="1.5" fill="#9db89a">
                  <title>{`${d.date} : ${d.sent} envoyé(s)`}</title>
                </rect>
              )}
              {d.filled > 0 && (
                <rect x={x0 + barW + 1} y={padY + innerH - h(d.filled)} width={barW} height={h(d.filled)} rx="1.5" fill="#1b3d2f">
                  <title>{`${d.date} : ${d.filled} rempli(s)`}</title>
                </rect>
              )}
            </g>
          );
        })}
      </svg>
      {data.length > 0 && (
        <div className="admin-chart-labels">
          <span>{data[0].date.slice(5)}</span>
          <span>
            <span style={{ color: "#6f8f6c" }}>■ envoyés</span>{" "}
            <span style={{ color: "#1b3d2f" }}>■ remplis</span>
          </span>
          <span>{data[data.length - 1].date.slice(5)}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, wide }) {
  return (
    <div className={`admin-card${wide ? " admin-card--wide" : ""}`}>
      <span className="admin-card-label">{label}</span>
      <span className="admin-card-value">{value}</span>
      {sub && <span className="admin-card-sub">{sub}</span>}
    </div>
  );
}

function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Mot de passe incorrect");
        return;
      }
      onSuccess();
    } catch {
      setError("Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h1>Sevya Admin</h1>
      <p>Accès réservé</p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoComplete="current-password"
          required
        />
        {error && <p className="admin-login-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Vérification…" : "Entrer"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          onLogout();
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (res.ok) setStats(body);
        else setStats((prev) => ({ ...(prev || {}), globalError: body.message || `Erreur ${res.status}` }));
      } catch (e) {
        console.error("[Sevya] admin load:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onLogout]
  );

  useEffect(() => {
    loadStats();
    const id = setInterval(() => loadStats(true), 60000);
    return () => clearInterval(id);
  }, [loadStats]);

  if (loading && !stats) {
    return <p className="admin-loading">Chargement des statistiques…</p>;
  }

  const L = stats?.links;
  const A = stats?.accounts;

  return (
    <>
      <header className="admin-header">
        <h1>Sevya Admin</h1>
        <div className="admin-header-actions">
          <button type="button" className="admin-refresh" onClick={() => loadStats(true)} disabled={refreshing}>
            {refreshing ? "…" : "Actualiser"}
          </button>
          <button type="button" className="admin-logout" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {stats?.generatedAt && (
        <p className="admin-updated">Mis à jour : {new Date(stats.generatedAt).toLocaleString("fr-FR")}</p>
      )}

      {stats?.globalError && <p className="admin-notice admin-notice--error">{stats.globalError}</p>}

      {stats?.errors?.length > 0 && (
        <div className="admin-notice admin-notice--error">
          {stats.errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}

      {L && (
        <>
          <section className="admin-section" aria-label="Liens clients">
            <h2>Liens clients</h2>
            <div className="admin-grid">
              <StatCard label="Envoyés" value={formatNum(L.sent)} sub={`${formatNum(L.last7)} sur 7 jours`} />
              <StatCard label="Ouverts" value={`${L.openRate} %`} sub={`${formatNum(L.opened)} liens`} />
              <StatCard label="Remplis" value={`${L.fillRate} %`} sub={`${formatNum(L.filled)} briefs · ${formatNum(L.filled7)} sur 7 j`} />
              <StatCard label="RDV planifiés" value={formatNum(L.appointments)} />
              <StatCard label="Délai de réponse" value={formatDelay(L.medianResponseHours)} sub="médian, envoi → brief rempli" />
              <StatCard
                label="Chantiers"
                value={`${formatNum(L.won)} gagné${L.won > 1 ? "s" : ""}`}
                sub={`${formatNum(L.lost)} perdu${L.lost > 1 ? "s" : ""} · ${formatNum(L.proposal)} proposition${L.proposal > 1 ? "s" : ""} en cours`}
              />
            </div>
          </section>

          <section className="admin-section" aria-label="Graphique liens">
            <h2>30 derniers jours</h2>
            <LinksChart series={L.dailySeries} />
          </section>

          <section className="admin-section" aria-label="Paysagistes">
            <h2>Paysagistes ({formatNum(stats.studios?.length)})</h2>
            {stats.inactiveStudios > 0 && (
              <p className="admin-notice">
                {stats.inactiveStudios === 1
                  ? "1 paysagiste n'a envoyé aucun lien depuis 7 jours : appelle-le."
                  : `${stats.inactiveStudios} paysagistes n'ont envoyé aucun lien depuis 7 jours : appelle-les.`}
              </p>
            )}
            {stats.studios?.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Studio</th>
                      <th>Envoyés</th>
                      <th>Ouverts</th>
                      <th>Remplis</th>
                      <th>RDV</th>
                      <th>Gagnés</th>
                      <th>Délai</th>
                      <th>Dernier lien</th>
                      <th>Inscrit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.studios.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                          {s.inactive && <span className="admin-badge-inactive">inactif 7 j</span>}
                          <span className="admin-table-sub">{[s.contact, s.email].filter(Boolean).join(" · ")}</span>
                        </td>
                        <td>{s.sent}</td>
                        <td>{s.opened}</td>
                        <td>{s.filled}</td>
                        <td>{s.appointments}</td>
                        <td>{s.won}</td>
                        <td>{formatDelay(s.medianResponseHours)}</td>
                        <td>{formatDate(s.lastLinkAt)}</td>
                        <td>{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">Aucun studio pour l&apos;instant.</p>
            )}
          </section>

          <section className="admin-section" aria-label="Comptes">
            <h2>Comptes et particuliers</h2>
            <div className="admin-grid">
              <StatCard label="Comptes" value={formatNum(A.total)} sub={`${formatNum(A.last7Days)} sur 7 jours`} />
              <StatCard label="Studios pro" value={formatNum(A.pros)} />
              <StatCard label="Dossiers jardin" value={formatNum(A.dossiers)} />
              <StatCard label="Coups de cœur" value={formatNum(A.favorites)} />
            </div>
          </section>

          <section className="admin-section" aria-label="Analyses IA">
            <h2>Analyses IA</h2>
            <div className="admin-grid">
              <StatCard label="Aujourd'hui" value={formatNum(stats.ai?.today)} />
              <StatCard label="7 jours" value={formatNum(stats.ai?.last7Days)} sub={`${formatNum(stats.ai?.users7)} compte(s)`} />
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function AdminPage() {
  const [state, setState] = useState("loading");
  const [configured, setConfigured] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      setConfigured(data.configured !== false);
      setState(data.authenticated ? "dashboard" : "login");
    } catch {
      setState("login");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setState("login");
  };

  return (
    <>
      <Head>
        <title>Sevya Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="admin-root">
        {!configured ? (
          <div className="admin-login">
            <h1>Sevya Admin</h1>
            <p className="admin-login-error">ADMIN_PASSWORD non configuré sur le serveur.</p>
          </div>
        ) : state === "loading" ? (
          <p className="admin-loading">Chargement…</p>
        ) : state === "login" ? (
          <AdminLogin onSuccess={() => setState("dashboard")} />
        ) : (
          <AdminDashboard onLogout={logout} />
        )}
      </div>
    </>
  );
}
