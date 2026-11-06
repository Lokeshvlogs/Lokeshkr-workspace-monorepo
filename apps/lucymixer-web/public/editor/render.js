// The editor's renderer: the project's canvas and background, then every clip shown at a time, bottom
// track first: media clips through crop / straighten / turn / flip → colour (WebGL2) → placement;
// overlays by layers.js. The colour step follows the viewer's filters exactly (its lookup tables,
// then brightness, contrast, saturate, hue-rotate, sepia, grayscale, invert as CSS defines them), then
// the editor's own: whites / blacks / levels (in the tables), vibrance, HSL, split toning, clarity,
// sharpen, blur, grain and vignette. Without WebGL2 a 2D path does the tables and CSS part.
// Then a clip's effects (effects.js), its motion, transitions between clips (each side drawn into
// a full-canvas layer, then mixed), and adjustment clips (effects over everything below them).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Render = (() => {
  const M = IgfvEditor.Model;

  const VERTEX = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_src;
uniform sampler2D u_blur;
uniform sampler2D u_lut;
uniform vec2 u_texel;
uniform vec2 u_size;
uniform float u_sharpen;
uniform float u_brightness;
uniform float u_contrast;
uniform mat3 u_sat;
uniform mat3 u_hue;
uniform mat3 u_sepia;
uniform mat3 u_gray;
uniform float u_invert;
uniform float u_blurMix;
uniform float u_vibrance;
uniform float u_clarity;
uniform float u_grain;
uniform float u_grainSize;
uniform float u_seed;
uniform float u_hslOn;
uniform vec3 u_hsl[8];
uniform vec4 u_split;
uniform float u_splitBalance;
uniform vec4 u_vig;

