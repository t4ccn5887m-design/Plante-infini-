/**
 * Images du questionnaire client (/b/[token]) — rendus 3D Sevya uniquement.
 */
import {
  SEVYA_DEMO_RENDU_3D,
  SEVYA_DEMO_RENDU_ALLEE,
  SEVYA_DEMO_RENDU_CYPRES,
  SEVYA_DEMO_RENDU_PISCINE,
} from "@/lib/sevyaDemoRenders";

/** Écran 2 — ambiances (jardins aménagés) */
export const BRIEF_AMBIANCE_IMAGES = {
  medit: SEVYA_DEMO_RENDU_3D,
  contemporain: SEVYA_DEMO_RENDU_ALLEE,
  naturel: SEVYA_DEMO_RENDU_CYPRES,
  japonais: SEVYA_DEMO_RENDU_CYPRES,
  luxuriant: SEVYA_DEMO_RENDU_PISCINE,
  sec: SEVYA_DEMO_RENDU_ALLEE,
};

/** Écran 3 — vignettes végétaux & matières */
export const BRIEF_CHOICE_IMAGES = {
  fleuri: SEVYA_DEMO_RENDU_3D,
  arbres: SEVYA_DEMO_RENDU_CYPRES,
  graminees: SEVYA_DEMO_RENDU_ALLEE,
  mediterraneen: SEVYA_DEMO_RENDU_3D,
  sec: SEVYA_DEMO_RENDU_ALLEE,
  haie: SEVYA_DEMO_RENDU_CYPRES,
  pierre: SEVYA_DEMO_RENDU_ALLEE,
  bois: SEVYA_DEMO_RENDU_3D,
  gravier: SEVYA_DEMO_RENDU_ALLEE,
  "terre-cuite": SEVYA_DEMO_RENDU_PISCINE,
};
