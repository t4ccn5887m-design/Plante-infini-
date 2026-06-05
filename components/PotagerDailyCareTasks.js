import { dailyCareProgress, healthEmoji } from "@/lib/potagerDailyCare";

export default function PotagerDailyCareTasks({ session, t, onToggleTask, compact = false }) {
  if (!session?.tasks?.length) return null;

  const { done, total } = dailyCareProgress(session);

  return (
    <section
      className={`potager-daily-care-tasks${compact ? " potager-daily-care-tasks--compact" : ""}`}
      aria-label={t("themes.potager.daily_care_tasks_label")}
    >
      {!compact && (
        <header className="potager-daily-care-tasks-head">
          <h2 className="potager-daily-care-tasks-title">{t("themes.potager.daily_care_title")}</h2>
          <p className="potager-daily-care-tasks-progress">
            {t("themes.potager.daily_care_progress", { done, total })}
          </p>
        </header>
      )}

      <ul className="potager-daily-care-list">
        {session.tasks.map((task) => {
          const icon = healthEmoji(task.health);
          const labelId = `potager-task-${task.id}`;

          return (
            <li key={task.id}>
              <label
                htmlFor={labelId}
                className={`potager-daily-care-item${task.done ? " potager-daily-care-item--done" : ""}`}
              >
                <input
                  id={labelId}
                  type="checkbox"
                  className="potager-daily-care-checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask?.(task.id)}
                />
                <span className="potager-daily-care-check" aria-hidden="true">
                  {task.done ? "☑" : "☐"}
                </span>
                <span className="potager-daily-care-item-body">
                  <span className="potager-daily-care-item-line">
                    <span className="potager-daily-care-icon" aria-hidden="true">
                      {icon}
                    </span>
                    <span className="potager-daily-care-plant">{task.nom}</span>
                  </span>
                  <span className="potager-daily-care-action">{task.action}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