vec3 lut(vec3 c) {
  ivec3 i = ivec3(clamp(c, 0.0, 1.0) * 255.0 + 0.5);
  return vec3(texelFetch(u_lut, ivec2(i.r, 0), 0).r, texelFetch(u_lut, ivec2(i.g, 0), 0).g, texelFetch(u_lut, ivec2(i.b, 0), 0).b);
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 rgb2hsl(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float l = (mx + mn) * 0.5;
  float d = mx - mn;
  if (d < 1e-5) return vec3(0.0, 0.0, l);
  float s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
  float h;
  if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  return vec3(h * 60.0, s, l);
}

float hue2rgb(float p, float q, float t) {
  t = fract(t);
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x / 360.0;
  float s = hsl.y;
  float l = hsl.z;
  if (s < 1e-5) return vec3(l);
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  return vec3(hue2rgb(p, q, h + 1.0 / 3.0), hue2rgb(p, q, h), hue2rgb(p, q, h - 1.0 / 3.0));
}

const float CENTRES[9] = float[9](0.0, 30.0, 60.0, 120.0, 180.0, 225.0, 270.0, 315.0, 360.0);

vec3 hslShift(float hue) {
  float h = mod(hue, 360.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float a = CENTRES[i];
    float b = CENTRES[i + 1];
    if (h >= a && h <= b) {
      float t = (h - a) / (b - a);
      float s = t * t * (3.0 - 2.0 * t);
      acc = u_hsl[i] * (1.0 - s) + u_hsl[i == 7 ? 0 : i + 1] * s;
    }
  }
  return acc;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = v_uv;
  vec3 c = lut(texture(u_src, uv).rgb);
  vec3 blurred = lut(texture(u_blur, uv).rgb);
  if (u_sharpen > 0.0) {
    vec3 n = lut(texture(u_src, uv + vec2(u_texel.x, 0.0)).rgb) + lut(texture(u_src, uv - vec2(u_texel.x, 0.0)).rgb)
      + lut(texture(u_src, uv + vec2(0.0, u_texel.y)).rgb) + lut(texture(u_src, uv - vec2(0.0, u_texel.y)).rgb);
    c = clamp(c * (1.0 + 4.0 * u_sharpen) - n * u_sharpen, 0.0, 1.0);
  }
  if (u_clarity != 0.0) {
    float l = luma(c);
    float mid = 1.0 - abs(2.0 * l - 1.0);
    c = clamp(c + (c - blurred) * u_clarity * 1.5 * mid, 0.0, 1.0);
  }
  c = clamp(c * u_brightness, 0.0, 1.0);
  c = clamp((c - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  c = clamp(u_sat * c, 0.0, 1.0);
  c = clamp(u_hue * c, 0.0, 1.0);
  c = clamp(u_sepia * c, 0.0, 1.0);
  c = clamp(u_gray * c, 0.0, 1.0);
  c = c * (1.0 - 2.0 * u_invert) + u_invert;
  if (u_blurMix > 0.0) c = mix(c, blurred, u_blurMix);
  if (u_vibrance != 0.0) {
    float mx = max(c.r, max(c.g, c.b));
    float mn = min(c.r, min(c.g, c.b));
    float amt = u_vibrance * (1.0 - (mx - mn));
    c = clamp(mix(vec3(luma(c)), c, 1.0 + amt), 0.0, 1.0);
  }
  if (u_hslOn > 0.5) {
    vec3 hsl = rgb2hsl(c);
    vec3 d = hslShift(hsl.x);
    float sw = smoothstep(0.0, 0.2, hsl.y);
    hsl.x += d.x * sw;
    hsl.y = clamp(hsl.y * (1.0 + d.y), 0.0, 1.0);
    hsl.z = clamp(hsl.z + d.z * 0.25 * sw * (1.0 - abs(2.0 * hsl.z - 1.0)), 0.0, 1.0);
    c = hsl2rgb(hsl);
  }
  if (u_split.y > 0.0 || u_split.w > 0.0) {
    float l = luma(c);
    float pivot = 0.5 - u_splitBalance * 0.3;
    float hi = smoothstep(pivot, 1.0, l);
    float sh = 1.0 - smoothstep(0.0, pivot, l);
    vec3 hiTint = hsl2rgb(vec3(u_split.x, 1.0, 0.5)) - 0.5;
    vec3 shTint = hsl2rgb(vec3(u_split.z, 1.0, 0.5)) - 0.5;
    c = clamp(c + hiTint * u_split.y * hi * 0.4 + shTint * u_split.w * sh * 0.4, 0.0, 1.0);
  }
  if (u_grain > 0.0) {
    vec2 cell = floor(uv * u_size / max(1.0, u_grainSize));
    float n = hash(cell + u_seed) - 0.5;
    float l = luma(c);
    c = clamp(c + n * u_grain * 0.35 * (1.0 - abs(2.0 * l - 1.0) * 0.6), 0.0, 1.0);
  }
  if (u_vig.x > 0.0) {
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= mix(1.0, u_vig.w, u_vig.z);
    float d = length(p) / 1.41421356;
    float a = u_vig.x * clamp((d - u_vig.y) / max(0.001, 1.0 - u_vig.y), 0.0, 1.0);
    c *= 1.0 - a;
  }
  o = vec4(c, 1.0);
}`;

  // ---- CSS filter matrices (Filter Effects spec), row-major ---------------------------------
  function saturateMatrix(s) {
    return [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
    ];
  }

  function hueMatrix(deg) {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [
      0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
    ];
  }

  function sepiaMatrix(amount) {
    const k = 1 - amount;
    return [
      0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k,
      0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k,
      0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k,
    ];
  }

  function grayMatrix(amount) {
    const k = 1 - amount;
    return [
      0.2126 + 0.7874 * k, 0.7152 - 0.7152 * k, 0.0722 - 0.0722 * k,
      0.2126 - 0.2126 * k, 0.7152 + 0.2848 * k, 0.0722 - 0.0722 * k,
      0.2126 - 0.2126 * k, 0.7152 - 0.7152 * k, 0.0722 + 0.9278 * k,
    ];
  }

  const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  // The numbers the shader needs, from the adjustments.
  function uniformsFor(adjust, width, height, seed = 0) {
    const a = adjust;
    const hsl = [];
    let hslOn = 0;
    for (const band of M.HSL_BANDS) {
      const v = (a.hsl && a.hsl[band.id]) || { h: 0, s: 0, l: 0 };
      hsl.push(v.h, v.s / 100, v.l / 100);
      if (v.h || v.s || v.l) hslOn = 1;
    }
    const sp = a.split || {};
    return {
      sharpen: typeof igfvSharpenAmount === "function" ? igfvSharpenAmount(a) : (a.sharpen / 100) * 0.6,
      brightness: a.brightness / 100,
      contrast: a.contrast / 100,
      sat: a.saturation !== 100 ? saturateMatrix(a.saturation / 100) : IDENTITY,
      hue: a.hue ? hueMatrix(a.hue) : IDENTITY,
      sepia: a.sepia ? sepiaMatrix(a.sepia / 100) : IDENTITY,
      gray: a.grayscale ? grayMatrix(a.grayscale / 100) : IDENTITY,
      invert: a.invert / 100,
      blurMix: Math.min(1, (a.blur || 0) / 8),
      vibrance: (a.vibrance || 0) / 100,
      clarity: (a.clarity || 0) / 100,
      grain: (a.grain || 0) / 100,
      grainSize: a.grainSize || 1.5,
      seed,
      hslOn,
      hsl,
      split: [sp.hiHue || 0, (sp.hiSat || 0) / 100, sp.shHue || 0, (sp.shSat || 0) / 100],
      splitBalance: (sp.balance || 0) / 100,
      vig: [
        ((a.vignette || 0) / 100) * 0.85,
        typeof a.vignetteMid === "number" ? (70 - a.vignette * 0.3) / 100 + (a.vignetteMid - 50) / 100 : 0.55,
        (a.vignetteRound || 0) / 100,
        width / Math.max(1, height),
      ],
    };
  }

  // ---- WebGL2 -------------------------------------------------------------------------------
  class Gl {
    constructor() {
      this.canvas = document.createElement("canvas");
      const gl = this.canvas.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error("no webgl2");
      this.gl = gl;
      const compile = (type, text) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, text);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        return sh;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      this.prog = prog;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = (unit, filter) => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };
      this.srcTex = tex(0, gl.LINEAR);
      this.blurTex = tex(1, gl.LINEAR);
      this.lutTex = tex(2, gl.NEAREST);
      this.u = {};
      for (const name of [
        "u_src", "u_blur", "u_lut", "u_texel", "u_size", "u_sharpen", "u_brightness", "u_contrast", "u_sat", "u_hue",
        "u_sepia", "u_gray", "u_invert", "u_blurMix", "u_vibrance", "u_clarity", "u_grain", "u_grainSize", "u_seed",
        "u_hslOn", "u_hsl", "u_split", "u_splitBalance", "u_vig",
      ]) {
        this.u[name] = gl.getUniformLocation(prog, name);
      }
      gl.uniform1i(this.u.u_src, 0);
      gl.uniform1i(this.u.u_blur, 1);
      gl.uniform1i(this.u.u_lut, 2);
      this.lutKey = "";
      this.blurCanvas = document.createElement("canvas");
    }

    // Processes a canvas; returns this.canvas holding the result (same size).
    process(source, adjust, tables, seed) {
      const gl = this.gl;
      const w = source.width;
      const h = source.height;
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      // A soft copy for clarity / blur: drawn small, then smoothed back up by the texture filter.
      const needBlur = adjust.clarity || adjust.blur;
      const bw = needBlur ? Math.max(1, Math.round(w / 12)) : 1;
      const bh = needBlur ? Math.max(1, Math.round(h / 12)) : 1;
      this.blurCanvas.width = bw;
      this.blurCanvas.height = bh;
      if (needBlur) {
        const bctx = this.blurCanvas.getContext("2d");
        bctx.filter = "blur(1px)";
        bctx.drawImage(source, 0, 0, bw, bh);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.blurTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.blurCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      // Tables: only re-uploaded when they change.
      const key = `${tables.r.join(",")}|${tables.g.join(",")}|${tables.b.join(",")}`;
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
      if (key !== this.lutKey) {
        const data = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
          data[i * 4] = tables.r[i];
          data[i * 4 + 1] = tables.g[i];
          data[i * 4 + 2] = tables.b[i];
          data[i * 4 + 3] = 255;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        this.lutKey = key;
      }
      const u = uniformsFor(adjust, w, h, seed);
      const U = this.u;
      gl.uniform2f(U.u_texel, 1 / w, 1 / h);
      gl.uniform2f(U.u_size, w, h);
      gl.uniform1f(U.u_sharpen, u.sharpen);
      gl.uniform1f(U.u_brightness, u.brightness);
      gl.uniform1f(U.u_contrast, u.contrast);
      gl.uniformMatrix3fv(U.u_sat, true, u.sat);
      gl.uniformMatrix3fv(U.u_hue, true, u.hue);
      gl.uniformMatrix3fv(U.u_sepia, true, u.sepia);
      gl.uniformMatrix3fv(U.u_gray, true, u.gray);
      gl.uniform1f(U.u_invert, u.invert);
      gl.uniform1f(U.u_blurMix, u.blurMix);
      gl.uniform1f(U.u_vibrance, u.vibrance);
      gl.uniform1f(U.u_clarity, u.clarity);
      gl.uniform1f(U.u_grain, u.grain);
      gl.uniform1f(U.u_grainSize, u.grainSize);
      gl.uniform1f(U.u_seed, u.seed);
      gl.uniform1f(U.u_hslOn, u.hslOn);
      gl.uniform3fv(U.u_hsl, u.hsl);
      gl.uniform4fv(U.u_split, u.split);
      gl.uniform1f(U.u_splitBalance, u.splitBalance);
      gl.uniform4fv(U.u_vig, u.vig);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return this.canvas;
    }
  }

  // ---- 2D fallback: the tables, then the CSS part (as the viewer's own fallback does) ------
  function process2d(source, adjust, tables, work) {
    const w = source.width;
    const h = source.height;
    work.width = w;
    work.height = h;
    const ctx = work.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    if (!M.tablesNeutral(tables)) {
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        px[i] = tables.r[px[i]];
        px[i + 1] = tables.g[px[i + 1]];
        px[i + 2] = tables.b[px[i + 2]];
      }
      ctx.putImageData(data, 0, 0);
    }
    const css = typeof igfvCssFilter === "function" ? igfvCssFilter(adjust, null, 1) : "";
    if (!css && !adjust.vignette) return work;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const octx = out.getContext("2d");
    octx.filter = css || "none";
    octx.drawImage(work, 0, 0);
    octx.filter = "none";
    if (adjust.vignette) drawVignette(octx, w, h, adjust.vignette);
    return out;
  }

  function drawVignette(ctx, w, h, amount) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale((w / 2) * Math.SQRT2, (h / 2) * Math.SQRT2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop((70 - amount * 0.3) / 100, "rgba(0, 0, 0, 0)");
    g.addColorStop(1, `rgba(0, 0, 0, ${(amount / 100) * 0.85})`);
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  // ---- the project's picture -----------------------------------------------------------------
  // Each media clip: its source cropped / turned / flipped / straightened, then coloured, then placed
  // on the canvas (position, scale, rotation, opacity, blend, frame). Overlays are drawn by layers.js.
  // A clip's picture is cached while nothing about it changes (a still image, a paused frame).
  class Renderer {
    constructor() {
      try {
        this.gl = new Gl();
      } catch (err) {
        console.debug("[igfv] editor: WebGL2 unavailable, using the 2D path", err);
        this.gl = null;
      }
      this.work = document.createElement("canvas");
      this.tables = new Map(); // adjust key -> channel tables
      this.cache = new Map(); // clip id -> { key, geo, canvas }
    }

    get advanced() {
      return Boolean(this.gl); // HSL, split toning, clarity, grain, vibrance need WebGL2
    }

    // The source with the clip's crop, straighten, quarter turns and flips, into `canvas` (iw × ih).
    geometry(clip, media, source, srcW, srcH, iw, ih, canvas) {
      canvas.width = iw;
      canvas.height = ih;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, iw, ih);
      const c = clip.crop;
      const [ow, oh] = M.orientedSize(media, c);
      const cw = c.w * ow;
      const ch = c.h * oh;
      const zoom = M.straightenZoom(cw, ch, ow, oh, c.angle || 0);
      const scale = iw / cw;
      ctx.save();
      ctx.translate(iw / 2, ih / 2);
      ctx.rotate(((c.angle || 0) * Math.PI) / 180);
      ctx.scale(scale * zoom, scale * zoom);
      ctx.translate(-(c.x + c.w / 2) * ow, -(c.y + c.h / 2) * oh);
      ctx.translate(ow / 2, oh / 2);
      ctx.scale(c.flipH ? -1 : 1, c.flipV ? -1 : 1);
      ctx.rotate((c.rot * Math.PI) / 2);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();
      return canvas;
    }

    tablesFor(adjust) {
      const key = JSON.stringify([adjust.auto, adjust.exposure, adjust.temperature, adjust.tint, adjust.shadows, adjust.highlights, adjust.curves, adjust.levels, adjust.whites, adjust.blacks]);
      let t = this.tables.get(key);
      if (!t) {
        t = M.channelTables(adjust);
        if (this.tables.size > 32) this.tables.clear();
        this.tables.set(key, t);
      }
      return t;
    }

    colour(adjust, image, seed) {
      const tables = this.tablesFor(adjust);
      if (this.gl) {
        try {
          return this.gl.process(image, adjust, tables, seed);
        } catch (err) {
          console.debug("[igfv] editor: WebGL failed, using the 2D path", err);
          this.gl = null;
        }
      }
      return process2d(image, adjust, tables, this.work);
    }

    // A media clip's picture at iw × ih (cached by what it depends on). lt: seconds into the clip.
    clipPicture(clip, media, src, iw, ih, { before = false, seed = 0, lt = 0 } = {}) {
      const FX = IgfvEditor.Effects;
      const effects = !before && FX ? clip.effects || [] : [];
      const fxTime = effects.length && FX.animated(effects) ? Math.round(lt * 1000) : 0;
      const key = JSON.stringify([clip.crop, clip.adjust, iw, ih, before, src.frameKey, clip.adjust.grain ? seed : 0, this.gl ? 1 : 0, effects, fxTime]);
      let entry = this.cache.get(clip.id);
      if (!entry) {
        entry = { key: "", geo: document.createElement("canvas"), canvas: document.createElement("canvas") };
        this.cache.set(clip.id, entry);
      }
      if (entry.key === key) return entry.canvas;
      // A video still seeking / loading draws nothing useful: its last good picture stays, and a
      // picture drawn now isn't kept (the re-render after "seeked" draws the real frame).
      if (src.pending && entry.key && entry.canvas.width === iw && entry.canvas.height === ih) return entry.canvas;
      const geo = this.geometry(clip, media, src.el, src.w, src.h, iw, ih, entry.geo);
      // A green screen is keyed out first, so the colour adjustments don't move the key.
      const keyed = effects.length ? FX.applyKey(geo, effects, { t: lt, seed: clip.id }) : geo;
      let result = before || M.adjustIsNeutral(clip.adjust) ? keyed : this.colour(clip.adjust, keyed, seed);
      if (effects.length) result = FX.apply(result, effects, { t: lt, seed: clip.id });
      entry.canvas.width = iw;
      entry.canvas.height = ih;
      const ctx = entry.canvas.getContext("2d");
      ctx.clearRect(0, 0, iw, ih);
      ctx.drawImage(result, 0, 0);
      entry.key = src.pending ? "" : key;
      return entry.canvas;
    }

    forget(clipId) {
      this.cache.delete(clipId);
    }

    // A clip drawn at its place (media through clipPicture, overlays by layers.js).
    drawClip(ctx, p, clip, W, H, lt, opts) {
      clip = M.animated(clip, lt); // keyframes: the values at this moment
      if (M.VISUAL_MEDIA.has(clip.type)) {
        const src = opts.getSource && opts.getSource(clip, clip.start + lt);
        if (!src || !src.w || !src.h) return;
        const box = M.mediaBox(p, clip, W, H);
        const iw = Math.max(1, Math.round(Math.min(box.w, 4096)));
        const ih = Math.max(1, Math.round(Math.min(box.h, 4096)));
        const pic = this.clipPicture(clip, p.media[clip.media], src, iw, ih, { ...opts, lt });
        const FX = IgfvEditor.Effects;
        drawPlaced(ctx, clip, W, H, box, pic, FX && FX.hasMotion(clip.effects) ? FX.motion(clip.effects, lt, clip.dur) : null);
      } else if (IgfvEditor.Layers) {
        IgfvEditor.Layers.draw(ctx, clip, W, H, lt);
      }
    }

    // An adjustment clip: its effects over everything drawn so far (its opacity mixes them in).
    adjustCanvas(ctx, out, clip, lt) {
      const FX = IgfvEditor.Effects;
      if (!FX || !(clip.effects || []).some((e) => e.on !== false)) return;
      const W = out.width;
      const H = out.height;
      let res = FX.apply(out, clip.effects, { t: lt, seed: clip.id });
      const m = FX.hasMotion(clip.effects) ? FX.motion(clip.effects, lt, clip.dur) : null;
      if (res === out && !m) return;
      if (res === out) {
        // Motion only: move a copy of the canvas.
        res = this.layerCanvas("adjust-copy", W, H);
        res.getContext("2d").drawImage(out, 0, 0);
      }
      const opacity = clip.opacity ?? 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      if (opacity >= 1) ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, opacity);
      if (m) {
        ctx.translate(W / 2 + m.dx * W, H / 2 + m.dy * H);
        ctx.rotate((m.rot * Math.PI) / 180);
        ctx.scale(m.scale, m.scale);
        ctx.translate(-W / 2, -H / 2);
      }
      ctx.drawImage(res, 0, 0);
      ctx.restore();
    }

    // A full-canvas layer (for transitions), cleared.
    layerCanvas(key, W, H) {
      this.layers ??= new Map();
      let c = this.layers.get(key);
      if (!c) {
        if (this.layers.size > 12) this.layers.clear();
        c = document.createElement("canvas");
        this.layers.set(key, c);
      }
      if (c.width !== W || c.height !== H) {
        c.width = W;
        c.height = H;
      } else {
        c.getContext("2d").clearRect(0, 0, W, H);
      }
      return c;
    }

    // Draws the project at time t into `out`. opts: { scale, even, before, opaque (background
    // without transparency), getSource(clip, t) -> { el, w, h, frameKey } | null, skipId, seed }.
    compose(p, t, out, opts = {}) {
      const size = M.outputSize(p, opts.scale || 1, opts.even);
      const W = size.width;
      const H = size.height;
      if (out.width !== W) out.width = W;
      if (out.height !== H) out.height = H;
      const ctx = out.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      ctx.clearRect(0, 0, W, H);
      const alpha = opts.opaque ? 1 : p.bg.alpha;
      if (alpha > 0) {
        ctx.fillStyle = rgba(p.bg.color, alpha);
        ctx.fillRect(0, 0, W, H);
      }
      const still = M.isStill(p);
      const FX = IgfvEditor.Effects;
      const outgoing = new Map(); // incoming clip id -> the outgoing clip's layer
      for (const clip of M.activeClips(p, t, { transitions: true })) {
        if (clip.id === opts.skipId) continue;
        const lt = still ? 0 : t - clip.start;
        if (clip.type === "adjust") {
          this.adjustCanvas(ctx, out, clip, lt);
          continue;
        }
        const tr = still || !FX ? null : M.transitionAt(p, clip, t);
        if (!tr) {
          this.drawClip(ctx, p, clip, W, H, lt, opts);
          continue;
        }
        // In a transition: this clip into a layer of its own, then mixed with its partner.
        const layer = this.layerCanvas(`${tr.role}-${clip.id}`, W, H);
        this.drawClip(layer.getContext("2d"), p, clip, W, H, lt, opts);
        if (tr.role === "out") {
          outgoing.set(tr.partner, layer);
          continue;
        }
        const from = tr.partner != null ? outgoing.get(clip.id) || null : null;
        outgoing.delete(clip.id);
        FX.transition(tr.type, ctx, from, layer, tr.progress, W, H);
      }
      // An outgoing clip whose incoming one wasn't drawn: as it is.
      for (const layer of outgoing.values()) ctx.drawImage(layer, 0, 0);
      return size;
    }
  }

  function rgba(hex, alpha) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = m ? parseInt(m[1], 16) : 0xffffff;
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  const BLEND_OPS = { normal: "source-over", multiply: "multiply", screen: "screen", overlay: "overlay" };

  // A media clip's picture at its place: centre, rotation, opacity, blend; rounded corners, border.
  // motion: { dx, dy, scale, rot } from motion effects, or null.
  function drawPlaced(ctx, clip, W, H, box, pic, motion = null) {
    // A split-screen box with its picture zoomed out: the picture only inside the box.
    if (clip.split && clip.region && clip.boxZoom != null && clip.boxZoom < 1) return drawInBox(ctx, clip, W, H, box, pic, motion);
    ctx.save();
    ctx.globalAlpha = clip.opacity ?? 1;
    ctx.globalCompositeOperation = BLEND_OPS[clip.blend] || "source-over";
    ctx.translate(clip.cx * W + (motion ? motion.dx * W : 0), clip.cy * H + (motion ? motion.dy * H : 0));
    ctx.rotate((((clip.rotation || 0) + (motion ? motion.rot : 0)) * Math.PI) / 180);
    if (motion && motion.scale !== 1) ctx.scale(motion.scale, motion.scale);
    const f = clip.frame || {};
    const r = Math.min(box.w, box.h) * (f.radius || 0);
    if (r) {
      roundRect(ctx, -box.w / 2, -box.h / 2, box.w, box.h, r);
      ctx.clip();
    }
    ctx.drawImage(pic, -box.w / 2, -box.h / 2, box.w, box.h);
    if (f.border) {
      const bw = Math.max(1, Math.min(box.w, box.h) * f.border);
      ctx.strokeStyle = f.borderColor || "#fff";
      if (r) {
        ctx.lineWidth = bw * 2; // the outer half is clipped away by the rounded corners
        roundRect(ctx, -box.w / 2, -box.h / 2, box.w, box.h, r);
        ctx.stroke();
      } else {
        ctx.lineWidth = bw;
        ctx.strokeRect(-box.w / 2 + bw / 2, -box.h / 2 + bw / 2, box.w - bw, box.h - bw);
      }
    }
    ctx.restore();
  }

  function drawInBox(ctx, clip, W, H, box, pic, motion) {
    const r = clip.region;
    const rx = r.x * W;
    const ry = r.y * H;
    const rw = r.w * W;
    const rh = r.h * H;
    const f = clip.frame || {};
    const rad = Math.min(rw, rh) * (f.radius || 0);
    ctx.save();
    ctx.globalAlpha = clip.opacity ?? 1;
    ctx.globalCompositeOperation = BLEND_OPS[clip.blend] || "source-over";
    roundRect(ctx, rx, ry, rw, rh, rad);
    ctx.clip();
    ctx.translate(clip.cx * W + (motion ? motion.dx * W : 0), clip.cy * H + (motion ? motion.dy * H : 0));
    ctx.rotate((motion ? motion.rot : 0) * Math.PI / 180);
    if (motion && motion.scale !== 1) ctx.scale(motion.scale, motion.scale);
    ctx.drawImage(pic, -box.w / 2, -box.h / 2, box.w, box.h);
    ctx.restore();
    if (f.border) {
      ctx.save();
      const bw = Math.max(1, Math.min(rw, rh) * f.border);
      ctx.strokeStyle = f.borderColor || "#fff";
      ctx.lineWidth = bw;
      roundRect(ctx, rx + bw / 2, ry + bw / 2, rw - bw, rh - bw, Math.max(0, rad - bw / 2));
      ctx.stroke();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // Histogram of a canvas: { r, g, b, l } arrays of 256 counts, from a small copy.
  function histogram(canvas) {
    const small = document.createElement("canvas");
    const k = Math.min(1, 256 / Math.max(canvas.width, canvas.height));
    small.width = Math.max(1, Math.round(canvas.width * k));
    small.height = Math.max(1, Math.round(canvas.height * k));
    const ctx = small.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, small.width, small.height);
    const px = ctx.getImageData(0, 0, small.width, small.height).data;
    const h = { r: new Uint32Array(256), g: new Uint32Array(256), b: new Uint32Array(256), l: new Uint32Array(256) };
    for (let i = 0; i < px.length; i += 4) {
      h.r[px[i]]++;
      h.g[px[i + 1]]++;
      h.b[px[i + 2]]++;
      h.l[Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722)]++;
    }
    return h;
  }

  return { Renderer, uniformsFor, saturateMatrix, hueMatrix, sepiaMatrix, grayMatrix, histogram, roundRect, rgba, FRAGMENT };
})();
