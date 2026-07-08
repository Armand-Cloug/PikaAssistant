import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { useApp } from "./store";
import { t, type TKey } from "./i18n";
import { applyExpandedMode, applyWidgetMode } from "./lib/windowMode";
import { setSoundEnabled, sfx } from "./lib/sound";
import { ArcMark, Brackets, Clock } from "./components/Hud";
import TodoPanel from "./components/TodoPanel";
import ChatPanel from "./components/ChatPanel";
import SettingsPanel from "./components/SettingsPanel";
import ShortcutBar from "./components/ShortcutBar";
import type { Mode, Tab } from "./types";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return "62, 198, 255";
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function App() {
  const { ready, settings, setPendingPrompt } = useApp();
  const [mode, setMode] = useState<Mode>("widget");
  const [tab, setTab] = useState<Tab>("todo");
  const lang = settings.lang;

  // Thème : la couleur d'accent recolore toute l'interface via variables CSS.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--accent-rgb", hexToRgb(settings.accent));
  }, [settings.accent]);

  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);

  // Mode widget : (re)positionnement quand écran/coin changent.
  useEffect(() => {
    if (!ready || mode !== "widget") return;
    void applyWidgetMode(settings.corner, settings.monitorIndex);
  }, [ready, mode, settings.corner, settings.monitorIndex]);

  const expand = useCallback(() => {
    sfx.open();
    setMode("expanded");
    void applyExpandedMode();
  }, []);

  const reduce = useCallback(() => {
    sfx.close();
    setTab((current) => (current === "settings" ? "todo" : current));
    setMode("widget"); // l'effet ci-dessus applique taille + position
  }, []);

  const onPromptShortcut = useCallback(
    (text: string) => {
      setTab("chat");
      setPendingPrompt(text);
    },
    [setPendingPrompt]
  );

  if (!ready) return null;

  const isWidget = mode === "widget";
  const tabs: Tab[] = isWidget ? ["todo", "chat"] : ["todo", "chat", "settings"];

  return (
    <div className={`app ${isWidget ? "is-widget" : "is-expanded"}`}>
      <div className="hud-panel">
        <Brackets />
        <div className="scan-sweep" aria-hidden="true" />

        <header className="hud-header" data-tauri-drag-region>
          <div className="hud-id" data-tauri-drag-region>
            <ArcMark />
            <div className="hud-titles" data-tauri-drag-region>
              <span className="hud-name" data-tauri-drag-region>
                {settings.assistantName || "PIKA"}
              </span>
              <span className="hud-status" data-tauri-drag-region>
                <span className="dot" /> {t(lang, "header.online")}
              </span>
            </div>
          </div>
          <div className="hud-right">
            <Clock />
            {isWidget ? (
              <button
                className="icon-btn"
                title={t(lang, "header.expand")}
                onClick={expand}
              >
                ⤢
              </button>
            ) : (
              <button
                className="icon-btn"
                title={t(lang, "header.reduce")}
                onClick={reduce}
              >
                ⤡
              </button>
            )}
          </div>
        </header>

        <nav className="tabbar">
          {tabs.map((tb) => (
            <button
              key={tb}
              className={`tab ${tab === tb ? "active" : ""}`}
              onClick={() => {
                sfx.click();
                setTab(tb);
              }}
            >
              {t(lang, `tabs.${tb}` as TKey)}
            </button>
          ))}
        </nav>

        <main className="content">
          {tab === "todo" && <TodoPanel />}
          {tab === "chat" && <ChatPanel />}
          {tab === "settings" && !isWidget && <SettingsPanel />}
        </main>

        {!isWidget && <ShortcutBar onPrompt={onPromptShortcut} />}
      </div>
    </div>
  );
}
