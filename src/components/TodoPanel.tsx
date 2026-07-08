import { useMemo, useState } from "react";
import { useApp } from "../store";
import { t } from "../i18n";
import {
  dueStatus,
  newId,
  TAG_SUGGESTIONS,
  type Todo,
} from "../types";
import { sfx } from "../lib/sound";

function formatDue(due: string, locale: string): string {
  return new Date(`${due}T00:00:00`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function TodoPanel() {
  const { settings, todos, setTodos } = useApp();
  const lang = settings.lang;
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editTag, setEditTag] = useState("");

  const sorted = useMemo(
    () =>
      [...todos].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const ad = a.due ?? "9999-99-99";
        const bd = b.due ?? "9999-99-99";
        if (ad !== bd) return ad < bd ? -1 : 1;
        return a.createdAt - b.createdAt;
      }),
    [todos]
  );

  const tagOptions = useMemo(() => {
    const set = new Set(TAG_SUGGESTIONS);
    for (const todo of todos) if (todo.tag) set.add(todo.tag);
    return [...set];
  }, [todos]);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    sfx.click();
    setTodos((prev) => [
      ...prev,
      { id: newId(), text: value, done: false, createdAt: Date.now() },
    ]);
    setText("");
  };

  const toggle = (todo: Todo) => {
    if (todo.done) sfx.click();
    else sfx.done();
    setTodos((prev) =>
      prev.map((x) => (x.id === todo.id ? { ...x, done: !x.done } : x))
    );
  };

  const remove = (id: string) => {
    sfx.click();
    setTodos((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (todo: Todo) => {
    sfx.click();
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDue(todo.due ?? "");
    setEditTag(todo.tag ?? "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const value = editText.trim();
    if (!value) return;
    sfx.click();
    setTodos((prev) =>
      prev.map((x) =>
        x.id === editingId
          ? {
              ...x,
              text: value,
              due: editDue || undefined,
              tag: editTag.trim() || undefined,
            }
          : x
      )
    );
    setEditingId(null);
  };

  return (
    <div className="todo">
      <form
        className="todo-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          className="hud-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, "todo.placeholder")}
        />
        <button className="hud-btn" type="submit" disabled={!text.trim()}>
          +
        </button>
      </form>

      <div className="todo-list">
        {sorted.length === 0 && (
          <div className="todo-empty">{t(lang, "todo.empty")}</div>
        )}
        {sorted.map((todo) => {
          const status = dueStatus(todo);
          if (editingId === todo.id) {
            return (
              <div key={todo.id} className="todo-item">
                <div className="todo-edit">
                  <input
                    className="hud-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <div className="todo-edit-row">
                    <label>{t(lang, "todo.dueLabel")}</label>
                    <input
                      type="date"
                      className="hud-input"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                    />
                    {editDue && (
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => setEditDue("")}
                        title={t(lang, "todo.clearDue")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="todo-edit-row">
                    <label>{t(lang, "todo.tagLabel")}</label>
                    <input
                      className="hud-input"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      list="tag-suggestions"
                    />
                  </div>
                  <div className="todo-edit-row">
                    <button type="button" className="hud-btn" onClick={saveEdit}>
                      {t(lang, "todo.save")}
                    </button>
                    <button
                      type="button"
                      className="hud-btn"
                      onClick={() => setEditingId(null)}
                    >
                      {t(lang, "todo.cancel")}
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div
              key={todo.id}
              className={`todo-item ${todo.done ? "done" : ""} ${
                status !== "none" && status !== "ok" ? status : ""
              }`}
            >
              <button
                className="todo-check"
                onClick={() => toggle(todo)}
                aria-label="toggle"
              >
                {todo.done ? "✓" : ""}
              </button>
              <div className="todo-body">
                <div className="todo-text">{todo.text}</div>
                {(todo.due || todo.tag) && (
                  <div className="todo-meta">
                    {todo.tag && <span className="badge tag">{todo.tag}</span>}
                    {todo.due && (
                      <span className={`badge due-${status}`}>
                        {status === "overdue"
                          ? `${t(lang, "todo.overdue")} · `
                          : status === "today"
                            ? `${t(lang, "todo.today")} · `
                            : status === "soon"
                              ? `${t(lang, "todo.soon")} · `
                              : ""}
                        {formatDue(todo.due, locale)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="todo-actions">
                <button
                  className="mini-btn"
                  title={t(lang, "todo.edit")}
                  onClick={() => startEdit(todo)}
                >
                  ✎
                </button>
                <button
                  className="mini-btn danger"
                  title={t(lang, "todo.delete")}
                  onClick={() => remove(todo.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <datalist id="tag-suggestions">
        {tagOptions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  );
}
