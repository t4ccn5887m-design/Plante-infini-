import { useState, useEffect, useCallback } from "react";
import { loadStoredLocation, requestLocationPermission } from "@/lib/permissions";
import { fetchNurseriesNearby } from "@/lib/nurseriesNearby";
import { fetchPotagerIdeas } from "@/lib/potagerIdeas";

function IdeaItem({ idea, t }) {
  const [open, setOpen] = useState(false);
  const typeKey = `themes.potager.ideas_type_${idea.type}`;
  const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : idea.type;

  return (
    <article className="potager-idea">
      <button
        type="button"
        className="potager-idea-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="potager-idea-emoji" aria-hidden="true">
          {idea.emoji}
        </span>
        <span className="potager-idea-title-wrap">
          <span className="potager-idea-title">{idea.nom}</span>
          <span className="potager-idea-meta">
            {typeLabel}
            {idea.quand && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{idea.quand}</span>
              </>
            )}
          </span>
        </span>
        <span className="potager-idea-chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="potager-idea-body">
          {idea.comment && <p className="potager-idea-how">{idea.comment}</p>}
          {idea.pepiniere && (
            <p className="potager-idea-nursery">
              <span className="potager-idea-nursery-label">
                {t("themes.potager.ideas_nursery_label")}
              </span>{" "}
              {idea.pepiniere}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default function PotagerIdeasCard({ t, lang }) {
  const [idees, setIdees] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    let loc = loadStoredLocation();
    if (!loc?.latitude || !loc?.longitude) {
      const result = await requestLocationPermission();
      if (result.ok) loc = result.location;
    }

    if (!loc?.latitude || !loc?.longitude) {
      setIdees([]);
      setStatus("no_location");
      return;
    }

    try {
      const nurseries = await fetchNurseriesNearby(loc.latitude, loc.longitude).catch(() => []);
      const { idees: list } = await fetchPotagerIdeas({
        region: loc.placeName || null,
        lang,
        nurseries: nurseries.slice(0, 8),
      });
      setIdees(list);
      setStatus(list.length ? "ready" : "empty");
    } catch (e) {
      setIdees([]);
      setError(e?.message || "error");
      setStatus("error");
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="potager-ideas" aria-labelledby="potager-ideas-heading">
      <div className="potager-ideas-head">
        <h2 id="potager-ideas-heading" className="potager-ideas-title">
          {t("themes.potager.ideas_title")}
        </h2>
        <p className="potager-ideas-subtitle">{t("themes.potager.ideas_subtitle")}</p>
      </div>

      {status === "no_location" && (
        <div className="potager-ideas-muted">
          <p>{t("themes.potager.ideas_no_location")}</p>
          <button type="button" className="potager-ideas-location-btn" onClick={load}>
            {t("themes.potager.ideas_enable_location")}
          </button>
        </div>
      )}

      {status === "loading" && (
        <p className="potager-ideas-loading">{t("themes.potager.ideas_loading")}</p>
      )}

      {status === "error" && (
        <div className="potager-ideas-error-wrap">
          <p className="potager-ideas-error">{t("themes.potager.ideas_error")}</p>
          <button type="button" className="potager-ideas-retry" onClick={load}>
            {t("themes.potager.ideas_retry")}
          </button>
        </div>
      )}

      {status === "empty" && (
        <p className="potager-ideas-empty">{t("themes.potager.ideas_empty")}</p>
      )}

      {status === "ready" && (
        <div className="potager-ideas-list">
          {idees.map((idea, i) => (
            <IdeaItem key={`${idea.nom}-${i}`} idea={idea} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}
