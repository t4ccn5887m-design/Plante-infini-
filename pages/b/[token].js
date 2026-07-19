import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ClientBriefFlow from "@/components/pro/ClientBriefFlow";
import {
  clientBriefErrorMessage,
  loadProLinkByToken,
} from "@/lib/pro/clientBriefApi";

function BriefGateMessage({ title, body }) {
  return (
    <div className="wp wp-brief">
      <div className="phone">
        <div className="bf-screen">
          <div className="bf-step bf-gate">
            <h1 className="bf-title">{title}</h1>
            <p className="bf-sub">{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientBriefPage() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token.trim() : "";

  const [phase, setPhase] = useState("loading"); // loading | ready | filled | error
  const [studio, setStudio] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    (async () => {
      if (!token) {
        if (!cancelled) {
          setPhase("error");
          setErrorCode("missing_token");
        }
        return;
      }

      setPhase("loading");
      const result = await loadProLinkByToken(token);
      if (cancelled) return;

      if (!result.ok) {
        setPhase("error");
        setErrorCode(result.error);
        return;
      }

      setStudio(result.studio);
      if (result.link.status === "filled") {
        setPhase("filled");
      } else {
        setPhase("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, token]);

  const titleStudio = studio?.name || "votre paysagiste";

  if (!router.isReady || phase === "loading") {
    return (
      <div className="wp wp-brief">
        <div className="phone">
          <div className="bf-loading">Chargement…</div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <>
        <Head>
          <title>Lien introuvable</title>
          <meta name="robots" content="noindex" />
        </Head>
        <BriefGateMessage
          title="Lien introuvable"
          body={clientBriefErrorMessage(errorCode)}
        />
      </>
    );
  }

  if (phase === "filled") {
    return (
      <>
        <Head>
          <title>Brief déjà envoyé — {titleStudio}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <BriefGateMessage
          title="Brief déjà envoyé"
          body={`${studio.contactFirstName || "Votre paysagiste"} a déjà reçu votre brief. À bientôt au rendez-vous !`}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Préparez votre RDV — {studio.name}</title>
        <meta
          name="description"
          content="Répondez en 3 min, sans compte ni téléchargement. Votre paysagiste reçoit un brief clair avant le premier rendez-vous."
        />
        <meta name="robots" content="noindex" />
      </Head>
      <ClientBriefFlow token={token} studio={studio} />
    </>
  );
}
