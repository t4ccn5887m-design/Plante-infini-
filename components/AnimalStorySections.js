function textValue(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return s || null;
}

function StoryCard({ emoji, title, text }) {
  if (!text) return null;
  return (
    <div className="animaux-story-card">
      {emoji && (
        <span className="animaux-story-card-emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      <div className="animaux-story-card-body">
        <div className="animaux-story-card-title">{title}</div>
        <p className="animaux-story-card-text">{text}</p>
      </div>
    </div>
  );
}

const MODE_LABELS = {
  animal: { emoji: "📸", key: "mode_animal" },
  traces: { emoji: "🔍", key: "mode_traces" },
  sound: { emoji: "🎵", key: "mode_sound" },
};

export default function AnimalStorySections({ data, t }) {
  if (!data) return null;

  const mode = data.discovery_mode;
  const modeMeta = MODE_LABELS[mode];

  const story = textValue(data.histoire);
  const sections = [
    { emoji: "🐾", title: t("themes.juniors.story_activity"), text: textValue(data.activite_probable) },
    { emoji: "🕐", title: t("themes.juniors.story_time"), text: textValue(data.heure_probable) },
    { emoji: "🍂", title: t("themes.juniors.story_season"), text: textValue(data.habitudes_saison) },
    { emoji: "👀", title: t("themes.juniors.story_observe"), text: textValue(data.comment_observer) },
    { emoji: "🎯", title: t("themes.juniors.story_chances"), text: textValue(data.chances_observer) },
    { emoji: "💫", title: t("themes.juniors.story_surprise"), text: textValue(data.fait_surprenant) },
  ].filter((s) => s.text);

  const indice = textValue(data.indice_type);
  const chant = textValue(data.description_chant);

  if (!story && !sections.length && !indice && !chant) return null;

  return (
    <div className="animaux-story-sections">
      {modeMeta && (
        <p className="animaux-story-mode">
          <span aria-hidden="true">{modeMeta.emoji}</span> {t(`themes.juniors.${modeMeta.key}`)}
        </p>
      )}

      {story && (
        <blockquote className="animaux-story-narrative">{story}</blockquote>
      )}

      {indice && (
        <StoryCard emoji="🔍" title={t("themes.juniors.story_trace")} text={indice} />
      )}

      {chant && (
        <StoryCard emoji="🎵" title={t("themes.juniors.story_call")} text={chant} />
      )}

      {sections.map((section) => (
        <StoryCard
          key={section.title}
          emoji={section.emoji}
          title={section.title}
          text={section.text}
        />
      ))}
    </div>
  );
}
