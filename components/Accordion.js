import { useId, useState } from "react";

export function AccordionItem({ title, children, defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`accordion-item${open ? " accordion-item--open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="accordion-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="accordion-trigger-title">{title}</span>
        <span className="accordion-chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <div id={panelId} className="accordion-panel" aria-hidden={!open}>
        <div className="accordion-panel-inner">
          <div className="accordion-panel-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Accordion({ children, className = "" }) {
  return (
    <div className={`accordion${className ? ` ${className}` : ""}`} role="presentation">
      {children}
    </div>
  );
}
