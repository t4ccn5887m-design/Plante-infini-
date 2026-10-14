import { PARTNERS_DEMO_STUDIO } from "@/lib/partners";

export default function PartnersDemoScreen({ onBack }) {
  const studio = PARTNERS_DEMO_STUDIO;
  const heroPhoto = "/catalogue/realisations/styles_realisations-4.webp";

  return (
    <div className="atelier-partners-demo">
      <div className="atelier-partners-demo__banner" role="status">
        Exemple — studio fictif
      </div>

      <div className="atelier-partners-demo__scroll">
        <div className="atelier-partners-demo__hero">
          <img src={heroPhoto} alt="" className="atelier-partners-demo__hero-img" />
          <div className="atelier-partners-demo__hero-shade" aria-hidden="true" />
          <button type="button" className="atelier-partners-demo__back" onClick={onBack} aria-label="Retour">
            ‹
          </button>
        </div>

        <div className="atelier-partners-demo__body">
          <span className="atelier-label">{studio.city}</span>
          <h1 className="atelier-partners-demo__name">{studio.name}</h1>
          <p className="atelier-partners-demo__tagline">{studio.tagline}</p>
          <p className="atelier-partners-demo__intro">{studio.intro}</p>

          <div className="atelier-partners-demo__chips">
            {studio.specialties.map((label) => (
              <span key={label} className="atelier-partners-demo__chip">
                {label}
              </span>
            ))}
          </div>

          <p className="atelier-partners-demo__fake-contact">
            Coordonnées masquées sur cet exemple — aucun contact réel.
          </p>
        </div>
      </div>

      <div className="atelier-partners-demo__footer">
        <button type="button" className="atelier-btn-primary" disabled aria-disabled="true">
          Envoyer mon dossier
        </button>
        <span className="atelier-partners-demo__soon">Disponible bientôt</span>
      </div>
    </div>
  );
}
