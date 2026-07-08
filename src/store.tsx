// État global (settings + todos + chat) avec persistance locale :
// - settings & todos → tauri-plugin-store (fichier JSON dans AppData)
// - chat → mémoire uniquement (historique éphémère, réinitialisé au démarrage)
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { load, type Store } from "@tauri-apps/plugin-store";
import type { ChatMessage, Settings, Todo } from "./types";
import { defaultSettings } from "./types";

const STORE_FILE = "pikasistant.json";

interface AppState {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  todos: Todo[];
  setTodos: (updater: (prev: Todo[]) => Todo[]) => void;
  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  busy: boolean;
  setBusy: (b: boolean) => void;
  /** Prompt en attente d'envoi (déclenché par un raccourci "Prompt"). */
  pendingPrompt: string | null;
  setPendingPrompt: (p: string | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [todos, setTodosState] = useState<Todo[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const storeRef = useRef<Store | null>(null);
  const loadingRef = useRef(false);

  // Chargement initial depuis le store JSON.
  useEffect(() => {
    if (loadingRef.current) return; // garde StrictMode
    loadingRef.current = true;
    (async () => {
      try {
        const store = await load(STORE_FILE, { defaults: {}, autoSave: false });
        storeRef.current = store;
        const savedSettings = await store.get<Partial<Settings>>("settings");
        if (savedSettings) {
          setSettings({
            ...defaultSettings,
            ...savedSettings,
            models: { ...defaultSettings.models, ...savedSettings.models },
          });
        }
        const savedTodos = await store.get<Todo[]>("todos");
        if (Array.isArray(savedTodos)) setTodosState(savedTodos);
      } catch (e) {
        console.error("store load failed", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (key: string, value: unknown) => {
    const store = storeRef.current;
    if (!store) return;
    try {
      await store.set(key, value);
      await store.save();
    } catch (e) {
      console.error("store save failed", e);
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        void persist("settings", next);
        return next;
      });
    },
    [persist]
  );

  const setTodos = useCallback(
    (updater: (prev: Todo[]) => Todo[]) => {
      setTodosState((prev) => {
        const next = updater(prev);
        void persist("todos", next);
        return next;
      });
    },
    [persist]
  );

  return (
    <Ctx.Provider
      value={{
        ready,
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
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
