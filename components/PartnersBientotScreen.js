import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isPermanentAuthUser } from "@/lib/authUser";
import { getCloudSession, subscribeToAuthSession } from "@/lib/cloudSync";
import { PARTNERS_LIVE } from "@/lib/partners";
import { readPartnersNotify, savePartnersNotifyPreference } from "@/lib/partnersNotify";
import { AT } from "@/lib/atelierCssVars";

export default function PartnersBientotScreen({ onOpenDemo }) {
  const [user, setUser] = useState(null);
  const [notifyOn, setNotifyOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applySession = useCallback((session) => {
    const u = session?.user ?? null;
    setUser(u);
    setNotifyOn(readPartnersNotify(u));
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuthSession(applySession);
    return unsub;
  }, [applySession]);

  if (PARTNERS_LIVE) {
    return (
      <div style={{ flex: 1, padding: 24, color: AT.mute }}>
        Partenaires — mode live (non activé dans cette version).
      </div>
    );
  }

  const permanent = isPermanentAuthUser(user);

  const handleNotify = async () => {
    if (!permanent || notifyOn || saving) return;
    setError("");
    setSaving(true);
    try {
      const result = await savePartnersNotifyPreference();
      if (!result.ok) {
        setError("Impossible d'enregistrer votre préférence. Réessayez.");
        return;
      }
      setNotifyOn(true);
      const session = await getCloudSession().catch(() => null);
      applySession(session);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="atelier-partners">
      <div className="atelier-partners__inner">
        <span className="atelier-partners__pill">Bientôt disponible</span>
        <h1 className="atelier-partners__title">Trouver un paysagiste près de chez vous</h1>
        <p className="atelier-partners__lead">
          Nous sélectionnons nos premiers paysagistes partenaires. Votre dossier jardin sera prêt à leur être
          envoyé en un clic.
        </p>

        {permanent ? (
          <button
            type="button"
            className={notifyOn ? "atelier-btn-secondary atelier-partners__notify-done" : "atelier-btn-primary"}
            disabled={notifyOn || saving}
            onClick={handleNotify}
          >
            {notifyOn ? "✓ Vous serez prévenu" : saving ? "Patientez…" : "Me prévenir"}
          </button>
        ) : (
          <div className="atelier-partners__guest">
            <p className="atelier-partners__guest-msg">Créez votre compte pour être prévenu</p>
            <Link href="/connexion?profil=particulier&mode=signup" className="atelier-btn-primary atelier-partners__signup">
              Créer un compte
            </Link>
          </div>
        )}

        {error ? (
          <p className="atelier-partners__error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="button" className="atelier-partners__demo-link" onClick={() => onOpenDemo?.()}>
          Voir un exemple de page partenaire
        </button>
      </div>
    </div>
  );
}
