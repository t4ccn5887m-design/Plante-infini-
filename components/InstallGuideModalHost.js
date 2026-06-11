import { useEffect, useMemo, useState } from "react";
import { createT, detectLang } from "@/lib/i18n";
import InstallGuideModal from "@/components/InstallGuideModal";

const OPEN_EVENT = "wilder:install-guide-open";

export function openInstallGuideModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export default function InstallGuideModalHost() {
  const [open, setOpen] = useState(false);
  const lang = useMemo(() => detectLang(), []);
  const t = useMemo(() => createT(lang), [lang]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  return <InstallGuideModal open={open} onClose={() => setOpen(false)} t={t} />;
}
