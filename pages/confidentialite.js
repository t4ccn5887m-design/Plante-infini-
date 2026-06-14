// À FAIRE VALIDER PAR UN JURISTE - texte non contractuel

import LegalPageLayout from "@/components/LegalPageLayout";
import { privacySections } from "@/lib/legalContent";

export default function ConfidentialitePage() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      description="Politique de confidentialité et données personnelles Wilder."
      sections={privacySections}
    />
  );
}
