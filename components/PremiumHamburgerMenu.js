import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildBiodexCollection } from "@/lib/biodex";
import { getPremiumPlan, getPremiumRenewalDate } from "@/lib/freemium";
import { loadPremiumProfile, savePremiumProfile } from "@/lib/premiumProfile";
import { openStripeCustomerPortal } from "@/lib/scanQuotaClient";
import { shareWilderApp } from "@/lib/share";

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 14.5h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function MenuSheet({ title, onClose, children }) {
  return (
    <div className="premium-menu-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="premium-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-menu-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-menu-sheet-head">
          <h3 id="premium-menu-sheet-title">{title}</h3>
          <button type="button" className="premium-menu-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PremiumHamburgerMenu({
  t,
  locale,
  userEmail,
  discoveries = [],
  scanCount = 0,
  onNavigateStats,
  onSignOut,
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false);
  const [profile, setProfile] = useState(() => loadPremiumProfile());
  const wrapRef = useRef(null);

  const speciesCount = useMemo(
    () => buildBiodexCollection(discoveries).caughtCount,
    [discoveries]
  );

  const plan = getPremiumPlan();
  const renewalDate = getPremiumRenewalDate();
  const renewalLabel = renewalDate
    ? renewalDate.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : t("premium_menu.renewal_unknown");

  const planLabel =
    plan === "yearly" ? t("premium_menu.plan_yearly") : t("premium_menu.plan_monthly");

  const closeAll = useCallback(() => {
    setOpen(false);
    setPanel(null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocPointer = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  const handleShare = async () => {
    closeAll();
    try {
      await shareWilderApp({
        speciesCount,
        isLoggedIn: Boolean(userEmail?.trim()),
      });
    } catch {
      /* cancelled */
    }
  };

  const handleSaveProfile = () => {
    savePremiumProfile(profile);
    setPanel(null);
  };

  const handleUnsubscribe = async () => {
    setConfirmUnsubscribe(false);
    closeAll();
    await openStripeCustomerPortal();
  };

  const handleSignOut = async () => {
    closeAll();
    await onSignOut?.();
  };

  return (
    <div className="premium-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="premium-menu-trigger"
        aria-label={t("premium_menu.open")}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <IconMenu />
      </button>

      {open && (
        <div className="premium-menu-dropdown" role="menu">
          <button
            type="button"
            className="premium-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPanel("profile");
            }}
          >
            {t("premium_menu.profile")}
          </button>
          <button
            type="button"
            className="premium-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPanel("contact");
            }}
          >
            {t("premium_menu.contact")}
          </button>
          <button
            type="button"
            className="premium-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPanel("subscription");
            }}
          >
            {t("premium_menu.subscription")}
          </button>
          <button
            type="button"
            className="premium-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPanel("stats");
            }}
          >
            {t("premium_menu.stats")}
          </button>
          <button type="button" className="premium-menu-item" role="menuitem" onClick={handleShare}>
            {t("premium_menu.share")}
          </button>
          <div className="premium-menu-separator" aria-hidden="true" />
          <button
            type="button"
            className="premium-menu-item premium-menu-item--muted"
            role="menuitem"
            onClick={() => setConfirmUnsubscribe(true)}
          >
            {t("premium_menu.unsubscribe")}
          </button>
          <button
            type="button"
            className="premium-menu-item premium-menu-item--muted"
            role="menuitem"
            onClick={handleSignOut}
          >
            {t("premium_menu.sign_out")}
          </button>
        </div>
      )}

      {panel === "profile" && (
        <MenuSheet title={t("premium_menu.profile")} onClose={() => setPanel(null)}>
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
        </MenuSheet>
      )}

      {panel === "contact" && (
        <MenuSheet title={t("premium_menu.contact")} onClose={() => setPanel(null)}>
          <label className="premium-menu-field">
            <span>{t("premium_menu.phone")}</span>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder={t("premium_menu.phone_placeholder")}
            />
          </label>
          <label className="premium-menu-field">
            <span>{t("premium_menu.address")}</span>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              placeholder={t("premium_menu.address_placeholder")}
              rows={3}
            />
          </label>
          <button type="button" className="btn-primary premium-menu-save" onClick={handleSaveProfile}>
            {t("premium_menu.save")}
          </button>
        </MenuSheet>
      )}

      {panel === "subscription" && (
        <MenuSheet title={t("premium_menu.subscription")} onClose={() => setPanel(null)}>
          <dl className="premium-menu-details">
            <div>
              <dt>{t("premium_menu.plan_type")}</dt>
              <dd>{planLabel}</dd>
            </div>
            <div>
              <dt>{t("premium_menu.renewal_date")}</dt>
              <dd>{renewalLabel}</dd>
            </div>
          </dl>
        </MenuSheet>
      )}

      {panel === "stats" && (
        <MenuSheet title={t("premium_menu.stats")} onClose={() => setPanel(null)}>
          <dl className="premium-menu-details">
            <div>
              <dt>{t("premium_menu.scan_count")}</dt>
              <dd>{scanCount}</dd>
            </div>
            <div>
              <dt>{t("premium_menu.species_count")}</dt>
              <dd>{speciesCount}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn-secondary premium-menu-save"
            onClick={() => {
              setPanel(null);
              closeAll();
              onNavigateStats?.();
            }}
          >
            {t("premium_menu.view_all_stats")}
          </button>
        </MenuSheet>
      )}

      <DeleteConfirmDialog
        open={confirmUnsubscribe}
        message={t("premium_menu.unsubscribe_confirm")}
        cancelLabel={t("albums.cancel")}
        confirmLabel={t("premium_menu.unsubscribe")}
        onCancel={() => setConfirmUnsubscribe(false)}
        onConfirm={handleUnsubscribe}
      />
    </div>
  );
}
