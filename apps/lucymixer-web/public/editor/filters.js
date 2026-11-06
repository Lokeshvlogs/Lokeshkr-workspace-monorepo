// Image filters for the viewer. Loaded after settings.js and before content.js, sharing their scope.
//
// An adjustment set ("fx") is rendered in two parts, applied in this order:
//  1. an SVG filter: per-channel levels (auto, exposure, temperature, tint), a tone curve
//     (shadows, highlights), Curves and sharpening;
//  2. CSS filter functions: brightness, contrast, saturation, hue, sepia, grayscale, invert, blur.
// igfvChannelLut / igfvSharpenAmount reproduce part 1 in JS for saving the edited image.

const IGFV_FX_CONTROLS = [
  {
    group: "Light",
    controls: [
      { key: "exposure", label: "Exposure", min: -2, max: 2, step: 0.1, def: 0, unit: " EV", signed: true, decimals: 1 },
      { key: "brightness", label: "Brightness", min: 0, max: 200, step: 1, def: 100, unit: "%" },
      { key: "contrast", label: "Contrast", min: 0, max: 200, step: 1, def: 100, unit: "%" },
      { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1, def: 0, unit: "", signed: true },
      { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1, def: 0, unit: "", signed: true },
    ],
  },
  {
    group: "Color",
    controls: [
      { key: "saturation", label: "Saturation", min: 0, max: 200, step: 1, def: 100, unit: "%" },
      { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1, def: 0, unit: "", signed: true },
      { key: "tint", label: "Tint", min: -100, max: 100, step: 1, def: 0, unit: "", signed: true },
      { key: "hue", label: "Hue", min: -180, max: 180, step: 1, def: 0, unit: "°", signed: true },
      { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, def: 0, unit: "%" },
      { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, def: 0, unit: "%" },
      { key: "invert", label: "Invert", min: 0, max: 100, step: 1, def: 0, unit: "%" },
    ],
  },
  {
    group: "Detail",
    controls: [
      { key: "sharpen", label: "Sharpen", min: 0, max: 100, step: 1, def: 0, unit: "" },
      { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, def: 0, unit: " px", decimals: 1 },
      { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1, def: 0, unit: "" },
    ],
  },
];

const IGFV_FX_PRESETS = [
  { name: "Original", fx: {} },
  { name: "Vivid", fx: { saturation: 140, contrast: 110, sharpen: 20 } },
  { name: "Warm", fx: { temperature: 45, saturation: 110, exposure: 0.1 } },
  { name: "Cool", fx: { temperature: -45, saturation: 105, tint: -5 } },
  { name: "Mono", fx: { grayscale: 100, contrast: 110 } },
  { name: "Noir", fx: { grayscale: 100, contrast: 150, shadows: -30, vignette: 40 } },
  { name: "Vintage", fx: { sepia: 45, contrast: 90, saturation: 85, temperature: 20, vignette: 35 } },
  { name: "Fade", fx: { contrast: 80, shadows: 40, saturation: 80, brightness: 105 } },
  { name: "Dramatic", fx: { contrast: 135, highlights: -40, shadows: 30, saturation: 115, vignette: 30, sharpen: 25 } },
  { name: "Soft", fx: { contrast: 88, highlights: 25, brightness: 106, saturation: 92 } },
  { name: "Matte", fx: { contrast: 85, shadows: 50, highlights: -20, saturation: 90 } },
  { name: "Clarity", fx: { sharpen: 60, contrast: 115, shadows: 20, highlights: -20 } },
];

const IGFV_FX_CONTROL_LIST = IGFV_FX_CONTROLS.flatMap((g) => g.controls);
const IGFV_TONE_SAMPLES = 33;
const IGFV_SVG_NS = "http://www.w3.org/2000/svg";
const IGFV_CURVE_CHANNELS = ["rgb", "r", "g", "b"];
const IGFV_CURVE_SAMPLES = 65;
const IGFV_CURVE_IDENTITY = [
  [0, 0],
  [1, 1],
];

