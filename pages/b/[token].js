import Head from "next/head";
import { useRouter } from "next/router";
import ClientBriefFlow from "@/components/pro/ClientBriefFlow";

/** Mock studio résolu plus tard via le token Supabase. */
const MOCK_STUDIO = {
  name: "Atelier Vert",
  contactFirstName: "Julien",
  initials: "AV",
  color: "#2F5E3F",
};

export default function ClientBriefPage() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "test";

  if (!router.isReady) {
    return (
      <div className="wp">
        <div className="phone">
          <div className="bf-loading">Chargement…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Préparez votre RDV — {MOCK_STUDIO.name}</title>
        <meta
          name="description"
          content="Répondez en 3 min, sans compte ni téléchargement. Votre paysagiste reçoit un brief clair avant le premier rendez-vous."
        />
        <meta name="robots" content="noindex" />
      </Head>
      <ClientBriefFlow token={token} studio={MOCK_STUDIO} />
    </>
  );
}
