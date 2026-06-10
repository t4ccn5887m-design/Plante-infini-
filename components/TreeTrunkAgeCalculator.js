import { useState } from "react";
import { loadDiscoveries, saveDiscoveries } from "@/lib/discoveriesStorage";
import { isTreeLikeAnalysis, parseDiameterCm } from "@/lib/treeAge";

async function parseApiResponse(res) {
  const text = await res.text();
  try {
    return { data: JSON.parse(text), parseError: false };
  } catch {
    return { data: null, parseError: true };
  }
}

export default function TreeTrunkAgeCalculator({ data, t, lang = "fr", discoveryId, embedded = false }) {
  const [diameter, setDiameter] = useState(
    () => (data?.tronc_diametre_cm != null ? String(data.tronc_diametre_cm) : "")
  );
  const [result, setResult] = useState(() =>
    data?.age_precis_tronc
      ? {
          age_ans: data.age_precis_tronc,
          diametre_cm: data.tronc_diametre_cm,
          coefficient: data.age_precis_coefficient ?? null,
          note: data.age_precis_note ?? null,
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isTreeLikeAnalysis(data)) return null;

  const persist = (payload) => {
    if (!discoveryId) return;
    const items = loadDiscoveries();
    const idx = items.findIndex((d) => d.id === discoveryId);
    if (idx === -1) return;
    items[idx] = {
      ...items[idx],
      tronc_diametre_cm: payload.diametre_cm,
      age_precis_tronc: payload.age_ans,
      age_precis_coefficient: payload.coefficient,
      age_precis_note: payload.note,
    };
    saveDiscoveries(items);
  };

  const handleCalculate = async () => {
    const diametreCm = parseDiameterCm(diameter);
    if (diametreCm == null) {
      setError(t("tree_age.invalid_diameter"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tree-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.nom,
          nom_latin: data.nom_latin,
          famille: data.famille,
          diametre_cm: diametreCm,
          age_approximatif: data.age_approximatif,
          lang,
        }),
      });

      const { data: apiData, parseError } = await parseApiResponse(res);
      if (parseError || !apiData) {
        setError(t("tree_age.error"));
        return;
      }
      if (!res.ok || apiData.erreur) {
        setError(apiData.erreur || t("tree_age.error"));
        return;
      }

      setResult(apiData);
      persist(apiData);
    } catch {
      setError(t("tree_age.error"));
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {!embedded && <div className="tree-trunk-age-title">{t("tree_age.title")}</div>}
      <p className="tree-trunk-age-hint">{t("tree_age.hint")}</p>

      <div className="tree-trunk-age-row">
        <input
          className="tree-trunk-age-input"
          type="number"
          inputMode="decimal"
          min="1"
          step="0.1"
          value={diameter}
          onChange={(e) => setDiameter(e.target.value)}
          placeholder={t("tree_age.placeholder")}
          disabled={loading}
          aria-label={t("tree_age.placeholder")}
        />
        <span className="tree-trunk-age-unit">{t("tree_age.unit")}</span>
        <button
          type="button"
          className="btn-primary tree-trunk-age-btn"
          onClick={handleCalculate}
          disabled={loading || !diameter.trim()}
        >
          {loading ? t("tree_age.loading") : t("tree_age.calculate")}
        </button>
      </div>

      {error && (
        <p className="tree-trunk-age-error" role="alert">
          {error}
        </p>
      )}

      {result?.age_ans != null && (
        <div className="tree-trunk-age-result" role="status">
          <p className="tree-trunk-age-result-main">
            {t("tree_age.result", {
              diameter: result.diametre_cm ?? diameter,
              age: result.age_ans,
            })}
          </p>
          {result.note && <p className="tree-trunk-age-result-note">{result.note}</p>}
        </div>
      )}
    </>
  );

  return (
    <div className={`tree-trunk-age${embedded ? " tree-trunk-age--embedded" : ""}`}>
      {content}
    </div>
  );
}
