import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { LEGAL_ROUTES } from "@/lib/legal";
import {
  CLIENT_CONTACT_PROFILE_HINT,
  loadClientContact,
  saveClientContact,
} from "@/lib/clientContact";
import DeleteAccountSheet from "@/components/DeleteAccountSheet";
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
  avatarSize = "default",
  onSignOut,
  onAccountCreated,
  openProfileRequest = null,
  onProfileDismiss,
  onProfileSaved,
}) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    postalCode: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
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

  const loadProfileForm = useCallback(async (notice = "") => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const contact = await loadClientContact();
      setProfile({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phone: contact.phone || "",
        city: contact.city || "",
        postalCode: contact.postalCode || "",
        email: contact.email || userEmail || "",
      });
      setProfileNotice(notice);
      setProfileOpen(true);
    } catch {
      setProfileError("Impossible de charger votre profil.");
    } finally {
      setProfileLoading(false);
    }
  }, [userEmail]);

  const handleOpenProfile = () => {
    closeMenu();
    loadProfileForm("");
  };

  useEffect(() => {
    if (!openProfileRequest?.id) return;
    closeMenu();
    loadProfileForm(openProfileRequest.message || CLIENT_CONTACT_PROFILE_HINT);
  }, [openProfileRequest?.id, openProfileRequest?.message, loadProfileForm]);

  const closeProfileSheet = () => {
    setProfileOpen(false);
    setProfileNotice("");
    setProfileError(null);
    onProfileDismiss?.();
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    const result = await saveClientContact({
      ...profile,
      email: profile.email || userEmail || "",
    });
    setProfileSaving(false);
    if (!result.ok) {
      setProfileError("Enregistrement impossible. Réessayez.");
      return;
    }
    setProfileOpen(false);
    setProfileNotice("");
    onProfileSaved?.();
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
    : avatarSize === "accueil"
      ? {
          width: 44,
          height: 44,
          fontSize: 15,
          borderRadius: 999,
          background: "var(--card, #17241C)",
          color: "var(--ink, #F1ECE2)",
          border: "1px solid var(--line, #2A3A30)",
          boxShadow: "none",
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
                <button
                  type="button"
                  className="wilder-account-menu-item wilder-account-menu-item--muted wilder-account-menu-item--danger"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    setDeleteAccountOpen(true);
                  }}
                >
                  Supprimer mon compte
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
                variant="wilder"
                initialMode={authMode}
                titleKey={authTitleKey}
                subtitleKey={authSubtitleKey}
                onComplete={handleAuthComplete}
              />
            </div>
          </div>,
          document.body
        )}

      <DeleteAccountSheet open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />

      {profileOpen &&
        createPortal(
          <ProfileSheet title={t("premium_menu.profile")} onClose={closeProfileSheet}>
            {profileNotice ? (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "#2F5E3F",
                  background: "#E6F0E3",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                {profileNotice}
              </p>
            ) : null}
            {profileLoading ? (
              <p style={{ margin: 0, fontSize: 14, color: "#5B6359" }}>Chargement…</p>
            ) : (
              <>
                <label className="wilder-account-field">
                  <span>Prénom</span>
                  <input
                    type="text"
                    autoComplete="given-name"
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </label>
                <label className="wilder-account-field">
                  <span>Nom</span>
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </label>
                <label className="wilder-account-field">
                  <span>Téléphone</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                </label>
                <label className="wilder-account-field">
                  <span>Commune</span>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  />
                </label>
                <label className="wilder-account-field">
                  <span>Code postal</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={profile.postalCode}
                    onChange={(e) => setProfile((p) => ({ ...p, postalCode: e.target.value }))}
                  />
                </label>
                <label className="wilder-account-field">
                  <span>{t("cloud.email")}</span>
                  <input
                    type="email"
                    value={profile.email || userEmail || ""}
                    readOnly
                    className="wilder-account-input-readonly"
                  />
                </label>
                {profileError ? (
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "#b42318" }}>{profileError}</p>
                ) : null}
                <button
                  type="button"
                  className="wilder-account-btn-primary"
                  style={{ background: "#2F5E3F" }}
                  disabled={profileSaving}
                  onClick={handleSaveProfile}
                >
                  {profileSaving ? "Enregistrement…" : t("premium_menu.save")}
                </button>
              </>
            )}
          </ProfileSheet>,
          document.body
        )}
    </>
  );
}
