// Gestion des deux modes de fenêtre :
// - widget : sans bordure, toujours au-dessus, ancré dans un coin d'un écran
// - agrandi : maximisé, redimensionnable, dans la barre des tâches
import {
  getCurrentWindow,
  availableMonitors,
  PhysicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import type { Corner } from "../types";

export const WIDGET_WIDTH = 320;
export const WIDGET_HEIGHT = 480;
/** Marge par rapport au bord de l'écran (px logiques). */
const MARGIN = 14;
/** Marge supplémentaire en bas pour ne pas chevaucher la barre des tâches. */
const TASKBAR_CLEARANCE = 52;

export interface MonitorInfo {
  index: number;
  name: string;
  width: number;
  height: number;
}

export async function listMonitors(): Promise<MonitorInfo[]> {
  const monitors = await availableMonitors();
  return monitors.map((m, index) => ({
    index,
    name: m.name ?? `Monitor ${index + 1}`,
    width: m.size.width,
    height: m.size.height,
  }));
}

export async function positionWidget(
  corner: Corner,
  monitorIndex: number
): Promise<void> {
  const win = getCurrentWindow();
  const monitors = await availableMonitors();
  if (monitors.length === 0) return;
  const m = monitors[Math.min(Math.max(monitorIndex, 0), monitors.length - 1)];

  const scale = m.scaleFactor || 1;
  const w = Math.round(WIDGET_WIDTH * scale);
  const h = Math.round(WIDGET_HEIGHT * scale);
  const margin = Math.round(MARGIN * scale);
  const bottomMargin = Math.round((MARGIN + TASKBAR_CLEARANCE) * scale);

  const x = corner.endsWith("left")
    ? m.position.x + margin
    : m.position.x + m.size.width - w - margin;
  const y = corner.startsWith("top")
    ? m.position.y + margin
    : m.position.y + m.size.height - h - bottomMargin;

  await win.setPosition(new PhysicalPosition(x, y));
}

export async function applyWidgetMode(
  corner: Corner,
  monitorIndex: number
): Promise<void> {
  const win = getCurrentWindow();
  if (await win.isMaximized()) await win.unmaximize();
  await win.setResizable(false);
  await win.setSkipTaskbar(true);
  await win.setAlwaysOnTop(true);
  await win.setSize(new LogicalSize(WIDGET_WIDTH, WIDGET_HEIGHT));
  await positionWidget(corner, monitorIndex);
}

export async function applyExpandedMode(): Promise<void> {
  const win = getCurrentWindow();
  await win.setAlwaysOnTop(false);
  await win.setSkipTaskbar(false);
  await win.setResizable(true);
  await win.maximize();
}
