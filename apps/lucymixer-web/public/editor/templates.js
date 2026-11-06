// Ready-made material for Reels / Shorts, inserted as groups of ordinary overlay clips (so every
// text stays editable): banners and titles, news, quotes; text style presets; split-screen
// layouts for reactions. Positions are fractions of the canvas; text sizes are fractions of its
// shorter side (layers.js).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Templates = (() => {
  const text = (t, props = {}) => ({ type: "text", text: t, shadow: "", ...props });
  const box = (props = {}) => ({ type: "shape", shape: "rect", stroke: "", strokeWidth: 0, ...props });

  // ---- text styles ---------------------------------------------------------------------------
  // A preset replaces the look (not the words, size or place) of a text.
  const RESET = {
    bg: "", bgStyle: "box", fill2: "", depth: 0, gloss: 0, bevel: false, glow: "", outline: "", outlineWidth: 0.08,
    italic: false, shadow: "", shadowBlur: 0.15, shadowX: 0, shadowY: 0.05, spacing: 0,
  };
  const RED_3D = { font: "anton", color: "#ff2a2a", fill2: "#9b0000", depth: 0.12, depthAngle: 60, depthColor: "#3d0000", gloss: 0.6, bevel: true, shadow: "rgba(0,0,0,0.7)", shadowBlur: 0.3, shadowY: 0.12 };
  const YELLOW_BRUSH = { font: "anton", color: "#111111", bg: "#ffd400", bgStyle: "brush", bgPad: 0.45 };
  const STYLES = [
    { id: "brush", label: "Yellow brush", props: YELLOW_BRUSH },
    { id: "red3d", label: "Red 3D", props: RED_3D },
    { id: "gold3d", label: "Gold 3D", props: { ...RED_3D, color: "#ffe680", fill2: "#b8860b", depthColor: "#5a3d00", gloss: 0.7 } },
    { id: "chrome3d", label: "Chrome 3D", props: { ...RED_3D, color: "#ffffff", fill2: "#8a8f99", depthColor: "#2b2e33", gloss: 0.8 } },
    { id: "neon", label: "Neon", props: { font: "bebas", color: "#e8fdff", glow: "#00e5ff", glowBlur: 0.5, spacing: 0.04 } },
    { id: "marker", label: "Marker", props: { font: "sans", weight: 800, color: "#111111", bg: "#7cff6b", bgStyle: "marker" } },
    { id: "comic", label: "Comic", props: { font: "bangers", color: "#ffe14d", outline: "#111111", outlineWidth: 0.14, shadow: "#111111", shadowBlur: 0, shadowX: 0.06, shadowY: 0.08, spacing: 0.03 } },
    { id: "outline", label: "Outline pop", props: { font: "sans", weight: 900, color: "#ffffff", outline: "#000000", outlineWidth: 0.18 } },
    { id: "hand", label: "Marker pen", props: { font: "marker", color: "#ffffff", shadow: "rgba(0,0,0,0.55)", shadowBlur: 0.2, shadowY: 0.06 } },
    { id: "quote", label: "Elegant", props: { font: "playfair", italic: true, color: "#ffffff", shadow: "rgba(0,0,0,0.5)", shadowBlur: 0.25, shadowY: 0.05 } },
    { id: "tape", label: "Tape label", props: { font: "bebas", color: "#ffffff", bg: "#e63946", bgStyle: "tape", bgPad: 0.35, spacing: 0.05 } },
  ];
  const styleProps = (id) => {
    const s = STYLES.find((x) => x.id === id);
    return s ? { ...RESET, ...s.props } : null;
  };

  // ---- templates -------------------------------------------------------------------------------
  // layers: bottom first. { slot: true } marks where a selected photo / video goes (photo: its region).
  const GROUPS = ["Titles and banners", "News", "Quotes"];
  const TEMPLATES = [
    {
      id: "lower3", group: "Titles and banners", label: "Lower third",
      layers: () => [
        box({ cx: 0.38, cy: 0.8, w: 0.66, h: 0.085, fill: "#111111", fill2: "#2d2d2d", gradAngle: 0, radius: 0.012, anim: "slidein" }),
        box({ cx: 0.06, cy: 0.8, w: 0.014, h: 0.085, fill: "#ff2d55", anim: "slidein" }),
        text("YOUR NAME", { font: "anton", size: 0.058, color: "#ffffff", cx: 0.38, cy: 0.788, anim: "slidein" }),
        text("Creator · Your title", { font: "sans", weight: 600, size: 0.03, color: "#cfcfcf", cx: 0.38, cy: 0.823, anim: "slidein" }),
      ],
    },
    {
      id: "follow", group: "Titles and banners", label: "Follow pill",
      layers: () => [
        box({ cx: 0.5, cy: 0.86, w: 0.6, h: 0.062, fill: "#ff2d55", fill2: "#ff8a00", gradAngle: 0, radius: 0.06, anim: "popin" }),
        text("＋ FOLLOW FOR MORE", { font: "bebas", size: 0.058, color: "#ffffff", cx: 0.5, cy: 0.86, spacing: 0.04, anim: "popin" }),
      ],
    },
    {
      id: "title", group: "Titles and banners", label: "Title card",
      layers: () => [
        box({ cx: 0.5, cy: 0.3, w: 1, h: 0.17, fill: "#6a11cb", fill2: "#2575fc", gradAngle: 0, anim: "slidein" }),
        text("BIG TITLE", { font: "anton", size: 0.12, color: "#ffffff", cx: 0.5, cy: 0.285, shadow: "rgba(0,0,0,0.35)", shadowBlur: 0.2, anim: "slidein" }),
        text("your subtitle goes here", { font: "sans", weight: 600, size: 0.038, color: "#e9e6ff", cx: 0.5, cy: 0.345, anim: "slidein" }),
      ],
    },
    {
      id: "part", group: "Titles and banners", label: "Part tag",
      layers: () => [
        box({ cx: 0.19, cy: 0.1, w: 0.28, h: 0.055, fill: "#ffd60a", radius: 0.012, anim: "popin" }),
        text("PART 1", { font: "anton", size: 0.05, color: "#111111", cx: 0.19, cy: 0.1, anim: "popin" }),
      ],
    },
    {
      id: "caption", group: "Titles and banners", label: "Caption bar",
      layers: () => [text("Your caption goes here", { font: "sans", weight: 700, size: 0.045, color: "#ffffff", bg: "rgba(0,0,0,0.78)", bgPad: 0.5, bgRadius: 0.35, cx: 0.5, cy: 0.74, anim: "slideup" })],
    },
    {
      id: "wow", group: "Titles and banners", label: "Brush tag",
      layers: () => [text("WOW!", { ...RESET, ...YELLOW_BRUSH, font: "marker", size: 0.1, cx: 0.7, cy: 0.18, rotation: -6, anim: "popin" })],
    },
    {
      id: "red3d", group: "Titles and banners", label: "Big red 3D",
      layers: () => [
        text("THIS", { ...RESET, ...RED_3D, size: 0.13, cx: 0.5, cy: 0.2, anim: "popin" }),
        text("IS", { ...RESET, ...RED_3D, size: 0.1, cx: 0.5, cy: 0.29, anim: "popin" }),
        text("HUGE", { ...RESET, ...RED_3D, size: 0.17, cx: 0.5, cy: 0.395, anim: "popin" }),
        text("Material: 100% cotton · Size: XL · Made in India", { font: "sans", weight: 600, size: 0.028, color: "#f2f2f2", bg: "rgba(0,0,0,0.55)", bgPad: 0.4, bgRadius: 0.3, cx: 0.5, cy: 0.49, anim: "fadein" }),
      ],
    },
    {
      id: "headline", group: "Titles and banners", label: "Brush headline",
      layers: () => [text("YOUR HEADLINE", { ...RESET, ...YELLOW_BRUSH, size: 0.075, cx: 0.5, cy: 0.2, anim: "slidein" })],
    },
    {
      id: "breaking", group: "News", label: "Breaking news",
      photo: { x: 0, y: 0, w: 1, h: 0.75 },
      layers: () => [
        { slot: true },
        box({ cx: 0.3, cy: 0.785, w: 0.58, h: 0.06, fill: "#d90000", fill2: "#a00000", gradAngle: 0, anim: "slidein" }),
        text("BREAKING NEWS", { font: "anton", size: 0.055, color: "#ffffff", cx: 0.3, cy: 0.785, spacing: 0.02, anim: "slidein" }),
        box({ cx: 0.5, cy: 0.85, w: 1, h: 0.07, fill: "#ffffff", anim: "slidein" }),
        text("Your headline here", { font: "sans", weight: 800, size: 0.046, color: "#111111", cx: 0.5, cy: 0.85, anim: "slidein" }),
        box({ cx: 0.5, cy: 0.905, w: 1, h: 0.04, fill: "#111111" }),
        text("LATEST: your ticker text scrolls here  •  more updates  •  follow for news", { font: "sans", weight: 600, size: 0.03, color: "#ffffff", cx: 0.5, cy: 0.905, anim: "ticker" }),
        text("● LIVE", { font: "sans", weight: 800, size: 0.034, color: "#ffffff", bg: "#d90000", bgPad: 0.3, bgRadius: 0.2, cx: 0.13, cy: 0.06, anim: "pulse" }),
      ],
    },
    {
      id: "article", group: "News", label: "News article",
      photo: { x: 0.05, y: 0.155, w: 0.9, h: 0.36 },
      layers: () => [
        box({ cx: 0.5, cy: 0.5, w: 1, h: 1, fill: "#f4efe6" }),
        box({ cx: 0.5, cy: 0.335, w: 0.9, h: 0.36, fill: "#d8d2c6", noslot: true }),
        { slot: true },
        text("THE DAILY CREATOR", { font: "playfair", weight: 900, size: 0.075, color: "#111111", cx: 0.5, cy: 0.065 }),
        text("MONDAY, 12 OCTOBER 2026  ·  EDITION 1", { font: "sans", weight: 600, size: 0.022, color: "#444444", cx: 0.5, cy: 0.12, spacing: 0.06 }),
        text("Your Big Headline\nGoes Right Here", { font: "playfair", weight: 900, size: 0.07, color: "#111111", cx: 0.5, cy: 0.6, lineHeight: 1.1 }),
        text("A short line that sums up the story.", { font: "playfair", italic: true, size: 0.034, color: "#333333", cx: 0.5, cy: 0.69 }),
        text("Write the story here. Keep it short: two or three lines\nare enough for a reel, the picture does the rest.\nSwipe for more, and follow for daily news.", { font: "serif", weight: 400, size: 0.026, color: "#2b2b2b", cx: 0.5, cy: 0.775, lineHeight: 1.45 }),
      ],
    },
    {
      id: "live", group: "News", label: "Live badge",
      layers: () => [text("● LIVE", { font: "sans", weight: 800, size: 0.04, color: "#ffffff", bg: "#d90000", bgPad: 0.3, bgRadius: 0.2, cx: 0.14, cy: 0.07, anim: "pulse" })],
    },
    {
      id: "update", group: "News", label: "Update strip",
      layers: () => [
        box({ cx: 0.5, cy: 0.12, w: 1, h: 0.06, fill: "#0a2a66", fill2: "#1e5bd8", gradAngle: 0, anim: "slidein" }),
        text("UPDATE  |  Your news in one line", { font: "bebas", size: 0.052, color: "#ffffff", cx: 0.5, cy: 0.12, spacing: 0.03, anim: "slidein" }),
      ],
    },
    {
      id: "quote", group: "Quotes", label: "Quote card",
      layers: () => [
        box({ cx: 0.5, cy: 0.5, w: 1, h: 1, fill: "#1d2b64", fill2: "#f8cdda", gradAngle: 120 }),
        text("“", { font: "playfair", weight: 900, size: 0.35, color: "rgba(255,255,255,0.35)", cx: 0.5, cy: 0.3 }),
        text("Your quote goes here,\nmake it count.", { font: "playfair", italic: true, size: 0.065, color: "#ffffff", cx: 0.5, cy: 0.46, lineHeight: 1.25, shadow: "rgba(0,0,0,0.3)", shadowBlur: 0.2, anim: "fadein" }),
        text("— Author Name", { font: "sans", weight: 600, size: 0.035, color: "#ffffff", opacity: 0.85, cx: 0.5, cy: 0.58, anim: "fadein" }),
      ],
    },
    {
      id: "quoteblack", group: "Quotes", label: "Minimal quote",
      layers: () => [
        box({ cx: 0.5, cy: 0.5, w: 1, h: 1, fill: "#0b0b0b" }),
        text("Simple words,\nbig meaning.", { font: "playfair", italic: true, size: 0.062, color: "#ffffff", cx: 0.5, cy: 0.47, lineHeight: 1.25, anim: "fadein" }),
        text("AUTHOR NAME", { font: "bebas", size: 0.04, color: "#ffd60a", cx: 0.5, cy: 0.58, spacing: 0.08, anim: "fadein" }),
      ],
    },
    {
      id: "quotebrush", group: "Quotes", label: "Brush quote",
      layers: () => [
        text("“Your quote here”", { ...RESET, ...YELLOW_BRUSH, size: 0.06, cx: 0.5, cy: 0.45, anim: "slidein" }),
        text("— Author", { font: "marker", size: 0.04, color: "#ffffff", shadow: "rgba(0,0,0,0.6)", shadowBlur: 0.2, cx: 0.5, cy: 0.53, anim: "fadein" }),
      ],
    },
  ];
  const template = (id) => TEMPLATES.find((t) => t.id === id) || null;

  // ---- split-screen layouts --------------------------------------------------------------------
  // regions(p, gap): the canvas regions ({ x, y, w, h } fractions) for the main clip, then the others.
  const inset = (r, g) => ({ x: r.x + g / 2, y: r.y + g / 2, w: Math.max(0.01, r.w - g), h: Math.max(0.01, r.h - g) });
  const pip = (corner) => (p, gap, size = 0.32) => {
    const w = size;
    const h = Math.min(0.6, (w * p.w * 4) / 3 / p.h); // a 3:4 box
    const m = 0.04;
    const x = corner.includes("r") ? 1 - w - m : m;
    const y = corner.includes("b") ? 1 - h - m * (p.w / p.h) - 0.08 : m * (p.w / p.h) + 0.04;
    return [{ x: 0, y: 0, w: 1, h: 1 }, { x, y, w, h }];
  };
  const LAYOUTS = [
    { id: "tb50", label: "Top / bottom", needs: 2, regions: (p, g) => [inset({ x: 0, y: 0, w: 1, h: 0.5 }, g), inset({ x: 0, y: 0.5, w: 1, h: 0.5 }, g)] },
    { id: "tb60", label: "Top / bottom 60:40", needs: 2, regions: (p, g) => [inset({ x: 0, y: 0, w: 1, h: 0.6 }, g), inset({ x: 0, y: 0.6, w: 1, h: 0.4 }, g)] },
    { id: "lr", label: "Left / right", needs: 2, regions: (p, g) => [inset({ x: 0, y: 0, w: 0.5, h: 1 }, g), inset({ x: 0.5, y: 0, w: 0.5, h: 1 }, g)] },
    { id: "pip-tr", label: "Picture in picture ↗", needs: 2, pip: true, regions: pip("tr") },
    { id: "pip-tl", label: "Picture in picture ↖", needs: 2, pip: true, regions: pip("tl") },
    { id: "pip-br", label: "Picture in picture ↘", needs: 2, pip: true, regions: pip("br") },
    { id: "pip-bl", label: "Picture in picture ↙", needs: 2, pip: true, regions: pip("bl") },
    {
      id: "three", label: "Three-way", needs: 3,
      regions: (p, g) => [inset({ x: 0, y: 0, w: 1, h: 0.5 }, g), inset({ x: 0, y: 0.5, w: 0.5, h: 0.5 }, g), inset({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, g)],
    },
  ];
  const layout = (id) => LAYOUTS.find((l) => l.id === id) || null;

  return { STYLES, styleProps, GROUPS, TEMPLATES, template, LAYOUTS, layout };
})();
