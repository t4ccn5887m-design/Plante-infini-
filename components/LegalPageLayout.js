import Head from "next/head";
import Link from "next/link";

function highlightPlaceholders(text) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith("[") && part.endsWith("]")
      ? <mark key={i} className="legal-placeholder">{part}</mark>
      : part
  );
}

export default function LegalPageLayout({ title, sections, description }) {
  return (
    <>
      <Head>
        <title>{title} — Wilder</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <div className="legal-page">
        <div className="legal-page-bg" aria-hidden="true" />
        <div className="legal-page-overlay" aria-hidden="true" />
        <div className="legal-page-inner">
          <header className="legal-page-header">
            <Link href="/" className="legal-page-back">
              ← Retour à Wilder
            </Link>
            <p className="legal-page-disclaimer" role="note">
              À FAIRE VALIDER PAR UN JURISTE — texte non contractuel (premier jet).
            </p>
            <h1 className="legal-page-title">{title}</h1>
          </header>

          <article className="legal-page-body">
            {sections.map((section) => (
              <section key={section.title} className="legal-section">
                <h2 className="legal-section-title">{section.title}</h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="legal-paragraph">
                    {highlightPlaceholders(p)}
                  </p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </div>
    </>
  );
}