function igfvFxDefaults() {
  // auto: { r, g, b } of { slope, intercept }, from igfvAutoLevels.
  // curves: null, or { rgb, r, g, b } point lists [[x, y], ...] in 0-1, endpoints included.
  const fx = { auto: null, curves: null };
  for (const c of IGFV_FX_CONTROL_LIST) fx[c.key] = c.def;
  return fx;
}

function igfvCurveIsIdentity(points) {
  return !points || (points.length === 2 && points.every(([x, y]) => Math.abs(x - y) < 1e-6));
}

function igfvCurvesNeutral(curves) {
  return !curves || IGFV_CURVE_CHANNELS.every((ch) => igfvCurveIsIdentity(curves[ch]));
}

function igfvCurvesEqual(a, b) {
  if (igfvCurvesNeutral(a) || igfvCurvesNeutral(b)) return igfvCurvesNeutral(a) && igfvCurvesNeutral(b);
  return IGFV_CURVE_CHANNELS.every((ch) => {
    const pa = a[ch] || IGFV_CURVE_IDENTITY;
    const pb = b[ch] || IGFV_CURVE_IDENTITY;
    return (
      pa.length === pb.length &&
      pa.every(([x, y], i) => Math.abs(x - pb[i][0]) < 1e-4 && Math.abs(y - pb[i][1]) < 1e-4)
    );
  });
}

function igfvFxIsDefault(fx) {
  return !fx.auto && igfvCurvesNeutral(fx.curves) && IGFV_FX_CONTROL_LIST.every((c) => fx[c.key] === c.def);
}

// Whether the sliders and curves are exactly the preset's (Auto doesn't count).
function igfvFxMatchesPreset(fx, preset) {
  return (
    igfvCurvesEqual(fx.curves, preset.fx.curves) &&
    IGFV_FX_CONTROL_LIST.every((c) => fx[c.key] === (c.key in preset.fx ? preset.fx[c.key] : c.def))
  );
}

