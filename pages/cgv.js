// À FAIRE VALIDER PAR UN JURISTE - texte non contractuel

import LegalPageLayout from "@/components/LegalPageLayout";
import { cgvSections } from "@/lib/legalContent";

export default function CgvPage() {
  return (
    <LegalPageLayout
      title="Conditions Générales de Vente"
      description="CGV et abonnements Premium Wilder."
      sections={cgvSections}
    />
  );
}
