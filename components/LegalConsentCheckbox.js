import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/legal";

export function CguConsentCheckbox({ checked, onChange, disabled = false, className = "" }) {
  return (
    <label className={`legal-consent legal-consent--cgu ${className}`.trim()}>
      <input
        type="checkbox"
        className="legal-consent-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="legal-consent-text">
        J&apos;accepte les{" "}
        <Link href={LEGAL_ROUTES.cgu} target="_blank" rel="noopener noreferrer">
          CGU
        </Link>
        {" "}et la{" "}
        <Link href={LEGAL_ROUTES.privacy} target="_blank" rel="noopener noreferrer">
          politique de confidentialité
        </Link>
      </span>
    </label>
  );
}

export function CgvConsentCheckbox({ checked, onChange, disabled = false, className = "" }) {
  return (
    <label className={`legal-consent legal-consent--cgv ${className}`.trim()}>
      <input
        type="checkbox"
        className="legal-consent-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="legal-consent-text">
        J&apos;accepte les{" "}
        <Link href={LEGAL_ROUTES.cgv} target="_blank" rel="noopener noreferrer">
          CGV
        </Link>
        {" "}et je renonce à mon droit de rétractation pour un accès immédiat au service
      </span>
    </label>
  );
}
