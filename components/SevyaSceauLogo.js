/** Sceau Sevya (grand format) — connexion / choix pro · particulier. */
export default function SevyaSceauLogo({ size = 96, className = "" }) {
  return (
    <div className={`sv-sceau ${className}`.trim()} aria-label="Sevya">
      <img
        src="/brand/sceau-blanc.svg"
        alt=""
        width={size}
        height={size}
        style={{ display: "block", width: size, height: "auto" }}
      />
    </div>
  );
}
