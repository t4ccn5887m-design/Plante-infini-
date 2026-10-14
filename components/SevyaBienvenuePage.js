import Head from "next/head";
import Link from "next/link";
import SevyaTopBar from "@/components/SevyaTopBar";
import { ATELIER_HERO_CHOIX } from "@/lib/atelierHeroImages";

const ROWS = [
  {
    href: "/connexion?profil=particulier",
    title: "Je prépare mon jardin",
    desc: "Idées, coups de cœur, dossier pour mon paysagiste",
  },
  {
    href: "/connexion?profil=pro",
    title: "Je suis paysagiste",
    desc: "Briefs clients, rendez-vous, réalisations",
  },
];

export default function SevyaBienvenuePage() {
  return (
    <>
      <Head>
        <title>Sevya — Le jardin se prépare avant le rendez-vous</title>
        <meta
          name="description"
          content="Sevya — idées, coups de cœur et dossier jardin pour particuliers et paysagistes."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="sv-discovery sv-choix">
        <div className="sv-hero-block sv-hero-block--choix fade">
          <img className="sv-hero-block__img" src={ATELIER_HERO_CHOIX} alt="" />
          <SevyaTopBar overlay />
        </div>

        <div className="sv-choix__headline">
          <h1 className="sv-display-title">
            Le jardin se prépare
            <br />
            avant le rendez-vous.
          </h1>
        </div>

        <nav className="sv-choix__list" aria-label="Choisir votre espace">
          {ROWS.map((row) => (
            <Link key={row.href} href={row.href} className="sv-choix__row">
              <span>
                <span className="sv-choix__row-title">{row.title}</span>
                <span className="sv-choix__row-desc">{row.desc}</span>
              </span>
              <span className="sv-choix__chev" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </nav>

        <p className="sv-choix__footnote">
          Votre paysagiste vous a envoyé un lien ? Ouvrez-le directement.
        </p>
      </div>
    </>
  );
}
