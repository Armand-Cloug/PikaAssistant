// Interaction todo list ↔ assistant en langage naturel.
// Le prompt système donne l'état de la todo list et demande à l'IA d'émettre,
// quand une action est nécessaire, un bloc ```todo-action contenant un tableau
// JSON d'actions. L'app détecte ce bloc, applique les actions et affiche le
// texte nettoyé. (Évite le function-calling natif propre à chaque fournisseur.)

import type { Lang, Todo } from "../types";
import { localISODate, newId } from "../types";

export interface TodoAction {
  action: "add" | "complete" | "uncomplete" | "delete" | "update";
  id?: string;
  text?: string;
  due?: string | null;
  tag?: string | null;
}

export function buildSystemPrompt(
  assistantName: string,
  todos: Todo[],
  lang: Lang
): string {
  const today = localISODate();
  const weekday = new Date().toLocaleDateString(
    lang === "fr" ? "fr-FR" : "en-US",
    { weekday: "long" }
  );
  const list = todos.length
    ? todos
        .map(
          (t) =>
            `- id=${t.id} | ${t.done ? "[x]" : "[ ]"} ${t.text}` +
            (t.due ? ` | due=${t.due}` : "") +
            (t.tag ? ` | tag=${t.tag}` : "")
        )
        .join("\n")
    : "(empty)";

  return `You are ${assistantName}, a concise HUD-style desktop assistant (Jarvis vibe) embedded in the PikAsistant app.
Reply in ${lang === "fr" ? "French" : "English"} unless the user writes in another language. Keep answers short and practical — this is a small chat panel.

Today is ${weekday} ${today}.

The user has a todo list. Current state (each task has an id):
${list}

TODO LIST CONTROL:
When (and only when) the user asks to add, complete, reopen, delete or modify tasks, include in your reply exactly one fenced code block tagged todo-action containing a JSON array of actions, then answer naturally outside the block. The app executes the block and hides it from the user.

Available actions:
- {"action":"add","text":"...","due":"YYYY-MM-DD","tag":"..."}  (due and tag optional)
- {"action":"complete","id":"..."}
- {"action":"uncomplete","id":"..."}
- {"action":"delete","id":"..."}
- {"action":"update","id":"...","text":"...","due":"YYYY-MM-DD","tag":"..."}  (only include fields to change; use null to clear due/tag)

Example:
\`\`\`todo-action
[{"action":"add","text":"Rendre le rapport","due":"${today}","tag":"ENSAR"}]
\`\`\`

Rules:
- Resolve relative dates ("demain", "vendredi", "next week") into YYYY-MM-DD using today's date.
- Reference existing tasks by their id from the list above.
- Never invent ids. For questions about the list (no modification), just answer — no block.`;
}

const ACTION_BLOCK_RE = /```todo-action\s*([\s\S]*?)```/g;

export function parseActions(raw: string): {
  cleaned: string;
  actions: TodoAction[];
} {
  const actions: TodoAction[] = [];
  const cleaned = raw
    .replace(ACTION_BLOCK_RE, (_, body: string) => {
      try {
        const parsed = JSON.parse(body.trim());
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const a of arr) {
          if (a && typeof a.action === "string") actions.push(a as TodoAction);
        }
      } catch {
        // bloc malformé : ignoré, le texte brut est retiré quand même
      }
      return "";
    })
    .trim();
  return { cleaned, actions };
}

export function applyActions(todos: Todo[], actions: TodoAction[]): Todo[] {
  let next = [...todos];
  for (const a of actions) {
    switch (a.action) {
      case "add":
        if (a.text && a.text.trim()) {
          next.push({
            id: newId(),
            text: a.text.trim(),
            done: false,
            due: a.due ?? undefined,
            tag: a.tag ?? undefined,
            createdAt: Date.now(),
          });
        }
        break;
      case "complete":
      case "uncomplete":
        next = next.map((t) =>
          t.id === a.id ? { ...t, done: a.action === "complete" } : t
        );
        break;
      case "delete":
        next = next.filter((t) => t.id !== a.id);
        break;
      case "update":
        next = next.map((t) => {
          if (t.id !== a.id) return t;
          const u = { ...t };
          if (typeof a.text === "string" && a.text.trim()) u.text = a.text.trim();
          if (a.due !== undefined) u.due = a.due ?? undefined;
          if (a.tag !== undefined) u.tag = a.tag ?? undefined;
          return u;
        });
        break;
    }
  }
  return next;
}
