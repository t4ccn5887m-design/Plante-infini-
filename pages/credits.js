import Head from "next/head";
import Link from "next/link";
import { getCataloguePhotoCreditsList } from "@/lib/catalogueCreditsData";

export async function getStaticProps() {
  return {
    props: {
      items: getCataloguePhotoCreditsList(),
    },
  };
}

export default function CreditsPage({ items }) {
  return (
    <>
      <Head>
        <title>Crédits photos — catalogue végétal</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "#F2EEE7",
          fontFamily: "system-ui, sans-serif",
          color: "#1F2A22",
          padding: "24px 16px 48px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link href="/mentions-legales" style={{ fontSize: 14, color: "#5B6359" }}>
            ← Mentions légales
          </Link>
          <h1 style={{ margin: "16px 0 8px", fontSize: 26, fontWeight: 700 }}>
            Crédits — photographies du catalogue végétal
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#5B6359", lineHeight: 1.5 }}>
            Liste des illustrations utilisées dans le catalogue lorsqu&apos;une photo est associée à une fiche
            plante. Les images peuvent avoir été redimensionnées ; certaines ont un fond blanc généré localement
            (détourage).
          </p>

          {items.length === 0 ? (
            <p style={{ fontSize: 14 }}>Aucune photo publiée dans le catalogue pour le moment.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #EEE9E0",
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {item.nom}
                    {item.univers ? (
                      <span style={{ fontWeight: 500, color: "#6B7268", fontSize: 13 }}>
                        {" "}
                        · {item.univers}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 13, fontStyle: "italic", color: "#5B6359", marginBottom: 8 }}>
                    {item.nom_latin}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#3D4540" }}>
                    <strong>Source :</strong> {item.photo_source || "—"}
                    <br />
                    <strong>Auteur :</strong> {item.photo_auteur || "—"}
                    <br />
                    {item.photo_licence ? (
                      <>
                        <strong>Licence :</strong>{" "}
                        {item.photo_licence_url ? (
                          <a href={item.photo_licence_url} target="_blank" rel="noopener noreferrer">
                            {item.photo_licence}
                          </a>
                        ) : (
                          item.photo_licence
                        )}
                        <br />
                      </>
                    ) : null}
                    {item.photo_lien ? (
                      <>
                        <strong>Fichier :</strong>{" "}
                        <a href={item.photo_lien} target="_blank" rel="noopener noreferrer">
                          page d&apos;origine
                        </a>
                        <br />
                      </>
                    ) : null}
                    {item.photo_detouree === "oui" ? (
                      <span style={{ color: "#6B7268" }}>Fond blanc (image modifiée)</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
