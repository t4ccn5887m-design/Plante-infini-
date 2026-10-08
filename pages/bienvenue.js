import Head from "next/head";
import Link from "next/link";
import { ChevronRight, Leaf } from "lucide-react";
import { WILDER_COLORS as C } from "@/lib/themes";

const CARD = {
  mintBg: "#E6F0E3",
  mintInk: "#4E7B52",
  peachBg: "#F6E7D8",
  peachInk: "#DB7E44",
  lavBg: "#ECE6F5",
  lavInk: "#7A67A6",
};

const HERO_GRADIENT =
  "linear-gradient(165deg, #5E8A64 0%, #2F5E3F 52%, #1E3A28 100%)";

function SevyaLogo() {
  return (
    <div className="sv-logo" aria-label="Sevya">
      <Leaf className="sv-logo__leaf" size={20} strokeWidth={2.2} aria-hidden />
      <span className="sv-logo__text">sevya</span>
    </div>
  );
}

function ChoiceCard({ href, bg, ink, title, description, icon }) {
  return (
    <Link href={href} className="sv-card" style={{ background: bg, color: ink }}>
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

export default function BienvenuePage() {
  return (
    <>
      <Head>
        <title>Bienvenue — Sevya</title>
        <meta
          name="description"
          content="Sevya — le jardin de vos envies, compris d'avance."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="sv-page">
        <div className="sv-shell">
          <section className="sv-hero" aria-labelledby="sv-hero-title">
            <SevyaLogo />
            <h1 id="sv-hero-title" className="sv-hero__title">
              Le jardin de vos envies, compris d&apos;avance.
            </h1>
            <p className="sv-hero__sub">
              Les particuliers rassemblent leurs idées, les paysagistes arrivent
              préparés au premier rendez-vous.
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
          padding: 16px;
          padding: max(16px, env(safe-area-inset-top))
            max(16px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom))
            max(16px, env(safe-area-inset-left));
        }

        .sv-hero {
          border-radius: 28px;
          padding: 28px 24px 32px;
          background: ${HERO_GRADIENT};
          color: #eef2ea;
          box-shadow: 0 12px 40px -16px rgba(30, 58, 40, 0.45);
        }

        .sv-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .sv-logo :global(.sv-logo__leaf) {
          color: #c8e0c9;
          flex-shrink: 0;
        }

        .sv-logo__text {
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-transform: lowercase;
          color: #fff;
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
          color: rgba(238, 242, 234, 0.88);
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

        .sv-card {
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 44px;
          padding: 18px 16px;
          border-radius: 22px;
          text-decoration: none;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          box-shadow: 0 2px 12px -4px rgba(30, 43, 35, 0.12);
        }

        .sv-card:hover {
          box-shadow: 0 8px 24px -8px rgba(30, 43, 35, 0.18);
        }

        .sv-card:active {
          transform: scale(0.985);
        }

        .sv-card:focus-visible {
          outline: 2px solid ${C.primary};
          outline-offset: 3px;
        }

        .sv-card__icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.55);
        }

        .sv-card__body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sv-card__title {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .sv-card__desc {
          font-size: 0.875rem;
          font-weight: 500;
          opacity: 0.82;
          line-height: 1.35;
        }

        .sv-card :global(.sv-card__chev) {
          flex-shrink: 0;
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
            background: #ffffff;
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
