import type { Lang } from "./types";

const fr = {
  "tabs.todo": "TODO",
  "tabs.chat": "CHAT",
  "tabs.settings": "PARAMÈTRES",
  "header.expand": "Agrandir",
  "header.reduce": "Mode widget",
  "header.online": "EN LIGNE",

  "todo.placeholder": "Nouvelle tâche…",
  "todo.add": "Ajouter",
  "todo.empty": "Aucune tâche — système nominal.",
  "todo.dueLabel": "Échéance",
  "todo.tagLabel": "Tag",
  "todo.overdue": "RETARD",
  "todo.today": "AUJOURD'HUI",
  "todo.soon": "BIENTÔT",
  "todo.save": "OK",
  "todo.cancel": "Annuler",
  "todo.delete": "Supprimer",
  "todo.edit": "Modifier",
  "todo.clearDue": "Effacer",

  "chat.placeholder": "Message…",
  "chat.send": "Envoyer",
  "chat.empty":
    "en ligne. Pose une question ou gère ta todo list en langage naturel.",
  "chat.noKey":
    "⚠ Aucune clé API pour ce fournisseur. Configure-la dans Paramètres (mode agrandi).",
  "chat.noModel":
    "⚠ Aucun modèle défini pour ce fournisseur. Renseigne-le dans Paramètres.",
  "chat.actions": "action(s) appliquée(s) à la todo list",
  "chat.model": "Modèle",

  "settings.assistantName": "Nom de l'assistant",
  "settings.theme": "Thème",
  "settings.customColor": "Couleur personnalisée",
  "settings.language": "Langue de l'interface",
  "settings.sound": "Effets sonores",
  "settings.autostart": "Démarrage automatique avec Windows",
  "settings.anchor": "Ancrage du widget",
  "settings.monitor": "Écran",
  "settings.corner": "Coin",
  "settings.apiKeys": "Assistant IA — clés API & modèles",
  "settings.keyPlaceholder": "Clé API",
  "settings.modelPlaceholder": "Nom exact du modèle (texte libre)",
  "settings.save": "Enregistrer",
  "settings.keySet": "clé enregistrée",
  "settings.keyUnset": "aucune clé",
  "settings.clearKey": "Effacer la clé",
  "settings.shortcuts": "Barre de raccourcis",
  "settings.general": "Général",

  "corner.top-left": "Haut gauche",
  "corner.top-right": "Haut droit",
  "corner.bottom-left": "Bas gauche",
  "corner.bottom-right": "Bas droit",

  "preset.arc": "Arc Reactor",
  "preset.mark": "Mark",
  "preset.repulsor": "Repulsor",
  "preset.jarvis": "Jarvis",

  "shortcut.add": "Ajouter un raccourci",
  "shortcut.label": "Label",
  "shortcut.icon": "Icône (emoji)",
  "shortcut.kind": "Type",
  "shortcut.link": "Lien / fichier",
  "shortcut.prompt": "Prompt IA",
  "shortcut.valueLink": "URL (https://…) ou chemin local",
  "shortcut.valuePrompt": "Texte envoyé à l'assistant",
  "shortcut.empty": "Aucun raccourci configuré.",
  "shortcut.up": "Monter",
  "shortcut.down": "Descendre",
};

const en: Record<keyof typeof fr, string> = {
  "tabs.todo": "TODO",
  "tabs.chat": "CHAT",
  "tabs.settings": "SETTINGS",
  "header.expand": "Expand",
  "header.reduce": "Widget mode",
  "header.online": "ONLINE",

  "todo.placeholder": "New task…",
  "todo.add": "Add",
  "todo.empty": "No tasks — all systems nominal.",
  "todo.dueLabel": "Due date",
  "todo.tagLabel": "Tag",
  "todo.overdue": "OVERDUE",
  "todo.today": "TODAY",
  "todo.soon": "SOON",
  "todo.save": "OK",
  "todo.cancel": "Cancel",
  "todo.delete": "Delete",
  "todo.edit": "Edit",
  "todo.clearDue": "Clear",

  "chat.placeholder": "Message…",
  "chat.send": "Send",
  "chat.empty": "online. Ask anything or manage your todo list in natural language.",
  "chat.noKey":
    "⚠ No API key for this provider. Set it in Settings (expanded mode).",
  "chat.noModel": "⚠ No model set for this provider. Set it in Settings.",
  "chat.actions": "action(s) applied to the todo list",
  "chat.model": "Model",

  "settings.assistantName": "Assistant name",
  "settings.theme": "Theme",
  "settings.customColor": "Custom color",
  "settings.language": "Interface language",
  "settings.sound": "Sound effects",
  "settings.autostart": "Start automatically with Windows",
  "settings.anchor": "Widget anchor",
  "settings.monitor": "Monitor",
  "settings.corner": "Corner",
  "settings.apiKeys": "AI assistant — API keys & models",
  "settings.keyPlaceholder": "API key",
  "settings.modelPlaceholder": "Exact model name (free text)",
  "settings.save": "Save",
  "settings.keySet": "key saved",
  "settings.keyUnset": "no key",
  "settings.clearKey": "Clear key",
  "settings.shortcuts": "Shortcut bar",
  "settings.general": "General",

  "corner.top-left": "Top left",
  "corner.top-right": "Top right",
  "corner.bottom-left": "Bottom left",
  "corner.bottom-right": "Bottom right",

  "preset.arc": "Arc Reactor",
  "preset.mark": "Mark",
  "preset.repulsor": "Repulsor",
  "preset.jarvis": "Jarvis",

  "shortcut.add": "Add shortcut",
  "shortcut.label": "Label",
  "shortcut.icon": "Icon (emoji)",
  "shortcut.kind": "Type",
  "shortcut.link": "Link / file",
  "shortcut.prompt": "AI prompt",
  "shortcut.valueLink": "URL (https://…) or local path",
  "shortcut.valuePrompt": "Text sent to the assistant",
  "shortcut.empty": "No shortcuts configured.",
  "shortcut.up": "Move up",
  "shortcut.down": "Move down",
};

export type TKey = keyof typeof fr;

const dicts: Record<Lang, Record<TKey, string>> = { fr, en };

export function t(lang: Lang, key: TKey): string {
  return dicts[lang][key] ?? fr[key] ?? key;
}
