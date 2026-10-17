// À FAIRE VALIDER PAR UN JURISTE - texte non contractuel

import LegalPageLayout from "@/components/LegalPageLayout";
import { cguSections } from "@/lib/legalContent";

export default function CguPage() {
  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      description="Conditions générales d'utilisation de Sevya."
      sections={cguSections}
    />
  );
}
