// Petits bips HUD synthétisés (Web Audio) — aucun asset requis.
// Désactivables via setSoundEnabled (réglage "Son" des paramètres).

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  delay = 0,
  type: OscillatorType = "sine",
  volume = 0.035
) {
  if (!enabled) return;
  try {
    const ac = audio();
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch {
    // audio indisponible : silencieux
  }
}

export const sfx = {
  /** Clic générique (boutons, onglets) */
  click() {
    tone(1250, 0.04, 0, "square", 0.02);
  },
  /** Envoi d'un message au chat */
  send() {
    tone(740, 0.05);
    tone(1180, 0.06, 0.05);
  },
  /** Réponse reçue */
  receive() {
    tone(1180, 0.05);
    tone(880, 0.07, 0.06);
  },
  /** Tâche cochée */
  done() {
    tone(660, 0.05, 0, "triangle");
    tone(990, 0.09, 0.06, "triangle");
  },
  /** Erreur */
  error() {
    tone(220, 0.16, 0, "sawtooth", 0.03);
  },
  /** Passage en mode agrandi */
  open() {
    tone(520, 0.05);
    tone(780, 0.05, 0.05);
    tone(1040, 0.08, 0.1);
  },
  /** Retour en mode widget */
  close() {
    tone(1040, 0.05);
    tone(780, 0.05, 0.05);
    tone(520, 0.08, 0.1);
  },
};
