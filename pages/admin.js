import { useCallback, useEffect, useState } from "react";
import Head from "next/head";

function formatNum(n) {
  return new Intl.NumberFormat("fr-FR").format(n ?? 0);
}

function formatMoney(amount, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function ScanChart({ series }) {
  const data = series?.length ? series : [];
  const width = 320;
  const height = 140;
  const padX = 8;
  const padY = 12;
  const max = Math.max(1, ...data.map((d) => d.count));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padY + innerH - (d.count / max) * innerH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scans par jour">
        {[0, 0.5, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(27,61,47,0.08)"
              strokeWidth="1"
            />
          );
        })}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#5ba85c"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />
        )}
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3" fill="#1b3d2f" />
        ))}
      </svg>
      {data.length > 0 && (
        <div className="admin-chart-labels">
          <span>{data[0].date.slice(5)}</span>
          <span>{data[data.length - 1].date.slice(5)}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, error, wide }) {
  return (
    <div className={`admin-card${wide ? " admin-card--wide" : ""}${error ? " admin-card--error" : ""}`}>
      <span className="admin-card-label">{label}</span>
      {error ? (
        <>
          <span className="admin-card-value admin-card-value--muted">—</span>
          <span className="admin-card-error">{error}</span>
        </>
      ) : (
        <>
          <span className="admin-card-value">{value}</span>
          {sub && <span className="admin-card-sub">{sub}</span>}
        </>
      )}
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
      <h1>Wilder Admin</h1>
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

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        setStats(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setStats((prev) => ({
          ...(prev || {}),
          globalError: body.message || `Erreur ${res.status} lors du chargement`,
        }));
      }
    } catch (e) {
      console.error("[Wilder] admin load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

  useEffect(() => {
    loadStats();
    const id = setInterval(() => loadStats(true), 30000);
    return () => clearInterval(id);
  }, [loadStats]);

  if (loading && !stats) {
    return <p className="admin-loading">Chargement des statistiques…</p>;
  }

  const currency = stats?.revenue?.currency || "eur";

  return (
    <>
      <header className="admin-header">
        <h1>Wilder Admin</h1>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-refresh"
            onClick={() => loadStats(true)}
            disabled={refreshing}
          >
            {refreshing ? "…" : "Actualiser"}
          </button>
          <button type="button" className="admin-logout" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {stats?.generatedAt && (
        <p className="admin-updated">
          Mis à jour : {new Date(stats.generatedAt).toLocaleString("fr-FR")}
        </p>
      )}

      {stats?.globalError && (
        <p className="admin-notice admin-notice--error">{stats.globalError}</p>
      )}

      {stats?.meta?.supabase?.error && (
        <p className="admin-notice admin-notice--error">
          Supabase : {stats.meta.supabase.error}
        </p>
      )}

      {stats?.scans?.logsTableMissing && !stats?.scans?.error && (
        <p className="admin-notice">
          Table <code>scan_logs</code> absente — exécutez le SQL ci-dessous dans Supabase.
          Les totaux scans / visiteurs utilisent la table <code>scan_counts</code> (quota paywall).
        </p>
      )}

      <section className="admin-section" aria-label="Scans">
        <h2>Scans</h2>
        <div className="admin-grid">
          <StatCard
            label="Aujourd'hui"
            value={formatNum(stats?.scans?.today)}
            error={stats?.scans?.errors?.period}
          />
          <StatCard
            label="7 jours"
            value={formatNum(stats?.scans?.last7Days)}
            error={stats?.scans?.errors?.period}
          />
          <StatCard
            label="30 jours"
            value={formatNum(stats?.scans?.last30Days)}
            error={stats?.scans?.errors?.period}
          />
          <StatCard
            label="Total"
            value={formatNum(stats?.scans?.total)}
            error={stats?.scans?.errors?.total}
          />
        </div>
      </section>

      <section className="admin-section" aria-label="Audience">
        <h2>Audience & comptes</h2>
        <div className="admin-grid">
          <StatCard
            label="Visiteurs uniques"
            value={formatNum(stats?.visitors?.unique)}
            error={stats?.visitors?.error}
          />
          <StatCard
            label="Comptes créés"
            value={formatNum(stats?.accounts?.total)}
            error={stats?.accounts?.error}
          />
          <StatCard
            label="Comptes (7 j)"
            value={formatNum(stats?.accounts?.last7Days)}
            error={stats?.accounts?.error}
          />
          <StatCard
            label="Conversion paywall"
            value={stats?.conversion?.error ? "—" : `${stats?.conversion?.ratePercent ?? 0} %`}
            sub={
              stats?.conversion?.error
                ? undefined
                : `${formatNum(stats?.conversion?.premiumConverted)} / ${formatNum(stats?.conversion?.paywallHits)} à 15 scans`
            }
            error={stats?.conversion?.error}
          />
        </div>
      </section>

      <section className="admin-section" aria-label="Premium">
        <h2>Premium & revenus</h2>
        <div className="admin-grid">
          <StatCard
            label="Abonnés actifs"
            value={formatNum(stats?.premium?.activeFromStripe)}
            sub={
              stats?.premium?.error
                ? undefined
                : stats?.premium?.stripeAvailable
                  ? `${formatNum(stats?.premium?.monthly)} mensuel · ${formatNum(stats?.premium?.yearly)} annuel`
                  : "Stripe non configuré"
            }
            error={stats?.premium?.error}
          />
          <StatCard
            label="MRR"
            value={formatMoney(stats?.revenue?.mrr, currency)}
            sub={stats?.revenue?.error ? undefined : stats?.revenue?.stripeAvailable ? "Revenu mensuel récurrent" : "—"}
            error={stats?.revenue?.error}
          />
          <StatCard
            label="Total encaissé"
            value={formatMoney(stats?.revenue?.total, currency)}
            error={stats?.revenue?.error}
            wide
          />
        </div>
      </section>

      <section className="admin-section" aria-label="Graphique scans">
        <h2>Scans — 30 derniers jours</h2>
        {stats?.scans?.errors?.period ? (
          <p className="admin-empty admin-empty--error">{stats.scans.errors.period}</p>
        ) : (
          <ScanChart series={stats?.scans?.dailySeries} />
        )}
      </section>

      <section className="admin-section" aria-label="Top espèces">
        <h2>Top 10 espèces scannées</h2>
        {stats?.topSpecies?.error ? (
          <p className="admin-empty admin-empty--error">{stats.topSpecies.error}</p>
        ) : stats?.topSpecies?.items?.length ? (
          <ol className="admin-list">
            {stats.topSpecies.items.map((item, i) => (
              <li key={item.name}>
                <span className="admin-list-rank">{i + 1}.</span>
                <span className="admin-list-name">{item.name}</span>
                <span className="admin-list-count">{formatNum(item.count)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="admin-empty">
            {stats?.scans?.logsTableMissing
              ? "Historique espèces indisponible tant que scan_logs n'est pas créée."
              : "Aucune donnée — les scans seront enregistrés à partir de maintenant."}
          </p>
        )}
      </section>
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
        <title>Wilder Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="admin-root">
        {!configured ? (
          <div className="admin-login">
            <h1>Wilder Admin</h1>
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
