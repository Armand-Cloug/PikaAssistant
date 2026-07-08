import { useEffect, useRef, useState } from "react";
import { useApp } from "../store";
import { t } from "../i18n";
import {
  PROVIDER_LABELS,
  type ChatMessage,
  type Provider,
} from "../types";
import { sendMessage } from "../lib/providers";
import { applyActions, buildSystemPrompt, parseActions } from "../lib/todoAI";
import { getApiKey } from "../lib/keys";
import { sfx } from "../lib/sound";

const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

export default function ChatPanel() {
  const {
    settings,
    updateSettings,
    todos,
    setTodos,
    chat,
    setChat,
    busy,
    setBusy,
    pendingPrompt,
    setPendingPrompt,
  } = useApp();
  const lang = settings.lang;
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à chaque nouveau message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, busy]);

  const doSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const provider = settings.provider;
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setChat((c) => [...c, userMsg]);

    let key: string | null = null;
    try {
      key = await getApiKey(provider);
    } catch {
      key = null;
    }
    if (!key) {
      setChat((c) => [
        ...c,
        { role: "assistant", content: t(lang, "chat.noKey"), error: true },
      ]);
      sfx.error();
      return;
    }
    const model = (settings.models[provider] ?? "").trim();
    if (!model) {
      setChat((c) => [
        ...c,
        { role: "assistant", content: t(lang, "chat.noModel"), error: true },
      ]);
      sfx.error();
      return;
    }

    sfx.send();
    setBusy(true);
    // Historique envoyé = conversation courante (messages d'erreur exclus).
    const history = [...chat.filter((m) => !m.error), userMsg];
    try {
      const system = buildSystemPrompt(settings.assistantName, todos, lang);
      const raw = await sendMessage(provider, model, key, system, history);
      const { cleaned, actions } = parseActions(raw);
      if (actions.length > 0) {
        setTodos((prev) => applyActions(prev, actions));
      }
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content: cleaned || "✓",
          appliedActions: actions.length > 0 ? actions.length : undefined,
        },
      ]);
      sfx.receive();
    } catch (e) {
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : String(e),
          error: true,
        },
      ]);
      sfx.error();
    } finally {
      setBusy(false);
    }
  };

  // Prompt déclenché par un raccourci de la barre (mode agrandi).
  useEffect(() => {
    if (pendingPrompt && !busy) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      void doSend(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, busy]);

  const submit = () => {
    const value = input;
    setInput("");
    void doSend(value);
  };

  return (
    <div className="chat">
      <div className="chat-providers">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            className={`chip ${settings.provider === p ? "active" : ""}`}
            onClick={() => {
              sfx.click();
              updateSettings({ provider: p });
            }}
            title={settings.models[p] || "—"}
          >
            {PROVIDER_LABELS[p]}
          </button>
        ))}
        <span className="chip-model" title={t(lang, "chat.model")}>
          {settings.models[settings.provider] || "—"}
        </span>
      </div>

      <div className="chat-list" ref={listRef}>
        {chat.length === 0 && (
          <div className="chat-empty">
            <span className="glow-name">
              {(settings.assistantName || "PIKA").toUpperCase()}
            </span>{" "}
            {t(lang, "chat.empty")}
          </div>
        )}
        {chat.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role === "user" ? "user" : "ai"} ${
              m.error ? "error" : ""
            }`}
          >
            {m.content}
            {m.appliedActions ? (
              <span className="msg-actions">
                ⟩ {m.appliedActions} {t(lang, "chat.actions")}
              </span>
            ) : null}
          </div>
        ))}
        {busy && (
          <div className="typing" aria-label="thinking">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="hud-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, "chat.placeholder")}
          disabled={busy}
        />
        <button
          className="hud-btn"
          type="submit"
          disabled={busy || !input.trim()}
          title={t(lang, "chat.send")}
        >
          ▸
        </button>
      </form>
    </div>
  );
}
