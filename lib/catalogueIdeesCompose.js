import { countVisibleGardenStyles, hasVisibleGardenStyles } from "@/lib/catalogueGardenStyles";
import { getActiveCatalogueBordures } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";

/** Cases « Composer mon jardin » (maquette sevya/12-idees-v3.html). */
export function buildIdeesComposerCards() {
  const cards = [
    {
      id: "vegetal",
      title: "Végétal",
      subtitle: "Arbres, arbustes, fleurs, graminées",
      count: getActiveCataloguePlants().length,
      bg: "#E6F0E3",
      iconStroke: "#4E7B52",
      subtitleColor: "#3F6443",
      icon: "leaf",
    },
    {
      id: "mineral",
      title: "Paillages",
      subtitle: "Graviers, galets, écorces",
      count: getActiveCatalogueMinerals().length,
      bg: "#EEEAE3",
      iconStroke: "#5F665D",
      subtitleColor: "#4D554B",
      icon: "paillages",
    },
  ];

  const borduresCount = getActiveCatalogueBordures().length;
  if (borduresCount > 0) {
    cards.push({
      id: "bordures",
      title: "Bordures",
      subtitle: "Corten, bois, pierre, brique",
      count: borduresCount,
      bg: "#F6E7D8",
      iconStroke: "#C0652E",
      subtitleColor: "#8A4A22",
      icon: "bordures",
    });
  }

  if (hasVisibleGardenStyles()) {
    cards.push({
      id: "styles",
      title: "Styles de jardin",
      subtitle: "Méditerranéen, zen, champêtre…",
      count: countVisibleGardenStyles(),
      bg: "#ECE6F5",
      iconStroke: "#6A5896",
      subtitleColor: "#5E4C8C",
      icon: "styles",
    });
  }

  return cards;
}
