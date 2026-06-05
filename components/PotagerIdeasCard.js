import { useState } from "react";
import { JUNE_POTAGER_IDEAS, getJuneIdeaContent } from "@/lib/potagerJuneIdeas";

const TYPE_PILL_CLASS = {
  legume: "potager-idea-card-pill--legume",
  herbe: "potager-idea-card-pill--herbe",
  fleur: "potager-idea-card-pill--fleur",
};

const DIFFICULTY_CLASS = {
  facile: "potager-idea-card-difficulty--facile",
  moyen: "potager-idea-card-difficulty--moyen",
  expert: "potager-idea-card-difficulty--expert",
};

function IdeaCard({ idea, content, t, onOpen }) {
  const typeKey = `themes.potager.ideas_type_pill_${idea.type}`;
  const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : idea.type;
  const diffKey = `themes.potager.ideas_difficulty_${idea.difficulty}`;
  const diffLabel = t(diffKey) !== diffKey ? t(diffKey) : idea.difficulty;

  return (
    <button
      type="button"
      className="potager-idea-card"
      style={{ "--idea-accent": idea.accent }}
      onClick={() => onOpen(idea)}
    >
      <div className="potager-idea-card-image-wrap">
        <img
          src={idea.image}
          alt=""
          className="potager-idea-card-image"
          loading="lazy"
        />
        <span className="potager-idea-card-emoji" aria-hidden="true">
          {idea.emoji}
        </span>
      </div>
      <div className="potager-idea-card-body">
        <h3 className="potager-idea-card-name">{content.name}</h3>
        <span className={`potager-idea-card-pill ${TYPE_PILL_CLASS[idea.type] || ""}`}>
          {typeLabel}
        </span>
        <p className="potager-idea-card-period">{content.period}</p>
        <span
          className={`potager-idea-card-difficulty ${DIFFICULTY_CLASS[idea.difficulty] || ""}`}
        >
          {diffLabel}
        </span>
      </div>
    </button>
  );
}

function IdeaDetail({ idea, content, t, onClose }) {
  const typeKey = `themes.potager.ideas_type_pill_${idea.type}`;
  const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : idea.type;
  const diffKey = `themes.potager.ideas_difficulty_${idea.difficulty}`;
  const diffLabel = t(diffKey) !== diffKey ? t(diffKey) : idea.difficulty;

  return (
    <div className="potager-idea-detail-overlay" onClick={onClose} role="presentation">
      <div
        className="potager-idea-detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="potager-idea-detail-title"
      >
        <button
          type="button"
          className="potager-idea-detail-back"
          onClick={onClose}
        >
          <span aria-hidden="true">←</span> {t("themes.potager.ideas_back")}
        </button>

        <div className="potager-idea-detail-hero" style={{ "--idea-accent": idea.accent }}>
          <img src={idea.image} alt="" className="potager-idea-detail-image" />
          <div className="potager-idea-detail-hero-overlay">
            <span className="potager-idea-detail-emoji" aria-hidden="true">
              {idea.emoji}
            </span>
            <h2 id="potager-idea-detail-title" className="potager-idea-detail-title">
              {content.name}
            </h2>
            <div className="potager-idea-detail-badges">
              <span className={`potager-idea-card-pill ${TYPE_PILL_CLASS[idea.type] || ""}`}>
                {typeLabel}
              </span>
              <span
                className={`potager-idea-card-difficulty ${DIFFICULTY_CLASS[idea.difficulty] || ""}`}
              >
                {diffLabel}
              </span>
            </div>
            <p className="potager-idea-detail-period">{content.period}</p>
          </div>
        </div>

        <div className="potager-idea-detail-sections">
          <section className="potager-idea-detail-block">
            <h3 className="potager-idea-detail-block-title">
              {t("themes.potager.ideas_detail_description")}
            </h3>
            <p className="potager-idea-detail-block-text">{content.description}</p>
          </section>

          <section className="potager-idea-detail-block">
            <h3 className="potager-idea-detail-block-title">
              {t("themes.potager.ideas_detail_planting")}
            </h3>
            <p className="potager-idea-detail-block-text">{content.planting}</p>
          </section>

          <section className="potager-idea-detail-block potager-idea-detail-block--tip">
            <h3 className="potager-idea-detail-block-title">
              {t("themes.potager.ideas_detail_tip")}
            </h3>
            <p className="potager-idea-detail-block-text">{content.tip}</p>
          </section>

          <section className="potager-idea-detail-block potager-idea-detail-block--nursery">
            <h3 className="potager-idea-detail-block-title">
              {t("themes.potager.ideas_detail_nursery")}
            </h3>
            <p className="potager-idea-detail-block-text">{content.nursery}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function PotagerIdeasCard({ t, lang }) {
  const [selected, setSelected] = useState(null);

  const selectedContent = selected ? getJuneIdeaContent(selected, lang) : null;

  return (
    <>
      <section className="potager-ideas" aria-labelledby="potager-ideas-heading">
        <div className="potager-ideas-head">
          <h2 id="potager-ideas-heading" className="potager-ideas-title">
            {t("themes.potager.ideas_title")}
          </h2>
          <p className="potager-ideas-subtitle">{t("themes.potager.ideas_subtitle")}</p>
        </div>

        <div className="potager-ideas-grid">
          {JUNE_POTAGER_IDEAS.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              content={getJuneIdeaContent(idea, lang)}
              t={t}
              onOpen={setSelected}
            />
          ))}
        </div>
      </section>

      {selected && selectedContent && (
        <IdeaDetail
          idea={selected}
          content={selectedContent}
          t={t}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
