import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { LEGAL_ROUTES } from "@/lib/legal";
import { loadPremiumProfile, savePremiumProfile } from "@/lib/premiumProfile";
import { shareWilderApp } from "@/lib/share";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const LEGAL_LINKS = [
  { href: LEGAL_ROUTES.mentions, labelKey: "entry_choice.legal_mentions" },
  { href: LEGAL_ROUTES.cgu, labelKey: "entry_choice.legal_cgu" },
  { href: LEGAL_ROUTES.cgv, labelKey: "entry_choice.legal_cgv" },
  { href: LEGAL_ROUTES.privacy, labelKey: "entry_choice.legal_privacy" },
];

function ProfileSheet({ title, onClose, children }) {
  return (
    <div className="wilder-account-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="wilder-account-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-menu-profile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wilder-account-sheet-head">
          <h3 id="account-menu-profile-title" className="wilder-v2-title-section">
            {title}
          </h3>
          <button type="button" className="wilder-account-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AccountMenu({
  t,
  isLoggedIn = false,
  userEmail = "",
  initials = "W",
  onHero = false,
  onSignOut,
  onAccountCreated,
}) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadPremiumProfile());
  const wrapRef = useRef(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocPointer = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  const openAuth = (mode) => {
    closeMenu();
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => setAuthOpen(false);

  const handleAuthComplete = async () => {
    closeAuth();
    await onAccountCreated?.();
  };

  const handleOpenProfile = () => {
    closeMenu();
    setProfile(loadPremiumProfile());
    setProfileOpen(true);
  };

  const handleSaveProfile = () => {
    savePremiumProfile(profile);
    setProfileOpen(false);
  };

  const handleSignOut = async () => {
    closeMenu();
    await onSignOut?.();
  };

  const handleShare = async () => {
    closeMenu();
    try {
      await shareWilderApp();
    } catch {
      /* cancelled */
    }
  };

  const authTitleKey =
    authMode === "signin" ? "account_menu.sign_in_title" : "signup_prompt.auth_title";
  const authSubtitleKey =
    authMode === "signin" ? "account_menu.sign_in_subtitle" : "signup_prompt.auth_subtitle";

  const avatarStyle = onHero
    ? {
        background: "#ffffff33",
        color: "#fff",
        border: "0.5px solid #ffffff55",
      }
    : {
        background: COLORS.greenTint,
        color: COLORS.greenInk,
        border: `0.5px solid ${COLORS.borderStrong}`,
      };

  return (
    <>
      <div className="premium-menu-wrap account-menu-wrap" ref={wrapRef}>
        <button
          type="button"
          className="account-menu-avatar-trigger"
          style={avatarStyle}
          aria-label={t("account_menu.open")}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {initials}
        </button>

        {open && (
          <div className="wilder-account-menu-dropdown" role="menu">
            {isLoggedIn ? (
              <>
                <p className="wilder-account-menu-user-label">{userEmail}</p>
                <button
                  type="button"
                  className="wilder-account-menu-item"
                  role="menuitem"
                  onClick={handleOpenProfile}
                >
                  {t("premium_menu.profile")}
                </button>
                <button
                  type="button"
                  className="wilder-account-menu-item wilder-account-menu-item--muted"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  {t("account_menu.sign_out")}
                </button>
                <div className="wilder-account-menu-separator" aria-hidden="true" />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="wilder-account-menu-item wilder-account-menu-item--primary"
                  role="menuitem"
                  onClick={() => openAuth("signup")}
                >
                  {t("account_menu.create_free")}
                </button>
                <button
                  type="button"
                  className="wilder-account-menu-item"
                  role="menuitem"
                  onClick={() => openAuth("signin")}
                >
                  {t("account_menu.sign_in")}
                </button>
                <div className="wilder-account-menu-separator" aria-hidden="true" />
              </>
            )}
            <button type="button" className="wilder-account-menu-item" role="menuitem" onClick={handleShare}>
              {t("home.share_pill")}
            </button>
            <div className="wilder-account-menu-separator" aria-hidden="true" />
            <nav className="wilder-account-menu-legal" aria-label={t("entry_choice.legal_nav")}>
              {LEGAL_LINKS.map((link, i) => (
                <span key={link.href} className="wilder-account-menu-legal-item">
                  {i > 0 && <span className="wilder-account-menu-legal-sep" aria-hidden="true">·</span>}
                  <Link href={link.href} className="wilder-account-menu-legal-link" onClick={closeMenu}>
                    {t(link.labelKey)}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        )}
      </div>

      {authOpen &&
        createPortal(
          <div className="wilder-auth-modal-overlay" onClick={closeAuth}>
            <div
              className="wilder-auth-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <PremiumAuthStep
                key={authMode}
                t={t}
                initialMode={authMode}
                titleKey={authTitleKey}
                subtitleKey={authSubtitleKey}
                onComplete={handleAuthComplete}
              />
            </div>
          </div>,
          document.body
        )}

      {profileOpen &&
        createPortal(
          <ProfileSheet title={t("premium_menu.profile")} onClose={() => setProfileOpen(false)}>
            <label className="wilder-account-field">
              <span>{t("premium_menu.display_name")}</span>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                placeholder={t("premium_menu.display_name_placeholder")}
              />
            </label>
            <label className="wilder-account-field">
              <span>{t("cloud.email")}</span>
              <input type="email" value={userEmail || ""} readOnly className="wilder-account-input-readonly" />
            </label>
            <button type="button" className="wilder-account-btn-primary" onClick={handleSaveProfile}>
              {t("premium_menu.save")}
            </button>
          </ProfileSheet>,
          document.body
        )}
    </>
  );
}
