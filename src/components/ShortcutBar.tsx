// Barre de raccourcis persistante du mode agrandi.
// - kind=link   → ouvre URL (navigateur) ou chemin local (app par défaut)
// - kind=prompt → bascule sur l'onglet Chat et envoie le texte à l'assistant
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { useApp } from "../store";
import { t } from "../i18n";
import type { Shortcut } from "../types";
import { sfx } from "../lib/sound";

interface Props {
  onPrompt: (text: string) => void;
}

export default function ShortcutBar({ onPrompt }: Props) {
  const { settings } = useApp();

  const run = async (s: Shortcut) => {
    sfx.click();
    if (s.kind === "prompt") {
      onPrompt(s.value);
      return;
    }
    try {
      if (/^(https?:|mailto:)/i.test(s.value)) await openUrl(s.value);
      else await openPath(s.value);
    } catch (e) {
      console.error("shortcut open failed", e);
      sfx.error();
    }
  };

  return (
    <div className="shortcut-bar">
      {settings.shortcuts.length === 0 && (
        <span className="shortcut-empty">{t(settings.lang, "shortcut.empty")}</span>
      )}
      {settings.shortcuts.map((s) => (
        <button
          key={s.id}
          className="shortcut-btn"
          onClick={() => void run(s)}
          title={s.value}
        >
          <span className="sc-icon">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
