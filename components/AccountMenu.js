import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { loadPremiumProfile, savePremiumProfile } from "@/lib/premiumProfile";

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 14.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ProfileSheet({ title, onClose, children }) {
  return (
    <div className="premium-menu-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="premium-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-menu-profile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-menu-sheet-head">
          <h3 id="account-menu-profile-title">{title}</h3>
          <button type="button" className="premium-menu-sheet-close" onClick={onClose} aria-label="Fermer">
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

  const authTitleKey =
    authMode === "signin" ? "account_menu.sign_in_title" : "signup_prompt.auth_title";
  const authSubtitleKey =
    authMode === "signin" ? "account_menu.sign_in_subtitle" : "signup_prompt.auth_subtitle";

  return (
    <>
      <div className="premium-menu-wrap account-menu-wrap" ref={wrapRef}>
        <button
          type="button"
          className="premium-menu-trigger"
          aria-label={t("account_menu.open")}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          <IconMenu />
        </button>

        {open && (
          <div className="premium-menu-dropdown account-menu-dropdown" role="menu">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="premium-menu-item"
                  role="menuitem"
                  onClick={handleOpenProfile}
                >
                  {t("premium_menu.profile")}
                </button>
                <div className="premium-menu-separator" aria-hidden="true" />
                <button
                  type="button"
                  className="premium-menu-item premium-menu-item--muted"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  {t("account_menu.sign_out")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="premium-menu-item"
                  role="menuitem"
                  onClick={() => openAuth("signup")}
                >
                  {t("account_menu.create_free")}
                </button>
                <button
                  type="button"
                  className="premium-menu-item"
                  role="menuitem"
                  onClick={() => openAuth("signin")}
                >
                  {t("account_menu.sign_in")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {authOpen &&
        createPortal(
          <div className="modal-overlay signup-prompt-modal-overlay" onClick={closeAuth}>
            <div
              className="modal-sheet signup-prompt-modal"
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
            <label className="premium-menu-field">
              <span>{t("premium_menu.display_name")}</span>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                placeholder={t("premium_menu.display_name_placeholder")}
              />
            </label>
            <label className="premium-menu-field">
              <span>{t("cloud.email")}</span>
              <input type="email" value={userEmail || ""} readOnly className="premium-menu-input-readonly" />
            </label>
            <button type="button" className="btn-primary premium-menu-save" onClick={handleSaveProfile}>
              {t("premium_menu.save")}
            </button>
          </ProfileSheet>,
          document.body
        )}
    </>
  );
}
