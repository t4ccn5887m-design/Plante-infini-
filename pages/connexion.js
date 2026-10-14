import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SevyaTopBar from "@/components/SevyaTopBar";
import { ATELIER_HERO_PART, ATELIER_HERO_PRO_LOGIN } from "@/lib/atelierHeroImages";
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
    if (router.isReady && router.query.mode === "signup" && !isPro) {
      setMode("signup");
    } else {
      setMode("signin");
    }
    setError("");
    setInfo("");
    setResetSent(false);
  }, [isPro, router.isReady, router.query.mode]);

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

  const handleSubmit = async (e, modeOverride) => {
    e?.preventDefault?.();
    const authMode = modeOverride || mode;
    setLoading(true);
    setError("");
    setInfo("");
    setResetSent(false);

    const trimmedEmail = email.trim();
    const fn = authMode === "signup" ? signUpWithEmail : signInWithEmail;
    const result =
      authMode === "signup"
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
      if (authMode === "signup" && !isPermanentAuthUser(session?.user)) {
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

  const emailId = "sv-connexion-email";
  const passwordId = "sv-connexion-password";
  const heroSrc = isPro ? ATELIER_HERO_PRO_LOGIN : ATELIER_HERO_PART;

  const statusBlock = (
    <>
      {resetSent ? (
        <p className="sv-auth-status sv-auth-status--ok" role="status">
          Un e-mail de réinitialisation a été envoyé à votre adresse.
        </p>
      ) : null}
      {info ? (
        <p className="sv-auth-status sv-auth-status--ok" role="status">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="sv-auth-status sv-auth-status--err" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );

  return (
    <>
      <Head>
        <title>{isPro ? "Espace pro" : "Votre jardin"} — Sevya</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={`sv-discovery ${isPro ? "sv-pro-auth" : "sv-part-auth"}`}>
        <div
          className={`sv-hero-block sv-hero-block--auth fade${
            isPro ? " sv-hero-block--auth-pro" : ""
          }`}
        >
          <img className="sv-hero-block__img" src={heroSrc} alt="" />
          <SevyaTopBar
            overlay
            backHref="/"
            titlePro={isPro}
          />
        </div>

        {isPro ? (
          <div className="sv-auth-body sv-auth-body--pro">
            <p className="atelier-label">Espace paysagiste</p>
            <h1 className="sv-auth-title">
              Comprendre votre client
              <br />
              avant de le rencontrer.
            </h1>
            <p className="sv-auth-lead">
              Envoyez un lien avant le premier rendez-vous. Arrivez avec les bonnes idées
              d&apos;aménagement.
            </p>
            <form className="sv-auth-form" onSubmit={(e) => handleSubmit(e, "signin")} noValidate>
              <div className="sv-field">
                <label htmlFor={emailId}>E-mail professionnel</label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="sv-field">
                <label htmlFor={passwordId}>Mot de passe</label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <button type="button" className="sv-auth-forgot" onClick={handleForgotPassword} disabled={loading}>
                Mot de passe oublié ?
              </button>
              <div className="sv-auth-actions">
                <button type="submit" className="sv-btn-fill" disabled={loading}>
                  {loading ? "Patientez…" : "Se connecter"}
                </button>
                <button
                  type="button"
                  className="sv-btn-outline"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, "signup")}
                >
                  Créer mon compte
                </button>
              </div>
            </form>
            {statusBlock}
          </div>
        ) : (
          <>
            <div className="sv-auth-intro">
              <p className="atelier-label">Votre jardin</p>
              <h1 className="sv-auth-title">
                Rassemblez vos envies,
                <br />
                on s&apos;occupe du reste.
              </h1>
              <p className="sv-auth-lead">
                Découvrez sans compte, ou créez le vôtre tout de suite. Dans les deux cas, ce que vous faites est
                gardé.
              </p>
            </div>

            <button
              type="button"
              className="sv-guest-cta"
              onClick={() => router.push("/jardin")}
              disabled={loading}
            >
              <span>
                <span className="sv-guest-cta__title">Découvrir sans compte</span>
                <span className="sv-guest-cta__sub">Idées, coups de cœur, dossier · tout est gardé</span>
              </span>
              <span className="sv-choix__chev" aria-hidden="true">
                ›
              </span>
            </button>

            <div className="sv-auth-or">
              <i aria-hidden="true" />
              ou
              <i aria-hidden="true" />
            </div>

            <form className="sv-auth-form" onSubmit={(e) => handleSubmit(e, "signin")} noValidate>
              <div className="sv-field">
                <label htmlFor={emailId}>E-mail</label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  placeholder="vous@mail.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="sv-field">
                <label htmlFor={passwordId}>Mot de passe</label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <button type="button" className="sv-auth-forgot" onClick={handleForgotPassword} disabled={loading}>
                Mot de passe oublié ?
              </button>
              <div className="sv-auth-actions">
                <button type="submit" className="sv-btn-fill" disabled={loading}>
                  {loading ? "Patientez…" : "Se connecter"}
                </button>
                <button
                  type="button"
                  className="sv-btn-outline"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, "signup")}
                >
                  Créer mon compte
                </button>
              </div>
            </form>
            {statusBlock}
          </>
        )}
      </div>
    </>
  );
}
