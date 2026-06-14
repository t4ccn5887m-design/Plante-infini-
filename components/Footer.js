import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/legal";

const LINKS = [
  { href: LEGAL_ROUTES.mentions, label: "Mentions légales" },
  { href: LEGAL_ROUTES.cgu, label: "CGU" },
  { href: LEGAL_ROUTES.cgv, label: "CGV" },
  { href: LEGAL_ROUTES.privacy, label: "Confidentialité" },
];

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <nav className="site-footer-nav" aria-label="Informations légales">
        {LINKS.map((link, i) => (
          <span key={link.href} className="site-footer-item">
            {i > 0 && <span className="site-footer-sep" aria-hidden="true">·</span>}
            <Link href={link.href} className="site-footer-link">
              {link.label}
            </Link>
          </span>
        ))}
      </nav>
    </footer>
  );
}
