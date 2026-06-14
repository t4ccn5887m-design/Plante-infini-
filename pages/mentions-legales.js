// À FAIRE VALIDER PAR UN JURISTE - texte non contractuel

import LegalPageLayout from "@/components/LegalPageLayout";
import { mentionsLegalesSections } from "@/lib/legalContent";

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout
      title="Mentions légales"
      description="Mentions légales de l'application Wilder."
      sections={mentionsLegalesSections}
    />
  );
}
