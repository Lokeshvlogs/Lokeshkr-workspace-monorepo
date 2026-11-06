// The editor's overlay clips, drawn on the canvas in track order (bottom track first):
//   text, sticker (emoji), asticker (built-in animated sticker, stickers.js),
//   shape (rect / ellipse / line / arrow), draw (brush strokes),
//   blur and pixelate (regions of what's under them), retouch (clone / heal strokes).
// Positions are fractions of the output canvas: cx, cy (centre), w, h; rotation in degrees.
// Sizes of text, strokes and brushes are fractions of the canvas's shorter side.
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Layers = (() => {
  const M = IgfvEditor.Model;

  const FONTS = [
    { id: "sans", label: "Sans", css: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    { id: "serif", label: "Serif", css: 'Georgia, "Times New Roman", Times, serif' },
    { id: "mono", label: "Mono", css: 'ui-monospace, "Cascadia Code", Consolas, "Courier New", monospace' },
    { id: "rounded", label: "Rounded", css: '"Arial Rounded MT Bold", "Varela Round", "Nunito", system-ui, sans-serif' },
    { id: "hand", label: "Handwriting", css: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive' },
    { id: "impact", label: "Impact", css: 'Impact, "Arial Black", "Helvetica Neue", sans-serif' },
    // Bundled with the editor (editor/fonts; SIL OFL, Permanent Marker: Apache 2.0).
    { id: "anton", label: "Anton", css: '"Anton", Impact, "Arial Narrow", sans-serif', weight: 400 },
    { id: "bebas", label: "Bebas Neue", css: '"Bebas Neue", Impact, "Arial Narrow", sans-serif', weight: 400 },
    { id: "marker", label: "Permanent Marker", css: '"Permanent Marker", "Segoe Print", "Comic Sans MS", cursive', weight: 400 },
    { id: "bangers", label: "Bangers", css: '"Bangers", Impact, "Comic Sans MS", sans-serif', weight: 400 },
    { id: "playfair", label: "Playfair Display", css: '"Playfair Display", Georgia, "Times New Roman", serif' },
  ];

  const FONT_FILES = [
    { family: "Anton", file: "Anton-Regular.ttf" },
    { family: "Bebas Neue", file: "BebasNeue-Regular.ttf" },
    { family: "Permanent Marker", file: "PermanentMarker-Regular.ttf" },
    { family: "Bangers", file: "Bangers-Regular.ttf" },
    { family: "Playfair Display", file: "PlayfairDisplay-VF.ttf", weight: "400 900" },
    { family: "Playfair Display", file: "PlayfairDisplay-Italic-VF.ttf", weight: "400 900", style: "italic" },
  ];

  // Loads the bundled fonts once per page (getBytes(file) -> ArrayBuffer). From their bytes, so the
  // page's font rules don't apply. Resolves with how many loaded.
  let fontsLoading = null;
  function loadFonts(getBytes) {
    if (fontsLoading) return fontsLoading;
    if (!getBytes || typeof FontFace === "undefined" || typeof document === "undefined" || !document.fonts) return Promise.resolve(0);
    fontsLoading = Promise.all(
      FONT_FILES.map(async (f) => {
        try {
          const face = new FontFace(f.family, await getBytes(f.file), { style: f.style || "normal", weight: f.weight || "400" });
          await face.load();
          document.fonts.add(face);
          return 1;
        } catch (err) {
          return 0;
        }
      })
    ).then((n) => n.reduce((a, b) => a + b, 0));
    return fontsLoading;
  }

  const BLENDS = [
    { id: "normal", label: "Normal", op: "source-over" },
    { id: "multiply", label: "Multiply", op: "multiply" },
    { id: "screen", label: "Screen", op: "screen" },
    { id: "overlay", label: "Overlay", op: "overlay" },
  ];

  const TRANSFORMABLE = new Set(["text", "sticker", "asticker", "shape", "blur", "pixelate"]);
  const ANIMATABLE = new Set(["text", "sticker", "asticker", "shape"]);

  // Text backgrounds: a box, a paint-brush stroke, a highlighter under each line, torn tape.
  const BG_STYLES = [
    { id: "box", label: "Box" },
    { id: "brush", label: "Brush" },
    { id: "marker", label: "Marker" },
    { id: "tape", label: "Tape" },
  ];

  function fontCss(layer, px) {
    const font = FONTS.find((f) => f.id === layer.font) || FONTS[0];
    // One-weight display fonts aren't made bolder by the browser.
    const weight = font.weight || layer.weight || 700;
    return `${layer.italic ? "italic " : ""}${weight} ${px}px ${font.css}`;
  }

  // ---- paint shapes (seeded, so a layer looks the same every frame) -----------------------------
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A dry paint-brush stroke filling about w × h around (0, 0): wobbly long edges, ragged ends.
  function brushPath(ctx, w, h, seed = 1) {
    const r = rng(seed);
    const n = 14;
    const x0 = -w / 2;
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.02, -h / 2 + h * 0.08);
    for (let i = 1; i <= n; i++) ctx.lineTo(x0 + (w * i) / n, -h / 2 + (r() - 0.35) * h * 0.12);
    // the right end: a few bristle spikes
    for (let i = 0; i < 5; i++) ctx.lineTo(w / 2 + (r() * 0.5 - 0.1) * h * 0.6, -h / 2 + ((i + 0.5) / 5) * h);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(x0 + (w * i) / n, h / 2 - (r() - 0.35) * h * 0.12);
    // the left end
    for (let i = 4; i >= 0; i--) ctx.lineTo(x0 - (r() * 0.4) * h * 0.5, -h / 2 + ((i + 0.3) / 5) * h);
    ctx.closePath();
  }

  // Thin lighter streaks along a brush stroke (the bristle marks).
  function brushStreaks(ctx, w, h, color, seed = 1) {
    const r = rng(seed * 7 + 3);
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const y = -h / 2 + h * (0.12 + r() * 0.76);
      ctx.lineWidth = Math.max(1, h * (0.02 + r() * 0.03));
      ctx.beginPath();
      ctx.moveTo(-w / 2 + w * r() * 0.3, y);
      ctx.lineTo(w / 2 - w * r() * 0.25, y + (r() - 0.5) * h * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Tape: a band with zig-zag short ends.
  function tapePath(ctx, w, h) {
    const teeth = 6;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    for (let i = 1; i <= teeth; i++) ctx.lineTo(w / 2 + (i % 2 ? h * 0.08 : 0), -h / 2 + (h * i) / teeth);
    ctx.lineTo(-w / 2, h / 2);
    for (let i = teeth - 1; i >= 0; i--) ctx.lineTo(-w / 2 - (i % 2 ? h * 0.08 : 0), -h / 2 + (h * i) / teeth);
    ctx.closePath();
  }

  // A linear gradient across a w × h box at angle degrees (90: top to bottom).
  function gradient(ctx, w, h, c1, c2, angle = 90) {
    const a = (angle * Math.PI) / 180;
    const dx = (Math.cos(a) * w) / 2;
    const dy = (Math.sin(a) * h) / 2;
    const g = ctx.createLinearGradient(-dx, -dy, dx, dy);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  // A colour darkened toward black by k (0-1); #rgb / #rrggbb only, else as is.
  function shade(color, k) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color || "");
    if (!m) return color;
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    const v = [0, 2, 4].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)));
    return `rgb(${v.join(",")})`;
  }

  // ---- new layers ---------------------------------------------------------------------------
  // A new overlay clip (the caller places it on a track, with start / dur).
  function make(p, type, props = {}) {
    const base = { id: p.nextId++, type, cx: 0.5, cy: 0.5, w: 0.3, h: 0.1, rotation: 0, opacity: 1, blend: "normal" };
    const presets = {
      text: {
        text: "Your text", font: "sans", size: 0.08, weight: 700, italic: false, align: "center", lineHeight: 1.2,
        spacing: 0, color: "#ffffff", bg: "", bgPad: 0.3, bgRadius: 0.25, outline: "", outlineWidth: 0.08,
        shadow: "rgba(0,0,0,0.6)", shadowBlur: 0.15, shadowX: 0, shadowY: 0.05,
      },
      sticker: { text: "✨", size: 0.18, anim: "none" },
      asticker: { design: "like", size: 0.16, color: "", text: "" },
      shape: { shape: "rect", fill: "", stroke: "#ffffff", strokeWidth: 0.008, w: 0.35, h: 0.25 },
      draw: { strokes: [], cx: 0.5, cy: 0.5, w: 1, h: 1 },
      blur: { shape: "rect", strength: 50, w: 0.3, h: 0.2 },
      pixelate: { shape: "rect", strength: 50, w: 0.3, h: 0.2 },
      retouch: { strokes: [], cx: 0.5, cy: 0.5, w: 1, h: 1 },
    };
    return { ...base, ...(presets[type] || {}), ...props };
  }

  // ---- measuring (text and stickers size themselves) -------------------------------------------
  let measureCanvas = null;
  function measureCtx() {
    measureCanvas ??= document.createElement("canvas");
    return measureCanvas.getContext("2d");
  }

  function textLines(layer) {
    return String(layer.text || "").split("\n");
  }

  // The layer's box in pixels on a canvas of W × H.
  function boxPx(layer, W, H) {
    const S = Math.min(W, H);
    if (layer.type === "asticker") {
      const h = Math.max(8, layer.size * S);
      return { w: h * IgfvEditor.Stickers.design(layer.design).aspect, h };
    }
    if (layer.type === "text" || layer.type === "sticker") {
      const px = Math.max(1, layer.size * S);
      const ctx = measureCtx();
      ctx.font = layer.type === "text" ? fontCss(layer, px) : `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      const lines = layer.type === "text" ? textLines(layer) : [layer.text];
      const spacing = (layer.spacing || 0) * px;
      let width = 0;
      for (const line of lines) width = Math.max(width, ctx.measureText(line).width + spacing * Math.max(0, [...line].length - 1));
      const lineH = px * (layer.type === "text" ? layer.lineHeight || 1.2 : 1.15);
      let w = width;
      let h = lineH * lines.length;
      if (layer.type === "text" && layer.bg) {
        w += px * (layer.bgPad || 0) * 2;
        h += px * (layer.bgPad || 0) * 2;
      }
      return { w: Math.max(8, w), h: Math.max(8, h) };
    }
    return { w: layer.w * W, h: layer.h * H };
  }

  // Updates w / h (fractions) of text / stickers after a change.
  function remeasure(layer, W, H) {
    if (layer.type !== "text" && layer.type !== "sticker" && layer.type !== "asticker") return;
    const box = boxPx(layer, W, H);
    layer.w = box.w / W;
    layer.h = box.h / H;
  }

  // ---- drawing ----------------------------------------------------------------------------------
  function withTransform(ctx, layer, W, H, fn) {
    ctx.save();
    ctx.translate(layer.cx * W, layer.cy * H);
    ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
    fn();
    ctx.restore();
  }

  function shapePath(ctx, shape, w, h) {
    ctx.beginPath();
    if (shape === "ellipse") ctx.ellipse(0, 0, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
    else ctx.rect(-w / 2, -h / 2, w, h);
  }

  function drawText(ctx, layer, W, H) {
    const S = Math.min(W, H);
    const px = Math.max(1, layer.size * S);
    const box = boxPx(layer, W, H);
    withTransform(ctx, layer, W, H, () => {
      ctx.font = fontCss(layer, px);
      ctx.textBaseline = "middle";
      const lines = textLines(layer);
      const lineH = px * (layer.lineHeight || 1.2);
      const bgStyle = layer.bgStyle || "box";
      if (layer.bg && bgStyle !== "marker") {
        ctx.save();
        ctx.fillStyle = layer.bg;
        if (bgStyle === "brush") {
          ctx.rotate(-0.02);
          brushPath(ctx, box.w * 1.06, box.h * 1.05, layer.bgSeed || 1);
          ctx.fill();
          brushStreaks(ctx, box.w, box.h, "#ffffff", layer.bgSeed || 1);
        } else if (bgStyle === "tape") {
          tapePath(ctx, box.w, box.h);
          ctx.fill();
        } else {
          IgfvEditor.Render.roundRect(ctx, -box.w / 2, -box.h / 2, box.w, box.h, px * (layer.bgRadius || 0));
          ctx.fill();
        }
        ctx.restore();
      }
      const pad = layer.bg ? px * (layer.bgPad || 0) : 0;
      const innerW = box.w - pad * 2;
      const top = -box.h / 2 + pad + lineH / 2;
      if (layer.shadow && layer.shadowBlur != null) {
        ctx.shadowColor = layer.shadow;
        ctx.shadowBlur = (layer.shadowBlur || 0) * px;
        ctx.shadowOffsetX = (layer.shadowX || 0) * px;
        ctx.shadowOffsetY = (layer.shadowY || 0) * px;
      }
      const spacing = (layer.spacing || 0) * px;
      lines.forEach((line, i) => {
        const y = top + i * lineH;
        const width = ctx.measureText(line).width + spacing * Math.max(0, [...line].length - 1);
        let x = -width / 2;
        if (layer.align === "left") x = -innerW / 2;
        if (layer.align === "right") x = innerW / 2 - width;
        const drawRun = (paint) => {
          if (!spacing) return paint(line, x);
          let at = x;
          for (const ch of line) {
            paint(ch, at);
            at += ctx.measureText(ch).width + spacing;
          }
        };
        ctx.textAlign = "left";
        // A highlighter band under the line.
        if (layer.bg && bgStyle === "marker") {
          ctx.save();
          ctx.shadowColor = "transparent";
          ctx.fillStyle = layer.bg;
          const mx = x - px * 0.15;
          const mw = width + px * 0.3;
          ctx.beginPath();
          ctx.moveTo(mx + px * 0.08, y - px * 0.05);
          ctx.lineTo(mx + mw, y - px * 0.1);
          ctx.lineTo(mx + mw - px * 0.08, y + px * 0.48);
          ctx.lineTo(mx, y + px * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        // 3D: the text repeated back along the angle, darker further back (the shadow under it).
        if (layer.depth > 0) {
          const a = ((layer.depthAngle ?? 45) * Math.PI) / 180;
          const len = layer.depth * px;
          const steps = Math.max(2, Math.min(40, Math.round(len)));
          const base = layer.depthColor || shade(layer.color || "#ffffff", 0.55);
          for (let i = steps; i >= 1; i--) {
            const d = (len * i) / steps;
            ctx.fillStyle = shade(base, (0.35 * i) / steps);
            if (i !== steps) ctx.shadowColor = "transparent";
            drawRun((t, at) => ctx.fillText(t, at + Math.cos(a) * d, y + Math.sin(a) * d));
          }
          ctx.shadowColor = "transparent";
        }
        if (layer.outline && layer.outlineWidth) {
          ctx.lineJoin = "round";
          ctx.lineWidth = layer.outlineWidth * px;
          ctx.strokeStyle = layer.outline;
          drawRun((t, at) => ctx.strokeText(t, at, y));
          ctx.shadowColor = "transparent";
        }
        if (layer.glow) {
          ctx.shadowColor = layer.glow;
          ctx.shadowBlur = (layer.glowBlur ?? 0.35) * px;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        ctx.fillStyle = layer.color || "#fff";
        if (layer.fill2) {
          // the gradient runs over this line's height
          const g = ctx.createLinearGradient(0, y - px / 2, 0, y + px / 2);
          g.addColorStop(0, layer.color || "#fff");
          g.addColorStop(1, layer.fill2);
          ctx.fillStyle = g;
        }
        drawRun((t, at) => ctx.fillText(t, at, y));
        if (layer.glow) drawRun((t, at) => ctx.fillText(t, at, y));
        ctx.shadowColor = "transparent";
        // Gloss: a light sheen over the upper half of the letters; bevel: a thin light edge.
        if (layer.gloss > 0) {
          const g = ctx.createLinearGradient(0, y - px / 2, 0, y + px * 0.05);
          g.addColorStop(0, `rgba(255,255,255,${Math.min(1, layer.gloss) * 0.85})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          drawRun((t, at) => ctx.fillText(t, at, y));
        }
        if (layer.bevel) {
          ctx.lineWidth = Math.max(1, px * 0.02);
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          drawRun((t, at) => ctx.strokeText(t, at - px * 0.01, y - px * 0.01));
        }
      });
    });
  }

  function drawSticker(ctx, layer, W, H) {
    const px = Math.max(1, layer.size * Math.min(W, H));
    withTransform(ctx, layer, W, H, () => {
      ctx.font = `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.text, 0, px * 0.05);
    });
  }

  function drawShape(ctx, layer, W, H) {
    const w = layer.w * W;
    const h = layer.h * H;
    const lw = Math.max(1, (layer.strokeWidth || 0) * Math.min(W, H));
    withTransform(ctx, layer, W, H, () => {
      if (layer.shape === "line" || layer.shape === "arrow") {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = lw;
        ctx.strokeStyle = layer.stroke || "#fff";
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(w / 2, 0);
        ctx.stroke();
        if (layer.shape === "arrow") {
          const head = Math.max(lw * 3, 10);
          ctx.beginPath();
          ctx.moveTo(w / 2 - head, -head * 0.6);
          ctx.lineTo(w / 2, 0);
          ctx.lineTo(w / 2 - head, head * 0.6);
          ctx.stroke();
        }
        return;
      }
      if (layer.shape === "brush") brushPath(ctx, w, h, layer.seed || 1);
      else if (layer.shape === "rect" && layer.radius > 0) IgfvEditor.Render.roundRect(ctx, -w / 2, -h / 2, w, h, layer.radius * Math.min(W, H));
      else shapePath(ctx, layer.shape, w, h);
      if (layer.fill) {
        ctx.fillStyle = layer.fill2 ? gradient(ctx, w, h, layer.fill, layer.fill2, layer.gradAngle ?? 90) : layer.fill;
        ctx.fill();
        if (layer.shape === "brush") brushStreaks(ctx, w, h, "#ffffff", layer.seed || 1);
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = layer.stroke;
        ctx.stroke();
      }
    });
  }

  function strokePath(ctx, points, W, H) {
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * W, y * H);
      else ctx.lineTo(x * W, y * H);
    });
    if (points.length === 1) ctx.lineTo(points[0][0] * W + 0.01, points[0][1] * H);
  }

  function drawStrokes(ctx, layer, W, H) {
    // Drawn on their own canvas so the eraser only erases this layer.
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const lctx = c.getContext("2d");
    const S = Math.min(W, H);
    for (const s of layer.strokes) {
      lctx.save();
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = Math.max(1, s.size * S);
      lctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over";
      lctx.globalAlpha = s.mode === "highlight" ? Math.min(0.45, s.opacity ?? 0.4) : s.opacity ?? 1;
      lctx.strokeStyle = s.color || "#fff";
      if (s.hardness != null && s.hardness < 1 && s.mode !== "erase") {
        lctx.shadowColor = s.color || "#fff";
        lctx.shadowBlur = (1 - s.hardness) * s.size * S;
      }
      strokePath(lctx, s.points, W, H);
      lctx.stroke();
      lctx.restore();
    }
    ctx.drawImage(c, 0, 0);
  }

  // Blur / pixelate: what's under the region, softened, clipped to its shape.
  function drawRegion(ctx, layer, W, H) {
    const w = layer.w * W;
    const h = layer.h * H;
    const S = Math.min(W, H);
    const snapshot = document.createElement("canvas");
    snapshot.width = W;
    snapshot.height = H;
    snapshot.getContext("2d").drawImage(ctx.canvas, 0, 0);
    withTransform(ctx, layer, W, H, () => {
      shapePath(ctx, layer.shape, w, h);
      ctx.clip();
      ctx.rotate((-(layer.rotation || 0) * Math.PI) / 180);
      ctx.translate(-layer.cx * W, -layer.cy * H);
      if (layer.type === "blur") {
        ctx.filter = `blur(${Math.max(1, (layer.strength / 100) * S * 0.04)}px)`;
        ctx.drawImage(snapshot, 0, 0);
        ctx.filter = "none";
      } else {
        const block = Math.max(2, Math.round((layer.strength / 100) * S * 0.05));
        const small = document.createElement("canvas");
        small.width = Math.max(1, Math.ceil(W / block));
        small.height = Math.max(1, Math.ceil(H / block));
        const sctx = small.getContext("2d");
        sctx.drawImage(snapshot, 0, 0, small.width, small.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, small.width * block, small.height * block);
        ctx.imageSmoothingEnabled = true;
      }
    });
  }

  // Clone / heal: soft round stamps along the stroke, copied from (point + offset) of the picture as
  // it was before this layer.
  function drawRetouch(ctx, layer, W, H) {
    if (!layer.strokes.length) return;
    const S = Math.min(W, H);
    const snapshot = document.createElement("canvas");
    snapshot.width = W;
    snapshot.height = H;
    snapshot.getContext("2d").drawImage(ctx.canvas, 0, 0);
    const stamp = document.createElement("canvas");
    for (const s of layer.strokes) {
      const r = Math.max(2, (s.size * S) / 2);
      const d = Math.ceil(r * 2);
      stamp.width = d;
      stamp.height = d;
      const sctx = stamp.getContext("2d");
      const step = Math.max(1, r * 0.35);
      let last = null;
      for (const [px, py] of densify(s.points, W, H, step)) {
        if (last && Math.hypot(px - last[0], py - last[1]) < step * 0.5) continue;
        last = [px, py];
        sctx.globalCompositeOperation = "source-over";
        sctx.clearRect(0, 0, d, d);
        const sx = px + s.dx * W - r;
        const sy = py + s.dy * H - r;
        sctx.drawImage(snapshot, sx, sy, d, d, 0, 0, d, d);
        // Feathered edge (heal: softer).
        const g = sctx.createRadialGradient(r, r, 0, r, r, r);
        g.addColorStop(s.mode === "heal" ? 0.35 : 0.6, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        sctx.globalCompositeOperation = "destination-in";
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, d, d);
        ctx.drawImage(stamp, px - r, py - r);
      }
    }
  }

  function densify(points, W, H, step) {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const [x, y] = [points[i][0] * W, points[i][1] * H];
      if (i === 0) {
        out.push([x, y]);
        continue;
      }
      const [px, py] = [points[i - 1][0] * W, points[i - 1][1] * H];
      const dist = Math.hypot(x - px, y - py);
      const n = Math.max(1, Math.floor(dist / step));
      for (let k = 1; k <= n; k++) out.push([px + ((x - px) * k) / n, py + ((y - py) * k) / n]);
    }
    return out;
  }

  // Heal: the offset to copy from: of 8 directions around the spot, the patch whose average colour is
  // closest to the ring around the spot (so it matches its surroundings). Fractions of W / H.
  function healOffset(canvas, x, y, size) {
    const W = canvas.width;
    const H = canvas.height;
    const r = Math.max(2, (size * Math.min(W, H)) / 2);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const avg = (cx, cy, rad) => {
      const x0 = Math.max(0, Math.round(cx - rad));
      const y0 = Math.max(0, Math.round(cy - rad));
      const w = Math.max(1, Math.min(W - x0, Math.round(rad * 2)));
      const h = Math.max(1, Math.min(H - y0, Math.round(rad * 2)));
      const px = ctx.getImageData(x0, y0, w, h).data;
      let rr = 0, gg = 0, bb = 0, n = 0;
      for (let i = 0; i < px.length; i += 16) {
        rr += px[i];
        gg += px[i + 1];
        bb += px[i + 2];
        n++;
      }
      return [rr / n, gg / n, bb / n];
    };
    const X = x * W;
    const Y = y * H;
    const ring = avg(X, Y, r * 1.6);
    let best = null;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const dx = Math.cos(a) * r * 2.2;
      const dy = Math.sin(a) * r * 2.2;
      if (X + dx - r < 0 || Y + dy - r < 0 || X + dx + r > W || Y + dy + r > H) continue;
      const p = avg(X + dx, Y + dy, r);
      const diff = Math.hypot(p[0] - ring[0], p[1] - ring[1], p[2] - ring[2]);
      if (!best || diff < best.diff) best = { diff, dx, dy };
    }
    if (!best) best = { dx: r * 2.2, dy: 0 };
    return { dx: best.dx / W, dy: best.dy / H };
  }

  // t: seconds into the clip (animated stickers).
  function draw(ctx, layer, W, H, t = 0) {
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;
    ctx.globalCompositeOperation = (BLENDS.find((b) => b.id === layer.blend) || BLENDS[0]).op;
    if (ANIMATABLE.has(layer.type) && layer.anim && layer.anim !== "none") {
      // The animation moves the sticker about its centre (or its top, for a swing).
      const m = IgfvEditor.Stickers.animate(layer.anim, t);
      const box = boxPx(layer, W, H);
      const px = layer.cx * W;
      const py = layer.cy * H + m.pivotY * box.h;
      // Moves across the canvas (slide in), fades, and the ticker: right to left, round and round.
      let ox = (m.dxW || 0) * W;
      const oy = (m.dyH || 0) * H;
      if (layer.anim === "ticker") {
        const run = W + box.w;
        const shift = (t * W * (layer.tickerSpeed || 0.18)) % run;
        ox = W + box.w / 2 - shift - px;
      }
      if (m.alpha != null) ctx.globalAlpha *= Math.max(0, Math.min(1, m.alpha));
      ctx.translate(px + ox + m.dx * box.h, py + oy + m.dy * box.h);
      ctx.rotate(m.rot);
      ctx.scale(Math.max(0.001, m.scale), Math.max(0.001, m.scale));
      ctx.translate(-px, -py);
    }
    switch (layer.type) {
      case "text":
        drawText(ctx, layer, W, H);
        break;
      case "sticker":
        drawSticker(ctx, layer, W, H);
        break;
      case "asticker": {
        const box = boxPx(layer, W, H);
        withTransform(ctx, layer, W, H, () => IgfvEditor.Stickers.draw(ctx, layer, box.w, box.h, t));
        break;
      }
      case "shape":
        drawShape(ctx, layer, W, H);
        break;
      case "draw":
        drawStrokes(ctx, layer, W, H);
        break;
      case "blur":
      case "pixelate":
        ctx.globalCompositeOperation = "source-over";
        drawRegion(ctx, layer, W, H);
        break;
      case "retouch":
        ctx.globalCompositeOperation = "source-over";
        drawRetouch(ctx, layer, W, H);
        break;
    }
    ctx.restore();
  }

  // ---- hit testing (canvas fractions) --------------------------------------------------------------
  // Is (x, y) (fractions of the W × H canvas) inside a clip's box (box: its size in pixels)?
  function hitBox(clip, x, y, W, H, box) {
    const a = (-(clip.rotation || 0) * Math.PI) / 180;
    const dx = (x - clip.cx) * W;
    const dy = (y - clip.cy) * H;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    const pad = 6;
    const hh = clip.type === "shape" && (clip.shape === "line" || clip.shape === "arrow") ? Math.max(box.h, 16) : box.h;
    return Math.abs(lx) <= box.w / 2 + pad && Math.abs(ly) <= hh / 2 + pad;
  }

  function label(layer) {
    switch (layer.type) {
      case "text":
        return `T  ${String(layer.text).split("\n")[0].slice(0, 24) || "Text"}`;
      case "sticker":
        return `${layer.text}  Sticker`;
      case "asticker":
        return `\u2728  ${IgfvEditor.Stickers.design(layer.design).label}`;
      case "shape":
        return `▢  ${{ rect: "Rectangle", ellipse: "Ellipse", line: "Line", arrow: "Arrow", brush: "Brush stroke" }[layer.shape] || "Shape"}`;
      case "draw":
        return "✎  Drawing";
      case "blur":
        return "◌  Blur";
      case "pixelate":
        return "▦  Pixelate";
      case "retouch":
        return "✦  Retouch";
      default:
        return layer.type;
    }
  }

  return { FONTS, BG_STYLES, BLENDS, TRANSFORMABLE, ANIMATABLE, loadFonts, make, boxPx, remeasure, draw, hitBox, label, healOffset };
})();
