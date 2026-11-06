// Keyboard shortcut helpers used by the editor's Settings → Keyboard.
// Keys are a KeyboardEvent.key, optionally with modifiers: "s", "ArrowDown", "Ctrl+Shift+f".
// Modifiers always come in this order; single letters are matched case-insensitively.
const IGFV_MODIFIERS = ["Ctrl", "Alt", "Shift", "Meta"];

function igfvSplitCombo(combo) {
  const text = String(combo || "");
  if (text.length <= 1) return { mods: [], key: text };
  // The key is after the last "+" (and is "+" itself in "Ctrl++").
  const plusKey = text.endsWith("++");
  const at = plusKey ? text.length - 2 : text.lastIndexOf("+");
  if (at <= 0) return { mods: [], key: text };
  const mods = text
    .slice(0, at)
    .split("+")
    .map((m) => IGFV_MODIFIERS.find((name) => name.toLowerCase() === m.trim().toLowerCase()))
    .filter(Boolean);
  return { mods, key: plusKey ? "+" : text.slice(at + 1) };
}

function igfvNormalizeKey(combo) {
  const { mods, key } = igfvSplitCombo(combo);
  const k = key.length === 1 ? key.toLowerCase() : key;
  return [...IGFV_MODIFIERS.filter((m) => mods.includes(m)), k].join("+");
}

// The combo for a key press, or null for a modifier pressed on its own.
function igfvComboFromEvent(e) {
  if (["Control", "Alt", "Shift", "Meta", "OS", "AltGraph"].includes(e.key)) return null;
  const mods = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (e.metaKey) mods.push("Meta");
  return igfvNormalizeKey([...mods, e.key].join("+"));
}

function igfvKeyLabel(combo) {
  const names = {
    ArrowRight: "→",
    ArrowLeft: "←",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Escape: "Esc",
    " ": "Space",
    Meta: "Win/⌘",
  };
  const { mods, key } = igfvSplitCombo(combo);
  const keyLabel = names[key] || (key.length === 1 ? key.toUpperCase() : key);
  return [...mods.map((m) => names[m] || m), keyLabel].join(" + ");
}
