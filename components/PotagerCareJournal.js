import { useMemo } from "react";
import { getLocale } from "@/lib/i18n";
import { groupCareJournalByDate, loadCareJournal } from "@/lib/potagerCareJournal";
import { healthEmoji } from "@/lib/potagerDailyCare";

function formatJournalDay(dateKey, locale, t) {
  const today = new Date().toISOString().slice(0, 10);
  if (dateKey === today) return t("themes.potager.care_journal_today");

  try {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateKey;
  }
}

export default function PotagerCareJournal({ t, lang, refreshKey = 0 }) {
  const locale = getLocale(lang);

  const days = useMemo(() => {
    void refreshKey;
    return groupCareJournalByDate(loadCareJournal());
  }, [refreshKey]);

  return (
    <section className="potager-care-journal" aria-labelledby="potager-care-journal-heading">
      <h3 id="potager-care-journal-heading" className="potager-care-journal-title">
        {t("themes.potager.care_journal_title")}
      </h3>

      {days.length === 0 ? (
        <p className="potager-care-journal-empty">{t("themes.potager.care_journal_empty")}</p>
      ) : (
        <div className="potager-care-journal-days">
          {days.map((day) => (
            <article key={day.date} className="potager-care-journal-day">
              <h4 className="potager-care-journal-day-title">
                {formatJournalDay(day.date, locale, t)}
              </h4>
              <ul className="potager-care-journal-list">
                {day.items.map((item) => (
                  <li key={item.id} className="potager-care-journal-item">
                    <span className="potager-care-journal-icon" aria-hidden="true">
                      {healthEmoji(item.health)}
                    </span>
                    <span className="potager-care-journal-body">
                      <span className="potager-care-journal-plant">{item.nom}</span>
                      <span className="potager-care-journal-action">{item.action}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
