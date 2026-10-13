import Head from "next/head";
import Link from "next/link";
import SevyaSceauLogo from "@/components/SevyaSceauLogo";
import { ChevronRight, Leaf } from "lucide-react";
import { WILDER_COLORS as C } from "@/lib/themes";

const CARD = {
  mintBg: "var(--card)",
  mintInk: "var(--sage)",
  peachBg: "var(--card)",
  peachInk: "var(--clay)",
  lavBg: "var(--bg)",
  lavInk: "var(--mute)",
};

function ChoiceCard({ href, bg, ink, title, description, icon }) {
  return (
    <Link
      href={href}
      className="sv-card"
      style={{ "--sv-card-bg": bg, "--sv-card-ink": ink }}
    >
      <span className="sv-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="sv-card__body">
        <span className="sv-card__title">{title}</span>
        <span className="sv-card__desc">{description}</span>
      </span>
      <ChevronRight className="sv-card__chev" size={22} strokeWidth={2} aria-hidden />
    </Link>
  );
}

export default function SevyaBienvenuePage() {
  return (
    <>
      <Head>
        <title>Sevya — Vos envies, traduites en jardin</title>
        <meta
          name="description"
          content="Sevya — le jardin de vos envies, compris d'avance."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="sv-page atelier-auth">
        <div className="sv-shell">
          <section className="sv-hero" aria-labelledby="sv-hero-title">
            <SevyaSceauLogo size={96} />
            <h1 id="sv-hero-title" className="sv-hero__title">
              Vos envies, traduites en jardin.
            </h1>
            <p className="sv-hero__sub">
              Le premier rendez-vous commence ici.
            </p>
          </section>

          <section className="sv-main" aria-labelledby="sv-main-heading">
            <div className="sv-main__inner">
              <header className="sv-main__intro">
                <h2 id="sv-main-heading" className="sv-main__welcome">
                  Bienvenue
                </h2>
                <p className="sv-main__lead">
                  Choisissez votre espace pour vous connecter ou créer un compte.
                </p>
              </header>

              <p className="sv-label">Vous êtes…</p>

              <div className="sv-cards">
                <ChoiceCard
                  href="/connexion?profil=particulier"
                  bg={CARD.mintBg}
                  ink={CARD.mintInk}
                  title="Un particulier"
                  description="Je prépare mon projet de jardin"
                  icon={<Leaf size={22} strokeWidth={2} />}
                />
                <ChoiceCard
                  href="/connexion?profil=pro"
                  bg={CARD.peachBg}
                  ink={CARD.peachInk}
                  title="Un paysagiste"
                  description="J'accède à l'espace pro de mon studio"
                  icon={
                    <svg
                      width="22"
                      height="22"
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
                      <path d="M9 9v.01" />
                      <path d="M9 12v.01" />
                      <path d="M9 15v.01" />
                      <path d="M9 18v.01" />
                    </svg>
                  }
                />
              </div>

              <aside className="sv-hint" style={{ background: CARD.lavBg, color: CARD.lavInk }}>
                <p>
                  Votre paysagiste vous a envoyé un lien ? Ouvrez-le directement :
                  pas besoin de compte.
                </p>
              </aside>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .sv-page {
          min-height: 100vh;
          min-height: 100dvh;
          font-family: var(--font-title), "Fraunces", Georgia, serif;
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
          padding: 16px;
          padding: max(16px, env(safe-area-inset-top))
            max(16px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom))
            max(16px, env(safe-area-inset-left));
        }

        .sv-hero {
          border-radius: 28px;
          padding: 28px 24px 32px;
          background: ${C.heroGradient};
          color: var(--ink);
          box-shadow: none;
          border: 1px solid var(--line);
        }

        .sv-hero :global(.sv-sceau) {
          margin-bottom: 20px;
        }

        .sv-hero__title {
          font-size: clamp(1.65rem, 5vw, 2.15rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          max-width: 16ch;
        }

        .sv-hero__sub {
          margin-top: 14px;
          font-size: 0.98rem;
          font-weight: 500;
          line-height: 1.45;
          color: var(--mute);
          max-width: 36ch;
        }

        .sv-main {
          flex: 1;
        }

        .sv-main__inner {
          width: 100%;
        }

        .sv-main__intro {
          display: none;
        }

        .sv-label {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${C.secondary};
          margin: 4px 4px 14px;
        }

        .sv-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ChoiceCard is a sibling function — styled-jsx does not hash its classNames */
        .sv-page :global(a.sv-card) {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
          min-height: 44px;
          padding: 18px;
          border-radius: 22px;
          text-decoration: none;
          color: var(--sv-card-ink);
          background: var(--sv-card-bg);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          box-shadow: none;
          border: 1px solid var(--line);
        }

        .sv-page :global(a.sv-card:hover) {
          box-shadow: 0 8px 24px -8px rgba(30, 43, 35, 0.18);
        }

        .sv-page :global(a.sv-card:active) {
          transform: scale(0.985);
        }

        .sv-page :global(a.sv-card:focus-visible) {
          outline: 2px solid ${C.primary};
          outline-offset: 3px;
        }

        .sv-page :global(a.sv-card .sv-card__icon) {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: var(--bg);
        }

        .sv-page :global(a.sv-card .sv-card__body) {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .sv-page :global(a.sv-card .sv-card__title) {
          display: block;
          width: 100%;
          font-size: 1.125rem;
          font-weight: 700;
          line-height: 1.25;
        }

        .sv-page :global(a.sv-card .sv-card__desc) {
          display: block;
          width: 100%;
          font-size: 0.875rem;
          font-weight: 500;
          opacity: 0.82;
          line-height: 1.35;
        }

        .sv-page :global(a.sv-card .sv-card__chev) {
          flex-shrink: 0;
          align-self: center;
          opacity: 0.45;
        }

        .sv-hint {
          margin-top: 20px;
          padding: 16px 18px;
          border-radius: 18px;
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.45;
        }

        .sv-hint p {
          margin: 0;
        }

        @media (min-width: 900px) {
          .sv-page {
            background: var(--bg);
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
            flex: 1.05;
            border-radius: 30px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 48px 40px;
            min-height: 520px;
          }

          .sv-hero__title {
            font-size: clamp(2rem, 3.2vw, 2.65rem);
            max-width: 14ch;
          }

          .sv-hero__sub {
            font-size: 1.05rem;
            margin-top: 18px;
            max-width: 32ch;
          }

          .sv-main {
            flex: 1;
            background: var(--bg);
            border-radius: 30px;
            box-shadow: 0 6px 30px -20px rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 28px;
          }

          .sv-main__inner {
            max-width: 480px;
            width: 100%;
          }

          .sv-main__intro {
            display: block;
            text-align: center;
            margin-bottom: 28px;
          }

          .sv-main__welcome {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: ${C.ink};
          }

          .sv-main__lead {
            margin-top: 8px;
            font-size: 0.98rem;
            font-weight: 500;
            color: ${C.muted};
            line-height: 1.45;
          }

          .sv-label {
            text-align: center;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}
