import { Fragment } from "react";
import TreeTrunkAgeCalculator from "@/components/TreeTrunkAgeCalculator";
import { isTreeLikeAnalysis } from "@/lib/treeAge";

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
    { key: "description", title: t("discovery.description"), text: textValue(data.description) },
    {
      key: "identification_note",
      title: t("discovery.identification_note"),
      text: textValue(data.identification_note),
    },
    { key: "family", title: t("discovery.family"), text: textValue(data.famille) },
    {
      key: "age_approx",
      title: t("discovery.age_approx"),
      text: textValue(data.age_approximatif),
    },
    { key: "habitat", title: t("discovery.habitat"), text: textValue(data.habitat) },
    { key: "health", title: t("discovery.health"), text: textValue(data.etat_sante) },
    {
      key: "weed_harmful",
      title: t("discovery.weed_harmful"),
      text: textValue(data.mauvaise_herbe_nuisible),
    },
    {
      key: "weed_natural_solution",
      title: t("discovery.weed_natural_solution"),
      text: textValue(data.mauvaise_herbe_solution),
    },
    {
      key: "weed_grandma_tips",
      title: t("discovery.weed_grandma_tips"),
      text: textValue(data.mauvaise_herbe_astuces),
    },
    {
      key: "weed_prevention",
      title: t("discovery.weed_prevention"),
      text: textValue(data.mauvaise_herbe_prevention),
    },
    {
      key: "care_treatment",
      title: t("discovery.care_treatment"),
      text: textValue(data.soins_traitement),
    },
    { key: "care_guide", title: t("discovery.care_guide"), text: textValue(data.guide_entretien) },
    { key: "expert_tips", title: t("discovery.expert_tips"), text: textValue(data.conseils_expert) },
    { key: "behavior", title: t("discovery.behavior"), text: textValue(data.comportement) },
    { key: "diet", title: t("discovery.diet"), text: textValue(data.alimentation) },
    { key: "danger", title: t("discovery.danger"), text: textValue(data.dangerosite) },
    { key: "useful_info", title: t("discovery.useful_info"), text: textValue(data.infos_utiles) },
    { key: "protected_species", title: t("discovery.protected_species"), text: protectedSpecies },
    { key: "region_season", title: t("discovery.region_season"), text: textValue(data.region_saison) },
    { key: "fun_fact", title: t("sound.fun_fact_title"), text: textValue(data.fun_fact) },
    { key: "history", title: t("discovery.history"), text: textValue(data.histoire) },
    {
      key: "construction_date",
      title: t("discovery.construction_date"),
      text: textValue(data.date_construction),
    },
    {
      key: "architectural_style",
      title: t("discovery.architectural_style"),
      text: textValue(data.style_architectural),
    },
    { key: "anecdotes", title: t("discovery.anecdotes"), text: textValue(data.anecdotes) },
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
    tronc_diametre_cm: discovery.tronc_diametre_cm,
    age_precis_tronc: discovery.age_precis_tronc,
    age_precis_coefficient: discovery.age_precis_coefficient,
    age_precis_note: discovery.age_precis_note,
  };
}

export default function DiscoveryAnalysisSections({ data, t, lang = "fr", discoveryId }) {
  const sections = getAnalysisSections(data, t);
  const showTreeAge = isTreeLikeAnalysis(data);

  if (!sections.length && !showTreeAge) return null;

  return (
    <div className="discovery-analysis-sections">
      {sections.map((section) => (
        <Fragment key={section.key}>
          <ResultSection title={section.title} text={section.text} />
          {section.key === "age_approx" && showTreeAge && (
            <TreeTrunkAgeCalculator
              data={data}
              t={t}
              lang={lang}
              discoveryId={discoveryId}
            />
          )}
        </Fragment>
      ))}
      {showTreeAge && !sections.some((s) => s.key === "age_approx") && (
        <TreeTrunkAgeCalculator data={data} t={t} lang={lang} discoveryId={discoveryId} />
      )}
    </div>
  );
}
