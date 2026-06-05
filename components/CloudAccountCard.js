import { useState, useEffect } from "react";
import {
  isCloudAvailable,
  loadCloudSession,
  pullDiscoveriesFromCloud,
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
  syncDiscoveriesToCloud,
} from "@/lib/cloudSync";

export default function CloudAccountCard({ t, onDiscoveriesSynced }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const cloudOk = isCloudAvailable();

  useEffect(() => {
    setSession(loadCloudSession());
  }, []);

  const handleAuth = async () => {
    setStatus("loading");
    setMessage("");
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result = await fn(email.trim(), password);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error || t("cloud.error"));
      return;
    }
    setSession(loadCloudSession());
    setStatus("ready");
    setMessage(t("cloud.signed_in"));
  };

  const handleSyncUp = async () => {
    setStatus("loading");
    const result = await syncDiscoveriesToCloud();
    setStatus(result.ok ? "ready" : "error");
    setMessage(
      result.ok
        ? t("cloud.synced_up", { count: result.synced })
        : t("cloud.error")
    );
  };

  const handleSyncDown = async () => {
    setStatus("loading");
    const result = await pullDiscoveriesFromCloud();
    setStatus(result.ok ? "ready" : "error");
    if (result.ok) {
      setMessage(t("cloud.synced_down", { count: result.merged }));
      if (result.discoveries) onDiscoveriesSynced?.(result.discoveries);
    } else {
      setMessage(t("cloud.error"));
    }
  };

  const handleSignOut = async () => {
    await signOutCloud();
    setSession(null);
    setMessage(t("cloud.signed_out"));
  };

  if (!cloudOk) {
    return (
      <section className="cloud-card cloud-card--muted">
        <h2>{t("cloud.title")}</h2>
        <p>{t("cloud.unavailable")}</p>
      </section>
    );
  }

  return (
    <section className="cloud-card">
      <h2>{t("cloud.title")}</h2>
      <p className="cloud-sub">{t("cloud.subtitle")}</p>

      {session ? (
        <>
          <p className="cloud-email">{session.email}</p>
          <div className="cloud-actions">
            <button type="button" className="btn-primary" onClick={handleSyncUp} disabled={status === "loading"}>
              ↑ {t("cloud.sync_up")}
            </button>
            <button type="button" className="btn-secondary" onClick={handleSyncDown} disabled={status === "loading"}>
              ↓ {t("cloud.sync_down")}
            </button>
            <button type="button" className="btn-secondary" onClick={handleSignOut}>
              {t("cloud.sign_out")}
            </button>
          </div>
        </>
      ) : (
        <>
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
            disabled={status === "loading" || !email || !password}
          >
            {mode === "signup" ? t("cloud.sign_up") : t("cloud.sign_in")}
          </button>
        </>
      )}

      {message && <p className="cloud-message" role="status">{message}</p>}
    </section>
  );
}
