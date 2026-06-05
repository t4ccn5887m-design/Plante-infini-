import { useState } from "react";
import {
  disableDuoMode,
  enableDuoMode,
  generateDuoCode,
  loadDuoState,
  validateDuoDiscovery,
} from "@/lib/duoMode";

export default function DuoModePanel({ t, discoveries, onOpenDiscovery }) {
  const [state, setState] = useState(() => loadDuoState());
  const [partnerName, setPartnerName] = useState(state.partnerName || "");
  const [code, setCode] = useState(state.code || generateDuoCode());

  const pending = (state.pendingValidations || [])
    .map((id) => discoveries.find((d) => d.id === id))
    .filter(Boolean);

  const handleEnable = (role) => {
    const next = enableDuoMode({ role, partnerName, code });
    setState(next);
  };

  const handleDisable = () => {
    disableDuoMode();
    setState(loadDuoState());
  };

  if (!state.enabled) {
    return (
      <section className="duo-panel">
        <h2 className="duo-panel-title">{t("duo.title")}</h2>
        <p className="duo-panel-sub">{t("duo.subtitle")}</p>

        <label className="duo-label">{t("duo.partner_name")}</label>
        <input
          className="modal-input"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder={t("duo.partner_placeholder")}
        />

        <div className="duo-code-wrap">
          <span className="duo-code-label">{t("duo.code_label")}</span>
          <code className="duo-code">{code}</code>
          <button type="button" className="btn-secondary duo-code-refresh" onClick={() => setCode(generateDuoCode())}>
            ↻
          </button>
        </div>

        <div className="duo-role-btns">
          <button type="button" className="btn-primary" onClick={() => handleEnable("parent")}>
            👨‍👩‍👧 {t("duo.role_parent")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleEnable("child")}>
            🧒 {t("duo.role_child")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="duo-panel duo-panel--active">
      <div className="duo-active-header">
        <h2 className="duo-panel-title">
          {state.role === "parent" ? t("duo.role_parent") : t("duo.role_child")}
          {state.partnerName ? ` · ${state.partnerName}` : ""}
        </h2>
        <button type="button" className="btn-secondary duo-disable" onClick={handleDisable}>
          {t("duo.disable")}
        </button>
      </div>
      <p className="duo-code-hint">
        {t("duo.code_share")} <code className="duo-code">{state.code}</code>
      </p>

      {state.role === "parent" && pending.length > 0 && (
        <div className="duo-pending">
          <h3>{t("duo.pending_title")}</h3>
          <ul className="duo-pending-list">
            {pending.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="duo-pending-item"
                  onClick={() => {
                    validateDuoDiscovery(d.id);
                    setState(loadDuoState());
                    onOpenDiscovery?.(d);
                  }}
                >
                  {d.photo && <img src={d.photo} alt="" />}
                  <span>{d.nom}</span>
                  <span className="duo-pending-badge">{t("duo.validate")}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.role === "child" && (
        <p className="duo-child-hint">{t("duo.child_hint")}</p>
      )}
    </section>
  );
}
