/** Cartes « Prochaines étapes » — alignées sevya/1-accueil.html */

export const DOSSIER_STEP_CARD = {
  terrain: {
    title: "Photographier mon terrain",
    subtitle: "3 photos suffisent",
    bg: "#F6E7D8",
    subtitleColor: "#8A4A22",
    chevron: "#C0652E",
    iconStroke: "#C0652E",
    icon: "camera",
  },
  ambiance: {
    title: "Choisir une ambiance",
    subtitle: "Méditerranéen, zen, anglais…",
    bg: "#ECE6F5",
    subtitleColor: "#5E4C8C",
    chevron: "#6A5896",
    iconStroke: "#6A5896",
    icon: "sparkle",
  },
  budget: {
    title: "Indiquer mon budget",
    subtitle: "Une fourchette suffit",
    bg: "#FFFFFF",
    border: "1.5px solid #EEE9E0",
    subtitleColor: "#5B6359",
    chevron: "#6B7268",
    iconStroke: "#4D554B",
    iconBg: "#F2EEE7",
    icon: "budget",
  },
  "coups-de-coeur": {
    title: "Ajouter un coup de cœur",
    subtitle: "Scan ou idée du catalogue",
    bg: "#E6F0E3",
    subtitleColor: "#3F6443",
    chevron: "#4E7B52",
    iconStroke: "#4E7B52",
    icon: "heart",
  },
  "mot-paysagiste": {
    title: "Écrire un mot",
    subtitle: "Pour mon paysagiste",
    bg: "#FFFFFF",
    border: "1.5px solid #EEE9E0",
    subtitleColor: "#5B6359",
    chevron: "#6B7268",
    iconStroke: "#4D554B",
    iconBg: "#F2EEE7",
    icon: "message",
  },
};

export const DOSSIER_STEP_ORDER = [
  "coups-de-coeur",
  "mot-paysagiste",
  "ambiance",
  "terrain",
  "budget",
];
