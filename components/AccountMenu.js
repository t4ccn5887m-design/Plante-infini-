import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { loadPremiumProfile } from "@/lib/premiumProfile";

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 14.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M4.5 16.5c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatUserLabel(displayName, email) {
  const name = displayName?.trim();
  if (name) return name;
  const mail = email?.trim();
  if (!mail) return "";
  const local = mail.split("@")[0];
  return local || mail;
}

export default function AccountMenu({
  t,
  isLoggedIn = false,
  userEmail = "",
  onOpenHerbier,
  onSignOut,
  onAccountCreated,
}) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [profileName, setProfileName] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileName(loadPremiumProfile().displayName || "");
  }, [isLoggedIn, userEmail, authOpen]);

  const userLabel = useMemo(
    () => formatUserLabel(profileName, userEmail),
    [profileName, userEmail]
  );

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

  const handleOpenHerbier = () => {
    closeMenu();
    onOpenHerbier?.();
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
          {isLoggedIn ? <IconUser /> : <IconMenu />}
        </button>

        {open && (
          <div className="premium-menu-dropdown account-menu-dropdown" role="menu">
            {isLoggedIn ? (
              <>
                {userLabel && (
                  <p className="account-menu-user-label" role="presentation">{userLabel}</p>
                )}
                <button
                  type="button"
                  className="premium-menu-item"
                  role="menuitem"
                  onClick={handleOpenHerbier}
                >
                  {t("account_menu.herbier")}
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
    </>
  );
}
