import { useState, useEffect, useCallback } from "react";
import {
  getCloudStatus,
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
  syncDiscoveriesToCloud,
} from "@/lib/cloudSync";
import { clearLastSyncError } from "@/lib/syncDiagnostics";

function formatSyncError(t, entry) {
  if (!entry) return "";
  const when = entry.at ? new Date(entry.at).toLocaleString() : "";
  const name = entry.discoveryName || entry.discoveryId || "—";
  return t("cloud.last_sync_error_detail", {
    when,
    name,
    error: entry.error || "unknown",
    code: entry.code || "—",
  });
}

export default function CloudAccountCard({ t, onDiscoveriesSynced }) {
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [actionStatus, setActionStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const s = await getCloudStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const onSyncError = () => refresh();
    window.addEventListener("wilder-sync-error", onSyncError);
    return () => window.removeEventListener("wilder-sync-error", onSyncError);
  }, [refresh]);

  const handleAuth = async () => {
    setActionStatus("loading");
    setMessage("");
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result = await fn(email.trim(), password);
    if (!result.ok) {
      setActionStatus("error");
      setMessage(result.error || t("cloud.error"));
      return;
    }
    if (result.discoveries) onDiscoveriesSynced?.(result.discoveries);
    await refresh();
    setActionStatus("ready");
    setMessage(t("cloud.signed_in_restore"));
  };

  const handleForceSync = async () => {
    setActionStatus("loading");
    clearLastSyncError();
    const result = await syncDiscoveriesToCloud();
    await refresh();
    if (!result.ok) {
      setActionStatus("error");
      setMessage(t("cloud.error"));
      return;
    }
    if (result.failed > 0) {
      setActionStatus("error");
      const first = result.errors?.[0];
      setMessage(
        first
          ? t("cloud.sync_failed_detail", {
              failed: result.failed,
              total: result.total,
              error: first.error,
              code: first.code || "—",
            })
          : t("cloud.sync_partial_failed", { failed: result.failed, total: result.total })
      );
      return;
    }
    setActionStatus("ready");
    setMessage(t("cloud.synced_up", { count: result.synced }));
  };

  const handleSignOut = async () => {
    setActionStatus("loading");
    await signOutCloud();
    await refresh();
    setActionStatus("idle");
    setMessage(t("cloud.signed_out_anon"));
  };

  if (!status?.available) {
    return (
      <section className="cloud-card cloud-card--muted">
        <h2>{t("cloud.title")}</h2>
        <p>{t("cloud.unavailable")}</p>
      </section>
    );
  }

  const showEmailForm = !status.email;

  return (
    <section className="cloud-card">
      <div className="cloud-auto-status">
        <span className="cloud-auto-dot" aria-hidden="true" />
        <div>
          <h2>{t("cloud.title")}</h2>
          <p className="cloud-sub">{t("cloud.auto_enabled")}</p>
        </div>
      </div>

      <p className="cloud-auto-detail">
        {status.pending > 0
          ? t("cloud.pending", { count: status.pending })
          : t("cloud.auto_ok")}
      </p>

      {status.authenticated && status.isPermanent === false && (
        <p className="cloud-sync-error" role="alert">
          {t("cloud.not_permanent_hint")}
        </p>
      )}

      {status.lastSyncError && (
        <p className="cloud-sync-error" role="alert">
          {formatSyncError(t, status.lastSyncError)}
        </p>
      )}

      {status.isAnonymous && (
        <p className="cloud-anon-hint">{t("cloud.anonymous_hint")}</p>
      )}

      {status.email && (
        <p className="cloud-email-badge">
          ✓ {status.email}
        </p>
      )}

      {showEmailForm && (
        <div className="cloud-email-section">
          <h3 className="cloud-email-title">{t("cloud.email_optional_title")}</h3>
          <p className="cloud-email-hint">{t("cloud.email_optional")}</p>
          <div className="cloud-tabs">
            <button
              type="button"
              className={`cloud-tab${mode === "signin" ? " active" : ""}`}
              onClick={() => setMode("signin")}
            >
              {t("cloud.sign_in")}
            </button>
            <button
              type="button"
              className={`cloud-tab${mode === "signup" ? " active" : ""}`}
              onClick={() => setMode("signup")}
            >
              {t("cloud.sign_up")}
            </button>
          </div>
          <input
            className="modal-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("cloud.email")}
            autoComplete="email"
          />
          <input
            className="modal-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("cloud.password")}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            className="btn-primary cloud-submit"
            onClick={handleAuth}
            disabled={actionStatus === "loading" || !email || !password}
          >
            {mode === "signup" ? t("cloud.sign_up") : t("cloud.sign_in")}
          </button>
        </div>
      )}

      <div className="cloud-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleForceSync}
          disabled={actionStatus === "loading"}
        >
          ↻ {t("cloud.force_sync")}
        </button>
        {status.email && (
          <button type="button" className="btn-secondary" onClick={handleSignOut}>
            {t("cloud.sign_out")}
          </button>
        )}
      </div>

      {message && (
        <p className="cloud-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
