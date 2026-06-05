function textValue(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return s || null;
}

function ResultSection({ title, text }) {
  if (!text) return null;
  return (
    <div className="result-card">
      <div className="result-card-title">{title}</div>
      <p className="result-card-text">{text}</p>
    </div>
  );
}

/** Ordered analysis blocks for display (non-empty fields only). */
export function getAnalysisSections(data, t) {
  if (!data) return [];

  let protectedSpecies = null;
  if (data.espece_protegee === true) protectedSpecies = t("discovery.protected_yes");
  else if (data.espece_protegee === false) protectedSpecies = t("discovery.protected_no");

  return [
    { title: t("discovery.description"), text: textValue(data.description) },
    { title: t("discovery.identification_note"), text: textValue(data.identification_note) },
    { title: t("discovery.family"), text: textValue(data.famille) },
    { title: t("discovery.age_approx"), text: textValue(data.age_approximatif) },
    { title: t("discovery.habitat"), text: textValue(data.habitat) },
    { title: t("discovery.health"), text: textValue(data.etat_sante) },
    { title: t("discovery.weed_harmful"), text: textValue(data.mauvaise_herbe_nuisible) },
    { title: t("discovery.weed_natural_solution"), text: textValue(data.mauvaise_herbe_solution) },
    { title: t("discovery.weed_grandma_tips"), text: textValue(data.mauvaise_herbe_astuces) },
    { title: t("discovery.weed_prevention"), text: textValue(data.mauvaise_herbe_prevention) },
    { title: t("discovery.care_treatment"), text: textValue(data.soins_traitement) },
    { title: t("discovery.care_guide"), text: textValue(data.guide_entretien) },
    { title: t("discovery.expert_tips"), text: textValue(data.conseils_expert) },
    { title: t("discovery.behavior"), text: textValue(data.comportement) },
    { title: t("discovery.diet"), text: textValue(data.alimentation) },
    { title: t("discovery.danger"), text: textValue(data.dangerosite) },
    { title: t("discovery.useful_info"), text: textValue(data.infos_utiles) },
    { title: t("discovery.protected_species"), text: protectedSpecies },
    { title: t("discovery.region_season"), text: textValue(data.region_saison) },
    { title: t("sound.fun_fact_title"), text: textValue(data.fun_fact) },
    { title: t("discovery.history"), text: textValue(data.histoire) },
    { title: t("discovery.construction_date"), text: textValue(data.date_construction) },
    { title: t("discovery.architectural_style"), text: textValue(data.style_architectural) },
    { title: t("discovery.anecdotes"), text: textValue(data.anecdotes) },
  ].filter((s) => s.text);
}

export function discoveryToAnalysisData(discovery) {
  if (!discovery) return {};
  return {
    description: discovery.description,
    identification_note: discovery.identification_note,
    famille: discovery.famille,
    age_approximatif: discovery.age_approximatif,
    habitat: discovery.habitat,
    etat_sante: discovery.etat_sante,
    mauvaise_herbe_nuisible: discovery.mauvaise_herbe_nuisible,
    mauvaise_herbe_solution: discovery.mauvaise_herbe_solution,
    mauvaise_herbe_astuces: discovery.mauvaise_herbe_astuces,
    mauvaise_herbe_prevention: discovery.mauvaise_herbe_prevention,
    soins_traitement: discovery.soins_traitement,
    guide_entretien: discovery.guide_entretien,
    conseils_expert: discovery.conseils_expert,
    comportement: discovery.comportement,
    alimentation: discovery.alimentation,
    dangerosite: discovery.dangerosite,
    infos_utiles: discovery.infos_utiles,
    espece_protegee: discovery.espece_protegee,
    region_saison: discovery.region_saison,
    fun_fact: discovery.fun_fact,
    histoire: discovery.histoire,
    date_construction: discovery.date_construction,
    style_architectural: discovery.style_architectural,
    anecdotes: discovery.anecdotes,
  };
}

export default function DiscoveryAnalysisSections({ data, t }) {
  const sections = getAnalysisSections(data, t);
  if (!sections.length) return null;
  return (
    <div className="discovery-analysis-sections">
      {sections.map((section) => (
        <ResultSection key={section.title} title={section.title} text={section.text} />
      ))}
    </div>
  );
}
