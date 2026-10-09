import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { WILDER_COLORS as C } from "@/lib/themes";
import { isPermanentAuthUser } from "@/lib/authUser";
import {
  completeAuthSession,
  getCloudSession,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/cloudSync";
import {
  ensureProStudio,
  getProAuthUser,
  proStudioErrorMessage,
} from "@/lib/pro/proStudioApi";
import { supabase } from "@/lib/supabase";

/** URL de retour e-mail auth — toujours basée sur l’origine courante (local / preview / prod). */
function getAuthEmailRedirectUrl(isProProfile) {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${isProProfile ? "/pro" : "/jardin"}`;
}

const CARD = {
  mintBg: "#E6F0E3",
  mintInk: "#4E7B52",
  peachBg: "#F6E7D8",
  peachInk: "#DB7E44",
};

const HERO_GRADIENT =
  "linear-gradient(165deg, #5E8A64 0%, #2F5E3F 52%, #1E3A28 100%)";

const PRIMARY_GREEN = "#2F5E3F";

function SevyaLogo() {
  return (
    <div className="sv-logo" aria-label="Sevya">
      <Leaf className="sv-logo__leaf" size={20} strokeWidth={2.2} aria-hidden />
      <span className="sv-logo__text">sevya</span>
    </div>
  );
}

function mapError(message) {
  if (!message) return "Une erreur est survenue. Réessayez.";
  if (message === "cloud_unavailable") {
    return "Le service est momentanément indisponible. Réessayez dans un instant.";
  }
  if (message === "email_required") {
    return "Indiquez votre adresse e-mail ci-dessus.";
  }
  return message;
}

export default function ConnexionPage() {
  const router = useRouter();
  const isPro = router.isReady && router.query.profil === "pro";

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMode("signin");
    setError("");
    setInfo("");
    setResetSent(false);
  }, [isPro]);

  useEffect(() => {
    if (mode !== "signin") {
      setResetSent(false);
    }
  }, [mode]);

  const redirectTarget = isPro ? "/pro" : "/jardin";

  /** Aligné sur PremiumAuthStep.finish() après signIn / signUp réussis. */
  const finishAuthSession = async () => {
    await completeAuthSession().catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    setResetSent(false);

    const trimmedEmail = email.trim();
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result =
      mode === "signup"
        ? await fn(trimmedEmail, password)
        : await fn(trimmedEmail, password, { rememberMe: true });

    if (!result.ok) {
      setLoading(false);
      setError(mapError(result.error));
      return;
    }

    if (isPro) {
      const check = await getProAuthUser();
      if (!check.ok) {
        setLoading(false);
        setInfo("Vérifiez votre boîte mail pour confirmer votre compte.");
        return;
      }
    } else {
      const session = await getCloudSession();
      if (mode === "signup" && !isPermanentAuthUser(session?.user)) {
        setLoading(false);
        setInfo("Vérifiez votre boîte mail pour confirmer votre compte.");
        return;
      }
    }

    await finishAuthSession();

    if (isPro) {
      const studioRes = await ensureProStudio();
      if (!studioRes.ok) {
        setLoading(false);
        setError(proStudioErrorMessage(studioRes.error, studioRes.detail));
        return;
      }
    }

    setLoading(false);
    await router.push(redirectTarget);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetSent(false);
    setInfo("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Indiquez votre adresse e-mail ci-dessus pour recevoir le lien.");
      return;
    }
    if (!supabase) {
      setError(mapError("cloud_unavailable"));
      return;
    }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getAuthEmailRedirectUrl(isPro),
    });
    setLoading(false);
    if (resetError) {
      setError(mapError(resetError.message));
      return;
    }
    setResetSent(true);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError(mapError("cloud_unavailable"));
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Indiquez votre adresse e-mail pour recevoir le lien.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    setResetSent(false);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: getAuthEmailRedirectUrl(false),
      },
    });
    setLoading(false);
    if (otpError) {
      setError(mapError(otpError.message));
      return;
    }
    setInfo("Vérifiez votre boîte mail : un lien de connexion vous a été envoyé.");
  };

  const signupTabLabel = isPro ? "Créer mon studio" : "Créer un compte";
  const primaryLabel =
    mode === "signup"
      ? isPro
        ? "Créer mon studio"
        : "Créer mon compte"
      : isPro
        ? "Accéder à mon espace pro"
        : "Se connecter";

  const emailLabel = isPro ? "E-MAIL PRO" : "E-MAIL";
  const emailId = "sv-connexion-email";
  const passwordId = "sv-connexion-password";

  return (
    <>
      <Head>
        <title>{isPro ? "Espace pro" : "Connexion"} — Sevya</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="sv-page">
        <div className="sv-shell">
          <section className="sv-hero" aria-hidden="true">
            <SevyaLogo />
            <h1 className="sv-hero__title">
              Le jardin de vos envies, compris d&apos;avance.
            </h1>
            <p className="sv-hero__sub">
              Les particuliers rassemblent leurs idées, les paysagistes arrivent
              préparés au premier rendez-vous.
            </p>
          </section>

          <section className="sv-main" aria-labelledby="sv-connexion-heading">
            <div className="sv-main__inner">
              <Link href="/" className="sv-back">
                ← Retour
              </Link>

              <div
                className="sv-pill"
                style={{
                  background: isPro ? CARD.peachBg : CARD.mintBg,
                  color: isPro ? CARD.peachInk : CARD.mintInk,
                }}
              >
                {isPro ? (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 21h18" />
                      <path d="M5 21V7l8-4v18" />
                      <path d="M19 21V11l-6-4" />
                    </svg>
                    Espace paysagiste
                  </>
                ) : (
                  <>
                    <Leaf size={18} strokeWidth={2} aria-hidden />
                    Espace particulier
                  </>
                )}
              </div>

              <h1 id="sv-connexion-heading" className="sv-title">
                {isPro
                  ? "Vos clients, compris d'avance"
                  : "Votre jardin vous attend"}
              </h1>
              <p className="sv-subtitle">
                {isPro
                  ? "Accédez à vos briefs, vos liens envoyés et votre agenda."
                  : "Retrouvez vos envies, vos scans et votre brief."}
              </p>

              <div className="sv-tabs" role="tablist" aria-label="Mode de connexion">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  className={`sv-tab${mode === "signin" ? " sv-tab--on" : ""}`}
                  onClick={() => setMode("signin")}
                  disabled={loading}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  className={`sv-tab${mode === "signup" ? " sv-tab--on" : ""}`}
                  onClick={() => setMode("signup")}
                  disabled={loading}
                >
                  {signupTabLabel}
                </button>
              </div>

              <form className="sv-form" onSubmit={handleSubmit} noValidate>
                <div className="sv-field">
                  <label htmlFor={emailId}>{emailLabel}</label>
                  <input
                    id={emailId}
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="sv-field">
                  <label htmlFor={passwordId}>MOT DE PASSE</label>
                  <input
                    id={passwordId}
                    type="password"
                    name="password"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                {mode === "signin" && (
                  <button
                    type="button"
                    className="sv-forgot"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Mot de passe oublié ?
                  </button>
                )}

                <button type="submit" className="sv-btn-primary" disabled={loading}>
                  {loading ? "Patientez…" : primaryLabel}
                </button>
              </form>

              {!isPro && (
                <>
                  <div className="sv-or">
                    <span>ou</span>
                  </div>
                  <button
                    type="button"
                    className="sv-btn-secondary"
                    onClick={handleMagicLink}
                    disabled={loading}
                  >
                    Recevoir un lien par e-mail
                  </button>
                </>
              )}

              {isPro && (
                <aside
                  className="sv-pro-hint"
                  style={{ background: CARD.peachBg, color: CARD.peachInk }}
                >
                  <p>
                    Envoyez un lien à vos clients, recevez leur brief avant le
                    premier rendez-vous.
                  </p>
                </aside>
              )}

              {resetSent && (
                <p className="sv-info" role="status">
                  Un e-mail de réinitialisation a été envoyé à votre adresse.
                </p>
              )}
              {info && (
                <p className="sv-info" role="status">
                  {info}
                </p>
              )}
              {error && (
                <p className="sv-error" role="alert">
                  {error}
                </p>
              )}

              <p className="sv-switch">
                {isPro ? (
                  <>
                    Vous êtes un particulier ?{" "}
                    <Link href="/connexion?profil=particulier">Espace jardin</Link>
                  </>
                ) : (
                  <>
                    Vous êtes paysagiste ?{" "}
                    <Link href="/connexion?profil=pro">Espace pro</Link>
                  </>
                )}
              </p>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .sv-page {
          min-height: 100vh;
          min-height: 100dvh;
          font-family: var(--font-title), "Quicksand", system-ui, sans-serif;
          color: ${C.ink};
          background: ${C.shellBg};
          -webkit-font-smoothing: antialiased;
        }

        .sv-shell {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1120px;
          margin: 0 auto;
          padding: max(16px, env(safe-area-inset-top))
            max(16px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom))
            max(16px, env(safe-area-inset-left));
        }

        .sv-hero {
          display: none;
        }

        .sv-main {
          flex: 1;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 6px 30px -20px rgba(0, 0, 0, 0.2);
          padding: 24px 20px 28px;
        }

        .sv-main__inner {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        .sv-back {
          display: inline-block;
          font-size: 0.9375rem;
          font-weight: 600;
          color: ${C.secondary};
          text-decoration: none;
          margin-bottom: 20px;
          min-height: 44px;
          line-height: 44px;
        }

        .sv-back:focus-visible {
          outline: 2px solid ${PRIMARY_GREEN};
          outline-offset: 2px;
          border-radius: 6px;
        }

        .sv-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .sv-title {
          font-size: clamp(1.5rem, 4.5vw, 1.85rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .sv-subtitle {
          margin-top: 10px;
          font-size: 0.98rem;
          font-weight: 500;
          color: ${C.muted};
          line-height: 1.45;
          max-width: 36ch;
        }

        .sv-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 24px 0 20px;
          padding: 4px;
          background: ${C.hint};
          border-radius: 14px;
        }

        .sv-tab {
          min-height: 44px;
          border: none;
          border-radius: 11px;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 700;
          color: ${C.secondary};
          background: transparent;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .sv-tab--on {
          background: #fff;
          color: ${C.ink};
          box-shadow: 0 2px 8px rgba(30, 43, 35, 0.08);
        }

        .sv-tab:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sv-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sv-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sv-field label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: ${C.secondary};
        }

        .sv-field input {
          min-height: 48px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid ${C.borderStrong};
          font-family: inherit;
          font-size: 1rem;
          color: ${C.ink};
          background: #fff;
        }

        .sv-field input:focus {
          outline: 2px solid ${PRIMARY_GREEN};
          outline-offset: 1px;
          border-color: transparent;
        }

        .sv-field input:disabled {
          opacity: 0.65;
        }

        .sv-forgot {
          align-self: flex-start;
          border: none;
          background: none;
          padding: 8px 0;
          min-height: 44px;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${C.greenInk};
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .sv-forgot:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sv-btn-primary {
          min-height: 48px;
          margin-top: 4px;
          border: none;
          border-radius: 14px;
          background: ${PRIMARY_GREEN};
          color: #fff;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.12s ease, opacity 0.12s ease;
        }

        .sv-btn-primary:hover:not(:disabled) {
          opacity: 0.94;
        }

        .sv-btn-primary:active:not(:disabled) {
          transform: scale(0.985);
        }

        .sv-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .sv-or {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 16px;
          color: ${C.muted};
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: lowercase;
        }

        .sv-or::before,
        .sv-or::after {
          content: "";
          flex: 1;
          height: 1px;
          background: ${C.border};
        }

        .sv-btn-secondary {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid ${C.borderStrong};
          background: #fff;
          font-family: inherit;
          font-size: 0.98rem;
          font-weight: 700;
          color: ${C.ink};
          cursor: pointer;
        }

        .sv-btn-secondary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .sv-pro-hint {
          margin-top: 20px;
          padding: 16px 18px;
          border-radius: 18px;
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.45;
        }

        .sv-pro-hint p {
          margin: 0;
        }

        .sv-info {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: ${C.greenTint};
          color: ${C.greenInk};
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.4;
        }

        .sv-error {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fdeeee;
          color: ${C.error};
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.4;
        }

        .sv-switch {
          margin-top: 28px;
          text-align: center;
          font-size: 0.9375rem;
          font-weight: 500;
          color: ${C.secondary};
          line-height: 1.5;
        }

        .sv-switch :global(a) {
          color: ${C.greenInk};
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        @media (min-width: 900px) {
          .sv-page {
            background: linear-gradient(180deg, #ddd8cc 0%, #d3cdbe 100%);
          }

          .sv-shell {
            flex-direction: row;
            align-items: stretch;
            gap: 20px;
            min-height: calc(100vh - 48px);
            min-height: calc(100dvh - 48px);
            padding: 24px;
          }

          .sv-hero {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1.05;
            border-radius: 30px;
            padding: 48px 40px;
            background: ${HERO_GRADIENT};
            color: #eef2ea;
            box-shadow: 0 12px 40px -16px rgba(30, 58, 40, 0.45);
          }

          .sv-logo {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 24px;
          }

          .sv-logo :global(.sv-logo__leaf) {
            color: #c8e0c9;
          }

          .sv-logo__text {
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            text-transform: lowercase;
            color: #fff;
          }

          .sv-hero__title {
            font-size: clamp(2rem, 3.2vw, 2.65rem);
            font-weight: 700;
            line-height: 1.12;
            letter-spacing: -0.02em;
            max-width: 14ch;
          }

          .sv-hero__sub {
            margin-top: 18px;
            font-size: 1.05rem;
            font-weight: 500;
            line-height: 1.45;
            color: rgba(238, 242, 234, 0.88);
            max-width: 32ch;
          }

          .sv-main {
            flex: 1;
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 28px;
          }
        }
      `}</style>
    </>
  );
}
