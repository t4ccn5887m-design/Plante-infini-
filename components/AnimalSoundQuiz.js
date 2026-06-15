import { useCallback, useEffect, useRef, useState } from "react";
import { isFaunaType } from "@/lib/fauna";
import { playUrl, stopCurrentSound } from "@/lib/sounds";

const PHASE = {
  idle: "idle",
  loading: "loading",
  playing: "playing",
  quiz: "quiz",
  yes: "yes",
  funFact: "funFact",
  error: "error",
};

export default function AnimalSoundQuiz({ data, t }) {
  const [phase, setPhase] = useState(PHASE.idle);
  const [credit, setCredit] = useState(null);
  const [errorKey, setErrorKey] = useState("sound_error");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCurrentSound();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    setPhase(PHASE.idle);
    setCredit(null);
    setErrorKey("sound_error");
    stopCurrentSound();
  }, [data?.nom, data?.nom_latin, data?.type]);

  if (!data) return null;

  const funFact =
    data.fun_fact ||
    data.anecdotes ||
    (data.description ? data.description.split(/(?<=[.!?])\s+/)[0] : null);

  const listen = useCallback(async () => {
    if (!isFaunaType(data.type)) return;

    stopCurrentSound();
    setPhase(PHASE.loading);
    setCredit(null);

    try {
      const params = new URLSearchParams({
        type: data.type,
        nom: data.nom || "",
        nom_latin: data.nom_latin || "",
      });
      const res = await fetch(`/api/animal-sound?${params}`);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          payload.erreur === "freesound_key_missing" ||
          payload.erreur === "xeno_canto_key_missing"
        ) {
          setErrorKey("sound_config");
        }
        if (!mountedRef.current) return;
        setPhase(PHASE.error);
        return;
      }

      if (!mountedRef.current) return;
      setCredit(payload.credit);
      setPhase(PHASE.playing);

      const ok = await playUrl(payload.url);
      if (!mountedRef.current) return;

      if (ok) {
        setPhase(PHASE.quiz);
      } else {
        setPhase(PHASE.error);
      }
    } catch {
      if (mountedRef.current) setPhase(PHASE.error);
    }
  }, [data.type, data.nom, data.nom_latin]);

  if (!isFaunaType(data.type)) return null;

  return (
    <div className="animal-sound-quiz">
      {phase === PHASE.idle && (
        <button type="button" className="btn-sound-listen" onClick={listen}>
          {t("sound.listen")}
        </button>
      )}

      {phase === PHASE.loading && (
        <div className="animal-sound-status">
          <span className="animal-sound-pulse" aria-hidden="true">🔊</span>
          {t("sound.loading")}
        </div>
      )}

      {phase === PHASE.playing && (
        <div className="animal-sound-status animal-sound-status-active">
          <span className="animal-sound-wave" aria-hidden="true">
            <span /><span /><span /><span />
          </span>
          {t("sound.playing")}
        </div>
      )}

      {phase === PHASE.error && (
        <div className="animal-sound-error">
          <p>{t(`sound.${errorKey}`)}</p>
          <button type="button" className="btn-secondary btn-sound-retry" onClick={listen}>
            {t("sound.retry")}
          </button>
        </div>
      )}

      {phase === PHASE.quiz && (
        <div className="animal-sound-quiz-panel screen-enter-fast">
          <p className="animal-sound-quiz-question">{t("sound.quiz_question")}</p>
          <div className="animal-sound-quiz-actions">
            <button
              type="button"
              className="btn-sound-yes"
              onClick={() => setPhase(PHASE.yes)}
            >
              {t("sound.yes")}
            </button>
            <button
              type="button"
              className="btn-sound-no"
              onClick={() => setPhase(PHASE.funFact)}
            >
              {t("sound.no")}
            </button>
          </div>
          {credit && (
            <p className="animal-sound-credit">
              {t("sound.credit")} {credit}
            </p>
          )}
        </div>
      )}

      {phase === PHASE.yes && (
        <div className="animal-sound-response animal-sound-response-yes screen-enter-fast">
          <p>{t("sound.yes_response")}</p>
          <button type="button" className="btn-secondary btn-sound-retry" onClick={listen}>
            {t("sound.listen_again")}
          </button>
        </div>
      )}

      {phase === PHASE.funFact && funFact && (
        <div className="animal-sound-funfact screen-enter-fast">
          <div className="animal-sound-funfact-badge">{t("sound.fun_fact_title")}</div>
          <p>{funFact}</p>
          <button type="button" className="btn-secondary btn-sound-retry" onClick={listen}>
            {t("sound.listen_again")}
          </button>
        </div>
      )}

      {phase === PHASE.funFact && !funFact && (
        <div className="animal-sound-response screen-enter-fast">
          <p>{t("sound.no_response")}</p>
          <button type="button" className="btn-secondary btn-sound-retry" onClick={listen}>
            {t("sound.listen_again")}
          </button>
        </div>
      )}
    </div>
  );
}
