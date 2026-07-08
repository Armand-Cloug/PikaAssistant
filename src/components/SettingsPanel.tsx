import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useApp } from "../store";
import { t } from "../i18n";
import {
  ACCENT_PRESETS,
  PROVIDER_LABELS,
  newId,
  type Corner,
  type Provider,
  type Shortcut,
} from "../types";
import { getApiKey, setApiKey } from "../lib/keys";
import { listMonitors, type MonitorInfo } from "../lib/windowMode";
import { sfx } from "../lib/sound";

const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];
const CORNERS: Corner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface ShortcutForm {
  id: string | null;
  label: string;
  icon: string;
  kind: "link" | "prompt";
  value: string;
}

const emptyShortcutForm: ShortcutForm = {
  id: null,
  label: "",
  icon: "",
  kind: "link",
  value: "",
};

export default function SettingsPanel() {
  const { settings, updateSettings } = useApp();
  const lang = settings.lang;

  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [autostart, setAutostart] = useState(false);
  const [keyInputs, setKeyInputs] = useState<Record<Provider, string>>({
    anthropic: "",
    openai: "",
    gemini: "",
  });
  const [keySet, setKeySet] = useState<Record<Provider, boolean>>({
    anthropic: false,
    openai: false,
    gemini: false,
  });
  const [scForm, setScForm] = useState<ShortcutForm>(emptyShortcutForm);

  useEffect(() => {
    void listMonitors()
      .then(setMonitors)
      .catch(() => {});
    void isEnabled()
      .then(setAutostart)
      .catch(() => {});
    for (const p of PROVIDERS) {
      void getApiKey(p)
        .then((k) => {
          if (k) setKeySet((s) => ({ ...s, [p]: true }));
        })
        .catch(() => {});
    }
  }, []);

  const saveKey = async (p: Provider) => {
    sfx.click();
    try {
      await setApiKey(p, keyInputs[p]);
      setKeySet((s) => ({ ...s, [p]: keyInputs[p].trim().length > 0 }));
      setKeyInputs((s) => ({ ...s, [p]: "" }));
    } catch (e) {
      console.error("saveKey failed", e);
      sfx.error();
    }
  };

  const clearKey = async (p: Provider) => {
    sfx.click();
    try {
      await setApiKey(p, "");
      setKeySet((s) => ({ ...s, [p]: false }));
      setKeyInputs((s) => ({ ...s, [p]: "" }));
    } catch (e) {
      console.error("clearKey failed", e);
    }
  };

  const toggleAutostart = async () => {
    sfx.click();
    try {
      if (autostart) {
        await disable();
        setAutostart(false);
      } else {
        await enable();
        setAutostart(true);
      }
    } catch (e) {
      console.error("autostart toggle failed", e);
      sfx.error();
    }
  };

  const submitShortcut = () => {
    const label = scForm.label.trim();
    const value = scForm.value.trim();
    if (!label || !value) return;
    sfx.click();
    const sc: Shortcut = {
      id: scForm.id ?? newId(),
      label,
      icon: scForm.icon.trim() || "◆",
      kind: scForm.kind,
      value,
    };
    const list = scForm.id
      ? settings.shortcuts.map((s) => (s.id === scForm.id ? sc : s))
      : [...settings.shortcuts, sc];
    updateSettings({ shortcuts: list });
    setScForm(emptyShortcutForm);
  };

  const moveShortcut = (id: string, dir: -1 | 1) => {
    const arr = [...settings.shortcuts];
    const i = arr.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    sfx.click();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateSettings({ shortcuts: arr });
  };

  return (
    <div className="settings">
      {/* ------------------------------------------------ Général */}
      <section className="set-section">
        <h3 className="set-title">{t(lang, "settings.general")}</h3>
        <div className="set-row">
          <label>{t(lang, "settings.assistantName")}</label>
          <input
            className="hud-input"
            value={settings.assistantName}
            maxLength={24}
            onChange={(e) => updateSettings({ assistantName: e.target.value })}
          />
        </div>
        <div className="set-row">
          <label>{t(lang, "settings.language")}</label>
          <button
            className={`hud-btn toggle ${lang === "fr" ? "" : "off"}`}
            onClick={() => {
              sfx.click();
              updateSettings({ lang: "fr" });
            }}
          >
            FR
          </button>
          <button
            className={`hud-btn toggle ${lang === "en" ? "" : "off"}`}
            onClick={() => {
              sfx.click();
              updateSettings({ lang: "en" });
            }}
          >
            EN
          </button>
        </div>
        <div className="set-row">
          <label>{t(lang, "settings.sound")}</label>
          <button
            className={`hud-btn toggle ${settings.sound ? "" : "off"}`}
            onClick={() => {
              updateSettings({ sound: !settings.sound });
              sfx.click();
            }}
          >
            {settings.sound ? "ON" : "OFF"}
          </button>
        </div>
        <div className="set-row">
          <label>{t(lang, "settings.autostart")}</label>
          <button
            className={`hud-btn toggle ${autostart ? "" : "off"}`}
            onClick={() => void toggleAutostart()}
          >
            {autostart ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      {/* ------------------------------------------------ Thème */}
      <section className="set-section">
        <h3 className="set-title">{t(lang, "settings.theme")}</h3>
        <div className="swatches">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`swatch ${settings.accent === p.color ? "active" : ""}`}
              style={{ background: p.color }}
              title={t(lang, `preset.${p.id}` as `preset.${string}` & Parameters<typeof t>[1])}
              onClick={() => {
                sfx.click();
                updateSettings({ accent: p.color });
              }}
            />
          ))}
          <label className="set-label" htmlFor="custom-accent">
            {t(lang, "settings.customColor")}
          </label>
          <input
            id="custom-accent"
            type="color"
            className="swatch-custom"
            value={settings.accent}
            onChange={(e) => updateSettings({ accent: e.target.value })}
          />
        </div>
      </section>

      {/* ------------------------------------------------ Ancrage */}
      <section className="set-section">
        <h3 className="set-title">{t(lang, "settings.anchor")}</h3>
        <div className="set-row">
          <label>{t(lang, "settings.monitor")}</label>
          <select
            className="hud-select"
            value={settings.monitorIndex}
            onChange={(e) =>
              updateSettings({ monitorIndex: Number(e.target.value) })
            }
          >
            {(monitors.length
              ? monitors
              : [{ index: 0, name: "Monitor 1", width: 0, height: 0 }]
            ).map((m) => (
              <option key={m.index} value={m.index}>
                {m.index + 1}. {m.name}
                {m.width ? ` (${m.width}×${m.height})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="set-row">
          <label>{t(lang, "settings.corner")}</label>
          <select
            className="hud-select"
            value={settings.corner}
            onChange={(e) =>
              updateSettings({ corner: e.target.value as Corner })
            }
          >
            {CORNERS.map((c) => (
              <option key={c} value={c}>
                {t(lang, `corner.${c}`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ------------------------------------------------ Clés API */}
      <section className="set-section">
        <h3 className="set-title">{t(lang, "settings.apiKeys")}</h3>
        {PROVIDERS.map((p) => (
          <div key={p} className="provider-block">
            <div className="provider-head">
              <span className="provider-name">{PROVIDER_LABELS[p]}</span>
              <span className={`key-state ${keySet[p] ? "set" : "unset"}`}>
                {keySet[p]
                  ? `● ${t(lang, "settings.keySet")}`
                  : `○ ${t(lang, "settings.keyUnset")}`}
              </span>
            </div>
            <div className="set-row">
              <input
                type="password"
                className="hud-input"
                style={{ flex: 1, minWidth: 140 }}
                value={keyInputs[p]}
                placeholder={t(lang, "settings.keyPlaceholder")}
                onChange={(e) =>
                  setKeyInputs((s) => ({ ...s, [p]: e.target.value }))
                }
                autoComplete="off"
              />
              <button
                className="hud-btn"
                onClick={() => void saveKey(p)}
                disabled={!keyInputs[p].trim()}
              >
                {t(lang, "settings.save")}
              </button>
              {keySet[p] && (
                <button
                  className="hud-btn toggle off"
                  title={t(lang, "settings.clearKey")}
                  onClick={() => void clearKey(p)}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="set-row">
              <input
                className="hud-input"
                style={{ flex: 1, minWidth: 140 }}
                value={settings.models[p]}
                placeholder={t(lang, "settings.modelPlaceholder")}
                onChange={(e) =>
                  updateSettings({
                    models: { ...settings.models, [p]: e.target.value },
                  })
                }
                spellCheck={false}
              />
            </div>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------ Raccourcis */}
      <section className="set-section">
        <h3 className="set-title">{t(lang, "settings.shortcuts")}</h3>
        {settings.shortcuts.length === 0 && (
          <span className="shortcut-empty">{t(lang, "shortcut.empty")}</span>
        )}
        {settings.shortcuts.map((s, i) => (
          <div key={s.id} className="sc-row">
            <span className="sc-icon">{s.icon}</span>
            <span className="sc-label">{s.label}</span>
            <span className="sc-value" title={s.value}>
              [{t(lang, s.kind === "link" ? "shortcut.link" : "shortcut.prompt")}]{" "}
              {s.value}
            </span>
            <button
              className="mini-btn"
              title={t(lang, "shortcut.up")}
              disabled={i === 0}
              onClick={() => moveShortcut(s.id, -1)}
            >
              ▲
            </button>
            <button
              className="mini-btn"
              title={t(lang, "shortcut.down")}
              disabled={i === settings.shortcuts.length - 1}
              onClick={() => moveShortcut(s.id, 1)}
            >
              ▼
            </button>
            <button
              className="mini-btn"
              title={t(lang, "todo.edit")}
              onClick={() => {
                sfx.click();
                setScForm({
                  id: s.id,
                  label: s.label,
                  icon: s.icon,
                  kind: s.kind,
                  value: s.value,
                });
              }}
            >
              ✎
            </button>
            <button
              className="mini-btn danger"
              title={t(lang, "todo.delete")}
              onClick={() => {
                sfx.click();
                updateSettings({
                  shortcuts: settings.shortcuts.filter((x) => x.id !== s.id),
                });
                if (scForm.id === s.id) setScForm(emptyShortcutForm);
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <form
          className="sc-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitShortcut();
          }}
        >
          <div className="set-row">
            <input
              className="hud-input"
              style={{ width: 130 }}
              value={scForm.label}
              placeholder={t(lang, "shortcut.label")}
              onChange={(e) =>
                setScForm((f) => ({ ...f, label: e.target.value }))
              }
            />
            <input
              className="hud-input"
              style={{ width: 90 }}
              value={scForm.icon}
              placeholder={t(lang, "shortcut.icon")}
              onChange={(e) =>
                setScForm((f) => ({ ...f, icon: e.target.value }))
              }
            />
            <select
              className="hud-select"
              value={scForm.kind}
              onChange={(e) =>
                setScForm((f) => ({
                  ...f,
                  kind: e.target.value as "link" | "prompt",
                }))
              }
            >
              <option value="link">{t(lang, "shortcut.link")}</option>
              <option value="prompt">{t(lang, "shortcut.prompt")}</option>
            </select>
          </div>
          <div className="set-row">
            <input
              className="hud-input"
              style={{ flex: 1, minWidth: 160 }}
              value={scForm.value}
              placeholder={t(
                lang,
                scForm.kind === "link"
                  ? "shortcut.valueLink"
                  : "shortcut.valuePrompt"
              )}
              onChange={(e) =>
                setScForm((f) => ({ ...f, value: e.target.value }))
              }
            />
            <button
              className="hud-btn"
              type="submit"
              disabled={!scForm.label.trim() || !scForm.value.trim()}
            >
              {scForm.id ? t(lang, "todo.save") : t(lang, "shortcut.add")}
            </button>
            {scForm.id && (
              <button
                type="button"
                className="hud-btn toggle off"
                onClick={() => setScForm(emptyShortcutForm)}
              >
                {t(lang, "todo.cancel")}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