// Monotone cubic interpolation (Fritsch-Carlson) through sorted points, so the curve never overshoots.
function igfvCurveEval(points, x) {
  const pts = points && points.length >= 2 ? points : IGFV_CURVE_IDENTITY;
  const n = pts.length;
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[n - 1][0]) return pts[n - 1][1];
  const d = []; // secant slopes
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / Math.max(1e-6, pts[i + 1][0] - pts[i][0]));
  const m = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let i = 0;
  while (i < n - 2 && x > pts[i + 1][0]) i++;
  const [x0, y0] = pts[i];
  const [x1, y1] = pts[i + 1];
  const h = x1 - x0;
  const t = (x - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const y =
    (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m[i + 1];
  return Math.min(1, Math.max(0, y));
}

// Samples of the channel's curve followed by the RGB (master) curve, or null when both are identity.
function igfvCurveTable(fx, ch) {
  const curves = fx.curves;
  if (!curves || (igfvCurveIsIdentity(curves.rgb) && igfvCurveIsIdentity(curves[ch]))) return null;
  const table = [];
  for (let i = 0; i < IGFV_CURVE_SAMPLES; i++) {
    const x = i / (IGFV_CURVE_SAMPLES - 1);
    table.push(igfvCurveEval(curves.rgb, igfvCurveEval(curves[ch], x)));
  }
  return table;
}

// feFuncX type="table" interpolates linearly between samples; so does this.
function igfvTableAt(table, x) {
  const pos = x * (table.length - 1);
  const i = Math.min(table.length - 2, Math.floor(pos));
  return table[i] + (table[i + 1] - table[i]) * (pos - i);
}

function igfvFxFormat(control, value) {
  const text = control.decimals ? value.toFixed(control.decimals) : String(Math.round(value));
  return `${control.signed && value > 0 ? "+" : ""}${text}${control.unit}`;
}

// Per-channel out = slope * in + intercept, combining auto levels, exposure, temperature and tint.
function igfvLinear(fx) {
  const gain = Math.pow(2, fx.exposure);
  const t = fx.temperature / 100;
  const m = fx.tint / 100;
  const gains = { r: gain * (1 + 0.2 * t), g: gain * (1 - 0.15 * m), b: gain * (1 - 0.2 * t) };
  const out = {};
  for (const ch of ["r", "g", "b"]) {
    const base = fx.auto ? fx.auto[ch] : { slope: 1, intercept: 0 };
    out[ch] = { slope: base.slope * gains[ch], intercept: base.intercept * gains[ch] };
  }
  return out;
}

function igfvLinearNeutral(lin) {
  return ["r", "g", "b"].every((ch) => Math.abs(lin[ch].slope - 1) < 1e-6 && Math.abs(lin[ch].intercept) < 1e-6);
}

// Tone curve samples: shadows move the lower tones (peak at 1/3), highlights the upper (peak at 2/3).
function igfvToneTable(fx) {
  const s = fx.shadows / 100;
  const h = fx.highlights / 100;
  const table = [];
  for (let i = 0; i < IGFV_TONE_SAMPLES; i++) {
    const x = i / (IGFV_TONE_SAMPLES - 1);
    const shadow = s * 0.35 * 6.75 * x * (1 - x) * (1 - x);
    const highlight = h * 0.35 * 6.75 * x * x * (1 - x);
    table.push(Math.min(1, Math.max(0, x + shadow + highlight)));
  }
  return table;
}

function igfvSharpenAmount(fx) {
  return (fx.sharpen / 100) * 0.6;
}

function igfvSvgNeutral(fx) {
  return (
    igfvLinearNeutral(igfvLinear(fx)) && !fx.shadows && !fx.highlights && !fx.sharpen && igfvCurvesNeutral(fx.curves)
  );
}

function igfvBuildSvgFilter(doc, id, fx) {
  const el = (name, attrs) => {
    const node = doc.createElementNS(IGFV_SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const filter = el("filter", { id, "color-interpolation-filters": "sRGB" });

  const lin = igfvLinear(fx);
  if (!igfvLinearNeutral(lin)) {
    const transfer = el("feComponentTransfer", {});
    for (const ch of ["r", "g", "b"]) {
      transfer.appendChild(
        el(`feFunc${ch.toUpperCase()}`, { type: "linear", slope: lin[ch].slope, intercept: lin[ch].intercept })
      );
    }
    filter.appendChild(transfer);
  }

  if (fx.shadows || fx.highlights) {
    const values = igfvToneTable(fx).map((v) => v.toFixed(4)).join(" ");
    const tone = el("feComponentTransfer", {});
    for (const ch of ["R", "G", "B"]) tone.appendChild(el(`feFunc${ch}`, { type: "table", tableValues: values }));
    filter.appendChild(tone);
  }

  if (!igfvCurvesNeutral(fx.curves)) {
    const curves = el("feComponentTransfer", {});
    for (const ch of ["r", "g", "b"]) {
      const table = igfvCurveTable(fx, ch);
      const func = table
        ? el(`feFunc${ch.toUpperCase()}`, { type: "table", tableValues: table.map((v) => v.toFixed(4)).join(" ") })
        : el(`feFunc${ch.toUpperCase()}`, { type: "identity" });
      curves.appendChild(func);
    }
    filter.appendChild(curves);
  }

  if (fx.sharpen) {
    const a = igfvSharpenAmount(fx);
    filter.appendChild(
      el("feConvolveMatrix", {
        order: "3",
        kernelMatrix: `0 ${-a} 0 ${-a} ${1 + 4 * a} ${-a} 0 ${-a} 0`,
        divisor: "1",
        edgeMode: "duplicate",
        preserveAlpha: "true",
      })
    );
  }

  // An empty filter would make the element disappear; pass the image through unchanged instead.
  if (!filter.firstChild) filter.appendChild(el("feOffset", { dx: "0", dy: "0" }));
  return filter;
}

// svgId: the SVG filter to reference, or null to leave out the SVG part (it's then applied in JS).
function igfvCssFilter(fx, svgId, blurScale = 1) {
  const parts = [];
  if (svgId && !igfvSvgNeutral(fx)) parts.push(`url(#${svgId})`);
  if (fx.brightness !== 100) parts.push(`brightness(${fx.brightness / 100})`);
  if (fx.contrast !== 100) parts.push(`contrast(${fx.contrast / 100})`);
  if (fx.saturation !== 100) parts.push(`saturate(${fx.saturation / 100})`);
  if (fx.hue) parts.push(`hue-rotate(${fx.hue}deg)`);
  if (fx.sepia) parts.push(`sepia(${fx.sepia / 100})`);
  if (fx.grayscale) parts.push(`grayscale(${fx.grayscale / 100})`);
  if (fx.invert) parts.push(`invert(${fx.invert / 100})`);
  if (fx.blur) parts.push(`blur(${fx.blur * blurScale}px)`);
  return parts.join(" ");
}

// 256-entry lookup tables matching the SVG levels + tone curve + Curves, or null when they do nothing.
function igfvChannelLuts(fx) {
  const lin = igfvLinear(fx);
  const tone = fx.shadows || fx.highlights ? igfvToneTable(fx) : null;
  const curvesOn = !igfvCurvesNeutral(fx.curves);
  if (igfvLinearNeutral(lin) && !tone && !curvesOn) return null;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const luts = {};
  for (const ch of ["r", "g", "b"]) {
    const curve = curvesOn ? igfvCurveTable(fx, ch) : null;
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      let x = clamp(lin[ch].slope * (v / 255) + lin[ch].intercept);
      if (tone) x = igfvTableAt(tone, x);
      if (curve) x = igfvTableAt(curve, x);
      lut[v] = Math.round(x * 255);
    }
    luts[ch] = lut;
  }
  return luts;
}

// Applies the SVG part of fx to ImageData in place (used when saving).
function igfvApplySvgPart(imageData, fx) {
  const { data, width, height } = imageData;
  const luts = igfvChannelLuts(fx);
  if (luts) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = luts.r[data[i]];
      data[i + 1] = luts.g[data[i + 1]];
      data[i + 2] = luts.b[data[i + 2]];
    }
  }
  const a = igfvSharpenAmount(fx);
  if (!a) return;
  const src = new Uint8ClampedArray(data);
  const at = (x, y, c) =>
    src[(Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4 + c];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const around = at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c);
        data[i + c] = (1 + 4 * a) * src[i + c] - a * around;
      }
    }
  }
}

// Stretches each channel's 0.5%–99.5% range to full scale: fixes dull levels and colour casts together.
function igfvAutoLevels(imageData) {
  const { data } = imageData;
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    hist[0][data[i]]++;
    hist[1][data[i + 1]]++;
    hist[2][data[i + 2]]++;
    count++;
  }
  const result = {};
  ["r", "g", "b"].forEach((ch, c) => {
    const lowTarget = count * 0.005;
    const highTarget = count * 0.995;
    let sum = 0;
    let lo = 0;
    let hi = 255;
    for (let v = 0; v < 256; v++) {
      sum += hist[c][v];
      if (sum <= lowTarget) lo = v;
      if (sum < highTarget) hi = v + 1;
    }
    hi = Math.min(255, hi);
    if (!count || hi - lo < 16) {
      result[ch] = { slope: 1, intercept: 0 };
      return;
    }
    const slope = Math.min(2.5, 255 / (hi - lo));
    result[ch] = { slope, intercept: (-lo / 255) * slope };
  });
  return result;
}
