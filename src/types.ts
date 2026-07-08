// Types partagés PikAsistant

export type Provider = "anthropic" | "openai" | "gemini";
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Lang = "fr" | "en";
export type Mode = "widget" | "expanded";
export type Tab = "todo" | "chat" | "settings";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  /** Échéance optionnelle, format YYYY-MM-DD */
  due?: string;
  /** Catégorie/tag libre */
  tag?: string;
  createdAt: number;
}

export interface Shortcut {
  id: string;
  label: string;
  /** Emoji ou court texte affiché comme icône */
  icon: string;
  kind: "link" | "prompt";
  /** URL/chemin local (kind=link) ou texte du prompt (kind=prompt) */
  value: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  /** Nombre d'actions todo appliquées suite à ce message assistant */
  appliedActions?: number;
}

export interface Settings {
  assistantName: string;
  accent: string;
  lang: Lang;
  sound: boolean;
  corner: Corner;
  monitorIndex: number;
  provider: Provider;
  models: Record<Provider, string>;
  shortcuts: Shortcut[];
}

export const ACCENT_PRESETS: { id: string; color: string }[] = [
  { id: "arc", color: "#3ec6ff" },      // Bleu Arc Reactor
  { id: "mark", color: "#ff4d4d" },     // Rouge Mark
  { id: "repulsor", color: "#ffc63e" }, // Doré Repulsor
  { id: "jarvis", color: "#39ff8e" },   // Vert Jarvis classique
];

export const TAG_SUGGESTIONS = ["Perso", "aYaline", "ENSAR", "BDE"];

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "CLAUDE",
  openai: "GPT",
  gemini: "GEMINI",
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export const defaultSettings: Settings = {
  assistantName: "PIKA",
  accent: "#3ec6ff",
  lang: "fr",
  sound: true,
  corner: "bottom-right",
  monitorIndex: 0,
  provider: "anthropic",
  models: {
    anthropic: "claude-sonnet-4-6",
    openai: "gpt-5-mini",
    gemini: "gemini-2.5-flash",
  },
  shortcuts: [
    {
      id: newId(),
      label: "GitHub",
      icon: "🐙",
      kind: "link",
      value: "https://github.com",
    },
    {
      id: newId(),
      label: "Briefing",
      icon: "📋",
      kind: "prompt",
      value:
        "Fais-moi un point rapide sur mes tâches : qu'est-ce qui est urgent aujourd'hui ?",
    },
  ],
};

/** Date locale au format YYYY-MM-DD (pas d'UTC pour éviter les décalages). */
export function localISODate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export type DueStatus = "none" | "ok" | "soon" | "today" | "overdue";

export function dueStatus(todo: Todo): DueStatus {
  if (!todo.due || todo.done) return "none";
  const today = localISODate();
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  const due = new Date(`${todo.due}T00:00:00`);
  const diffDays = (due.getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000;
  return diffDays <= 2 ? "soon" : "ok";
}
