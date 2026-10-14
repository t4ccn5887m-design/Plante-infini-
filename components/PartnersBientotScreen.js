import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isPermanentAuthUser } from "@/lib/authUser";
import { getCloudSession, subscribeToAuthSession } from "@/lib/cloudSync";
import { PARTNERS_LIVE } from "@/lib/partners";
import { readPartnersNotify, savePartnersNotifyPreference } from "@/lib/partnersNotify";

import { SEVYA_DEMO_RENDU_3D } from "@/lib/sevyaDemoRenders";

const HERO = SEVYA_DEMO_RENDU_3D;

export default function PartnersBientotScreen({ onOpenDemo }) {
  const router = useRouter();
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
      <div style={{ flex: 1, padding: 24, color: "var(--mute)" }}>
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
    <div className="atelier-partners-v2">
      <div className="atelier-partners-v2__hero">
        <img src={HERO} alt="" />
        <div className="atelier-partners-v2__hero-shade" aria-hidden="true" />
        <div className="atelier-partners-v2__hero-cap">
          <span className="atelier-label">Bientôt disponible</span>
          <h1 className="atelier-partners-v2__hero-title">
            Les paysagistes de votre région, et leurs réalisations.
          </h1>
        </div>
      </div>

      <p className="atelier-partners-v2__lead">
        Nous sélectionnons nos premiers paysagistes partenaires. Votre dossier jardin sera prêt à leur être
        envoyé en un clic.
      </p>

      {permanent ? (
        <button
          type="button"
          className={notifyOn ? "atelier-btn-outline atelier-partners__notify-done" : "atelier-btn-fill"}
          disabled={notifyOn || saving}
          onClick={handleNotify}
        >
          {notifyOn ? "✓ Vous serez prévenu" : saving ? "Patientez…" : "Me prévenir"}
        </button>
      ) : (
        <div className="atelier-partners__guest">
          <p className="atelier-partners__guest-msg">Créez votre compte pour être prévenu</p>
          <button
            type="button"
            className="atelier-btn-outline atelier-partners__signup"
            onClick={() => router.push("/connexion?profil=particulier&mode=signup")}
          >
            Créer un compte
          </button>
        </div>
      )}

      {error ? (
        <p className="atelier-partners__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="atelier-btn-outline atelier-partners-v2__preview" onClick={() => onOpenDemo?.()}>
        Voir l&apos;aperçu
      </button>
    </div>
  );
}
