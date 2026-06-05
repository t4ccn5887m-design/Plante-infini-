import PotagerCareJournal from "@/components/PotagerCareJournal";
import PotagerDailyCareTasks from "@/components/PotagerDailyCareTasks";

export default function PotagerDailyCareResult({
  session,
  t,
  lang,
  journalRefreshKey = 0,
  onBack,
  onToggleTask,
  onNewPhoto,
}) {
  if (!session) return null;

  return (
    <div className="potager-daily-care-result screen-enter">
      <button
        type="button"
        className="potager-scan-back"
        onClick={onBack}
        aria-label={t("themes.potager.back_to_garden")}
      >
        ← {t("themes.potager.back_to_garden")}
      </button>

      {session.photo && (
        <div className="potager-scan-photo-wrap">
          <img src={session.photo} alt="" className="potager-scan-photo" />
        </div>
      )}

      <div className="potager-daily-care-result-content">
        <h1 className="potager-daily-care-result-title">{t("themes.potager.daily_care_title")}</h1>
        <p className="potager-daily-care-result-sub">{t("themes.potager.daily_care_subtitle")}</p>

        <PotagerDailyCareTasks session={session} t={t} onToggleTask={onToggleTask} />
        <PotagerCareJournal t={t} lang={lang} refreshKey={journalRefreshKey} />
      </div>

      <button type="button" className="potager-daily-care-new-photo" onClick={onNewPhoto}>
        📸 {t("themes.potager.daily_care_new_photo")}
      </button>
    </div>
  );
}
