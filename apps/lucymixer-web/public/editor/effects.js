// The editor's effects and transitions (catalogues in model.js).
// - apply(canvas, effects, opts): a clip's picture (or the canvas so far, for an adjustment clip)
//   through its effects in order: shader effects (one WebGL2 program), canvas ones (blur, glow,
//   tilt-shift, cinematic bars) and particles drawn over it (snow, rain, confetti, hearts...).
// - motion(effects, t, dur): how motion effects move a clip (shake, pulse, Ken Burns, spin...).
// - transition(type, ctx, from, to, progress, W, H): mixes two full-canvas layers.
// Without WebGL2 a few shader effects have a canvas fallback; the others are skipped.
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Effects = (() => {
  const M = IgfvEditor.Model;

  const GL_IDS = {
    glitch: 0, rgbsplit: 1, vhs: 2, oldfilm: 3, halftone: 4, posterize: 5, mosaic: 6, sketch: 7, emboss: 8,
    duotone: 9, thermal: 10, nightvision: 11, invert: 12, neon: 13, zoomblur: 14, motionblur: 15, lightleak: 16,
    lensvignette: 17, mirror: 18, kaleido: 19, bulge: 20, pinch: 21, swirl: 22, wave: 23, ripple: 24, strobe: 25,
    chromakey: 26,
  };

  const VERTEX = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  // uv: (0, 0) bottom left, y up (the source is uploaded flipped).
  const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_src;
uniform vec2 u_size;
uniform float u_time;
uniform float u_amount;
uniform vec4 u_p;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform float u_seed;
uniform int u_effect;

const float PI = 3.14159265;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21) + u_seed * 0.0137);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash1(float n) {
  return fract(sin(n * 12.9898 + u_seed * 7.13) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

vec4 tex(vec2 uv) {
  return texture(u_src, clamp(uv, vec2(0.0), vec2(1.0)));
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec2 aspect() {
  return vec2(u_size.x / u_size.y, 1.0);
}

float sobel(vec2 uv) {
  vec2 t = 1.0 / u_size;
  float tl = luma(tex(uv + t * vec2(-1.0, 1.0)).rgb);
  float tc = luma(tex(uv + t * vec2(0.0, 1.0)).rgb);
  float tr = luma(tex(uv + t * vec2(1.0, 1.0)).rgb);
  float ml = luma(tex(uv + t * vec2(-1.0, 0.0)).rgb);
  float mr = luma(tex(uv + t * vec2(1.0, 0.0)).rgb);
  float bl = luma(tex(uv + t * vec2(-1.0, -1.0)).rgb);
  float bc = luma(tex(uv + t * vec2(0.0, -1.0)).rgb);
  float br = luma(tex(uv + t * vec2(1.0, -1.0)).rgb);
  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -bl - 2.0 * bc - br + tl + 2.0 * tc + tr;
  return length(vec2(gx, gy));
}

vec3 thermalRamp(float l) {
  vec3 a = vec3(0.0, 0.0, 0.2);
  vec3 b = vec3(0.35, 0.0, 0.6);
  vec3 c = vec3(0.9, 0.1, 0.2);
  vec3 d = vec3(1.0, 0.75, 0.0);
  vec3 e = vec3(1.0, 1.0, 0.85);
  if (l < 0.25) return mix(a, b, l / 0.25);
  if (l < 0.5) return mix(b, c, (l - 0.25) / 0.25);
  if (l < 0.75) return mix(c, d, (l - 0.5) / 0.25);
  return mix(d, e, (l - 0.75) / 0.25);
}

void main() {
  vec2 uv = v_uv;
  float A = u_amount;
  float t = u_time;
  vec4 src = tex(uv);
  vec4 c = src;
  if (u_effect == 0) {
    // glitch: slices shifted sideways, colour fringes, broken blocks on some frames
    float f = floor(t * (4.0 + u_p.x * 20.0));
    float band = floor(uv.y * 28.0);
    float burst = step(0.7, hash1(f));
    float shift = hash(vec2(band, f)) > 1.0 - 0.4 * A ? (hash(vec2(f, band + 7.0)) - 0.5) * 0.2 * A : 0.0;
    vec2 q = vec2(uv.x + shift * (0.4 + burst), uv.y);
    float ca = (0.004 + 0.012 * burst) * A;
    c = tex(q);
    c.r = tex(q + vec2(ca, 0.0)).r;
    c.b = tex(q - vec2(ca, 0.0)).b;
    vec2 blk = floor(uv * vec2(18.0, 10.0));
    if (hash(blk + f) > 1.0 - 0.06 * A * burst) c.rgb = vec3(hash(blk + f + 1.0), hash(blk - f), hash(blk + 3.0 * f));
  } else if (u_effect == 1) {
    // RGB split
    float a = u_p.x * PI / 180.0;
    vec2 d = vec2(cos(a), sin(a)) * 0.03 * A / aspect();
    vec4 r = tex(uv + d);
    vec4 b = tex(uv - d);
    c = vec4(r.r, src.g, b.b, max(src.a, max(r.a, b.a)));
  } else if (u_effect == 2) {
    // VHS: jitter, a tracking band, colour bleed, scanlines, noise
    float jit = (noise(vec2(uv.y * 90.0, t * 12.0)) - 0.5) * 0.006 * A;
    float inBand = 1.0 - smoothstep(0.0, 0.03, abs(fract(uv.y * 0.7 + t * 0.12) - 0.5));
    vec2 q = vec2(uv.x + jit + inBand * 0.03 * A, uv.y);
    float ca = 0.004 * A;
    vec3 col = vec3(tex(q + vec2(ca, 0.0)).r, tex(q).g, tex(q - vec2(ca, 0.0)).b);
    vec3 bleed = (tex(q + vec2(0.006, 0.0)).rgb + tex(q - vec2(0.006, 0.0)).rgb) * 0.5;
    col = mix(col, bleed, 0.35 * A);
    col *= 1.0 - 0.18 * A * (0.5 + 0.5 * sin(uv.y * u_size.y * 1.6));
    col += (hash(uv * u_size + floor(t * 30.0)) - 0.5) * 0.14 * A;
    col += inBand * 0.15 * A * hash(vec2(uv.x * 200.0, floor(t * 30.0)));
    col = mix(col, col * vec3(1.06, 0.96, 1.08), A);
    c = vec4(clamp(col, 0.0, 1.0), tex(q).a);
  } else if (u_effect == 3) {
    // old film: sepia, flicker, grain, scratches, dust, vignette
    vec3 col = src.rgb;
    vec3 sep = vec3(dot(col, vec3(0.393, 0.769, 0.189)), dot(col, vec3(0.349, 0.686, 0.168)), dot(col, vec3(0.272, 0.534, 0.131)));
    col = mix(col, min(sep, vec3(1.0)), A);
    float fr = floor(t * 18.0);
    col *= 1.0 + (hash1(fr) - 0.5) * 0.18 * A;
    col += (hash(uv * u_size * 0.7 + fr) - 0.5) * 0.16 * A;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      if (hash1(fr * 1.7 + fi * 13.0) < 0.6 * A) {
        float x = hash1(fr + fi * 7.0) + sin(uv.y * 9.0 + fi) * 0.003;
        col -= (1.0 - smoothstep(0.0, 1.5 / u_size.x, abs(uv.x - x))) * 0.45;
      }
    }
    col -= smoothstep(0.965, 0.995, noise(uv * u_size / 5.0 + fr * 31.0)) * 0.7 * A;
    col *= mix(1.0, smoothstep(0.95, 0.25, length((uv - 0.5) * aspect())), 0.7 * A);
    c = vec4(clamp(col, 0.0, 1.0), src.a);
  } else if (u_effect == 4) {
    // halftone: dots on a 45-degree grid, sized by darkness
    float cell = max(2.0, u_p.x);
    mat2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071);
    vec2 g = r * (uv * u_size);
    vec2 cc = (floor(g / cell) + 0.5) * cell;
    vec4 s = tex((transpose(r) * cc) / u_size);
    float rad = cell * 0.5 * sqrt(clamp(1.0 - luma(s.rgb), 0.0, 1.0)) * 1.3;
    float ink = 1.0 - smoothstep(rad - 0.75, rad + 0.75, length(g - cc));
    vec3 inkCol = u_p.y > 0.5 ? vec3(0.08) : clamp(s.rgb * 0.75, 0.0, 1.0);
    vec3 col = mix(vec3(0.97, 0.96, 0.92), inkCol, ink);
    c = vec4(mix(src.rgb, col, A), src.a);
  } else if (u_effect == 5) {
    float n = mix(12.0, 2.0, A);
    c.rgb = floor(src.rgb * n + 0.5) / n;
  } else if (u_effect == 6) {
    float b = 2.0 + A * 60.0;
    c = tex((floor(uv * u_size / b) + 0.5) * b / u_size);
  } else if (u_effect == 7) {
    float e = sobel(uv);
    vec3 col = vec3(clamp(1.0 - e * 1.6, 0.0, 1.0) * (0.85 + 0.15 * luma(src.rgb)));
    c = vec4(mix(src.rgb, col, A), src.a);
  } else if (u_effect == 8) {
    vec2 d = 1.5 / u_size;
    vec3 e = 0.5 + (tex(uv - d).rgb - tex(uv + d).rgb) * 2.0;
    c = vec4(mix(src.rgb, vec3(luma(e)), A), src.a);
  } else if (u_effect == 9) {
    c = vec4(mix(src.rgb, mix(u_c1, u_c2, luma(src.rgb)), A), src.a);
  } else if (u_effect == 10) {
    c = vec4(mix(src.rgb, thermalRamp(luma(src.rgb)), A), src.a);
  } else if (u_effect == 11) {
    // night vision
    float l = pow(clamp(luma(src.rgb) * 1.6, 0.0, 1.0), 0.8);
    l += (hash(uv * u_size + floor(t * 24.0)) - 0.5) * 0.25;
    l *= 0.85 + 0.15 * sin(uv.y * u_size.y * 1.2);
    l *= smoothstep(0.9, 0.35, length((uv - 0.5) * aspect()));
    c = vec4(mix(src.rgb, vec3(0.1, 1.0, 0.25) * clamp(l, 0.0, 1.2), A), src.a);
  } else if (u_effect == 12) {
    c.rgb = mix(src.rgb, 1.0 - src.rgb, A);
  } else if (u_effect == 13) {
    // neon edges
    float e = clamp(sobel(uv) * 2.5, 0.0, 1.0);
    vec3 hue = normalize(src.rgb + 0.05) * 1.7;
    c = vec4(clamp(src.rgb * (1.0 - 0.85 * A) + hue * e * A, 0.0, 1.0), src.a);
  } else if (u_effect == 14) {
    // zoom blur towards a centre (params: percent, y from the top)
    vec2 ctr = vec2(u_p.x / 100.0, 1.0 - u_p.y / 100.0);
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 24; i++) acc += tex(ctr + (uv - ctr) * (1.0 - 0.35 * A * float(i) / 23.0));
    c = acc / 24.0;
  } else if (u_effect == 15) {
    float a = u_p.x * PI / 180.0;
    vec2 d = vec2(cos(a), sin(a)) * 0.06 * A / aspect();
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 24; i++) acc += tex(uv + d * (float(i) / 23.0 - 0.5));
    c = acc / 24.0;
  } else if (u_effect == 16) {
    // light leak: two drifting warm glows, screened
    float s = t * (0.1 + u_p.x / 100.0 * 0.8);
    vec2 a1 = vec2(0.15 + 0.35 * sin(s * 1.1 + u_seed), 0.75 + 0.25 * cos(s * 0.7));
    vec2 a2 = vec2(0.85 + 0.2 * cos(s * 0.9), 0.25 + 0.35 * sin(s * 1.3 + 2.0));
    vec2 q = uv * aspect();
    vec3 leak = u_c1 * smoothstep(0.9, 0.0, length(q - a1 * aspect())) + u_c2 * smoothstep(0.8, 0.0, length(q - a2 * aspect()));
    leak *= 0.75 + 0.25 * sin(s * 3.0);
    c = vec4(1.0 - (1.0 - src.rgb) * (1.0 - clamp(leak * A, 0.0, 1.0)), src.a);
  } else if (u_effect == 17) {
    float r0 = mix(0.25, 0.75, u_p.x / 100.0);
    c.rgb = src.rgb * mix(1.0, smoothstep(r0 + 0.45, r0 - 0.15, length((uv - 0.5) * aspect())), A);
  } else if (u_effect == 18) {
    // mirror: 0 left half to the right, 1 right to left, 2 top down, 3 bottom up, 4 quad
    vec2 q = uv;
    int m = int(u_p.x + 0.5);
    if (m == 0 || m == 4) q.x = q.x > 0.5 ? 1.0 - q.x : q.x;
    if (m == 1) q.x = q.x < 0.5 ? 1.0 - q.x : q.x;
    if (m == 2 || m == 4) q.y = q.y < 0.5 ? 1.0 - q.y : q.y;
    if (m == 3) q.y = q.y > 0.5 ? 1.0 - q.y : q.y;
    c = tex(q);
  } else if (u_effect == 19) {
    vec2 d = (uv - 0.5) * aspect();
    float seg = 2.0 * PI / max(3.0, floor(u_p.x + 0.5));
    float a = mod(atan(d.y, d.x) + t * u_p.y / 50.0, seg);
    a = abs(a - seg * 0.5);
    c = mix(src, tex(vec2(cos(a), sin(a)) * length(d) / aspect() + 0.5), A);
  } else if (u_effect == 20 || u_effect == 21) {
    // bulge (20) / pinch (21)
    vec2 d = (uv - 0.5) * aspect();
    float k = (1.0 - smoothstep(0.0, 0.5, length(d))) * A * 0.7;
    c = tex(d * (u_effect == 20 ? 1.0 - k : 1.0 + k) / aspect() + 0.5);
  } else if (u_effect == 22) {
    vec2 d = (uv - 0.5) * aspect();
    float a = A * 6.0 * pow(max(0.0, 1.0 - length(d) / 0.5), 2.0);
    float s = sin(a);
    float co = cos(a);
    c = tex(vec2(co * d.x - s * d.y, s * d.x + co * d.y) / aspect() + 0.5);
  } else if (u_effect == 23) {
    float sp = t * (u_p.y / 100.0) * 6.0;
    c = tex(uv + vec2(sin(uv.y * u_p.x * 2.0 * PI + sp), cos(uv.x * u_p.x * PI + sp * 0.8) * 0.5) * 0.025 * A);
  } else if (u_effect == 24) {
    vec2 d = (uv - 0.5) * aspect();
    float r = length(d);
    vec2 dir = r > 0.0001 ? d / r : vec2(0.0);
    float w = sin(r * 70.0 - t * (2.0 + u_p.x / 10.0)) * 0.012 * A * smoothstep(0.75, 0.0, r);
    c = tex(uv + dir * w / aspect());
  } else if (u_effect == 25) {
    float period = mix(0.6, 0.07, u_p.x / 100.0);
    c.rgb = mix(src.rgb, vec3(1.0), step(fract(t / period), 0.3) * A * 0.85);
  } else if (u_effect == 26) {
    // chroma key: the distance from the key colour in CbCr sets alpha; spill desaturates what's
    // close to it (same maths as keyPixels() in effects.js)
    vec3 cb = vec3(-0.168736, -0.331264, 0.5);
    vec3 cr = vec3(0.5, -0.418688, -0.081312);
    float d = distance(vec2(dot(src.rgb, cb), dot(src.rgb, cr)), vec2(dot(u_c1, cb), dot(u_c1, cr)));
    float sim = u_p.x / 100.0 * 0.4;
    float smo = max(0.001, u_p.y / 100.0 * 0.5);
    float a = smoothstep(sim, sim + smo, d);
    float spill = (1.0 - smoothstep(sim, sim + smo + 0.25, d)) * u_p.z / 100.0;
    c = vec4(mix(src.rgb, vec3(luma(src.rgb)), spill), src.a * a);
  }
  o = c;
}`;

  // ---- WebGL2 -----------------------------------------------------------------------------------
  class Fx {
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
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.u = {};
      for (const name of ["u_src", "u_size", "u_time", "u_amount", "u_p", "u_c1", "u_c2", "u_seed", "u_effect"]) this.u[name] = gl.getUniformLocation(prog, name);
      gl.uniform1i(this.u.u_src, 0);
    }

    // One effect over a canvas; returns this.canvas (same size).
    run(source, e, t, seed) {
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
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      const g = glParams(e);
      const U = this.u;
      gl.uniform2f(U.u_size, w, h);
      gl.uniform1f(U.u_time, t);
      gl.uniform1f(U.u_amount, amountOf(e));
      gl.uniform4fv(U.u_p, g.p);
      gl.uniform3fv(U.u_c1, g.c1);
      gl.uniform3fv(U.u_c2, g.c2);
      gl.uniform1f(U.u_seed, seed % 1000);
      gl.uniform1i(U.u_effect, GL_IDS[e.type]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return this.canvas;
    }
  }

  function amountOf(e) {
    const def = M.effectDef(e.type);
    return def && def.noAmount ? 1 : M.clamp((e.amount ?? 100) / 100, 0, 1);
  }

  function rgb01(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = m ? parseInt(m[1], 16) : 0xffffff;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  const choiceIndex = (e, key) => {
    const prm = (M.effectDef(e.type).params || []).find((x) => x.k === key);
    return prm ? Math.max(0, prm.choices.findIndex((c) => c[0] === e[key])) : 0;
  };

  // The shader's u_p / colours for an effect.
  function glParams(e) {
    const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const p = [0, 0, 0, 0];
    switch (e.type) {
      case "glitch":
        p[0] = n(e.speed, 50) / 100;
        break;
      case "rgbsplit":
      case "motionblur":
        p[0] = n(e.angle, 0);
        break;
      case "halftone":
        p[0] = n(e.size, 7);
        p[1] = e.ink === "black" ? 1 : 0;
        break;
      case "zoomblur":
        p[0] = n(e.x, 50);
        p[1] = n(e.y, 50);
        break;
      case "lightleak":
        p[0] = n(e.speed, 40);
        break;
      case "lensvignette":
        p[0] = n(e.size, 50);
        break;
      case "mirror":
        p[0] = choiceIndex(e, "mode");
        break;
      case "kaleido":
        p[0] = n(e.segments, 6);
        p[1] = n(e.spin, 0);
        break;
      case "wave":
        p[0] = n(e.freq, 10);
        p[1] = n(e.speed, 40);
        break;
      case "ripple":
      case "strobe":
        p[0] = n(e.speed, 50);
        break;
      case "chromakey":
        p[0] = n(e.similarity, 40);
        p[1] = n(e.smoothness, 25);
        p[2] = n(e.spill, 50);
        return { p, c1: rgb01(e.color || "#00d000"), c2: [1, 1, 1] };
    }
    return { p, c1: rgb01(e.c1 || "#000000"), c2: rgb01(e.c2 || "#ffffff") };
  }

  // ---- the chain ----------------------------------------------------------------------------------
  let fx = undefined; // Fx, or null without WebGL2
  function getFx() {
    if (fx === undefined) {
      try {
        fx = new Fx();
      } catch (err) {
        console.debug("[igfv] editor: effects without WebGL2", err);
        fx = null;
      }
    }
    return fx;
  }

  const pool = [];
  function work(i, w, h) {
    pool[i] ??= document.createElement("canvas");
    const c = pool[i];
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    } else {
      c.getContext("2d").clearRect(0, 0, w, h);
    }
    return c;
  }

  // Is the effect drawn by apply() (not a motion or keying effect, switched on, known)?
  function isPictureEffect(e) {
    const def = M.effectDef(e.type);
    return Boolean(def && e.on !== false && def.kind !== "motion" && def.kind !== "key");
  }

  function isKeyEffect(e) {
    const def = M.effectDef(e.type);
    return Boolean(def && e.on !== false && def.kind === "key");
  }

  // Chroma key on RGBA bytes (the 2D path; the shader does the same).
  function keyPixels(data, e) {
    const [kr, kg, kb] = rgb01(e.color || "#00d000");
    const cbOf = (r, g, b) => -0.168736 * r - 0.331264 * g + 0.5 * b;
    const crOf = (r, g, b) => 0.5 * r - 0.418688 * g - 0.081312 * b;
    const kcb = cbOf(kr, kg, kb);
    const kcr = crOf(kr, kg, kb);
    const num = (v, d) => (v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : d);
    const sim = (num(e.similarity, 40) / 100) * 0.4;
    const smo = Math.max(0.001, (num(e.smoothness, 25) / 100) * 0.5);
    const spillK = num(e.spill, 50) / 100;
    const sstep = (a, b, x) => {
      const u = M.clamp((x - a) / (b - a), 0, 1);
      return u * u * (3 - 2 * u);
    };
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const d = Math.hypot(cbOf(r, g, b) - kcb, crOf(r, g, b) - kcr);
      const a = sstep(sim, sim + smo, d);
      const spill = (1 - sstep(sim, sim + smo + 0.25, d)) * spillK;
      if (spill > 0) {
        const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] += (l - data[i]) * spill;
        data[i + 1] += (l - data[i + 1]) * spill;
        data[i + 2] += (l - data[i + 2]) * spill;
      }
      data[i + 3] = Math.round(data[i + 3] * a);
    }
    return data;
  }

  // The keying effects only (a clip's picture right after its crop, before colour). Same return
  // rules as apply().
  function applyKey(input, effects, { t = 0, seed = 0 } = {}) {
    const list = (effects || []).filter(isKeyEffect);
    if (!list.length) return input;
    const w = input.width;
    const h = input.height;
    let cur = input;
    list.forEach((e, i) => {
      const out = work(4 + (i % 2), w, h);
      const ctx = out.getContext("2d");
      const g = getFx();
      if (g) {
        ctx.drawImage(g.run(cur, e, t, seed), 0, 0);
      } else {
        ctx.drawImage(cur, 0, 0);
        const img = ctx.getImageData(0, 0, w, h);
        keyPixels(img.data, e);
        ctx.putImageData(img, 0, 0);
      }
      cur = out;
    });
    return cur;
  }

  // Effects that can't be drawn here (no WebGL2 and no canvas fallback).
  const FALLBACK = new Set(["invert", "mosaic", "mirror", "strobe", "oldfilm", "posterize", "chromakey"]);
  function supported(type) {
    const def = M.effectDef(type);
    if (!def) return false;
    return def.kind !== "gl" || Boolean(getFx()) || FALLBACK.has(type);
  }

  // The picture through its effects. opts: { t (seconds into the clip), seed }. Returns a canvas
  // (the input itself when nothing applies; else a shared work canvas: copy it before the next call).
  function apply(input, effects, { t = 0, seed = 0 } = {}) {
    const list = (effects || []).filter(isPictureEffect);
    if (!list.length) return input;
    const w = input.width;
    const h = input.height;
    let cur = input;
    let slot = 0;
    const next = () => {
      slot = 1 - slot;
      return work(slot, w, h);
    };
    for (const e of list) {
      const def = M.effectDef(e.type);
      if (def.kind === "gl") {
        const g = getFx();
        if (g) {
          const out = next();
          out.getContext("2d").drawImage(g.run(cur, e, t, seed), 0, 0);
          cur = out;
        } else if (FALLBACK.has(e.type)) {
          const out = next();
          fallback2d(out.getContext("2d"), cur, e, t, w, h);
          cur = out;
        }
      } else if (def.kind === "2d") {
        const out = next();
        canvasEffect(out.getContext("2d"), cur, e, w, h);
        cur = out;
      } else if (def.kind === "particles") {
        const out = next();
        const ctx = out.getContext("2d");
        ctx.drawImage(cur, 0, 0);
        drawParticles(ctx, e, w, h, t, seed);
        cur = out;
      }
    }
    return cur;
  }

  // Do any effects change with time (the cache key then includes the time)?
  function animated(effects) {
    return (effects || []).some((e) => isPictureEffect(e) && M.effectAnimated(e));
  }

  function fallback2d(ctx, src, e, t, w, h) {
    const A = amountOf(e);
    ctx.save();
    switch (e.type) {
      case "invert":
        ctx.filter = `invert(${A})`;
        ctx.drawImage(src, 0, 0);
        break;
      case "oldfilm":
        ctx.filter = `sepia(${A}) contrast(${1 + 0.1 * A})`;
        ctx.drawImage(src, 0, 0);
        break;
      case "posterize":
        ctx.filter = `contrast(${1 + A})`;
        ctx.drawImage(src, 0, 0);
        break;
      case "strobe": {
        const period = 0.6 - (0.53 * (Number(e.speed) || 50)) / 100;
        const on = (t / period) % 1 < 0.3;
        ctx.filter = on ? `brightness(${1 + 2 * A})` : "none";
        ctx.drawImage(src, 0, 0);
        break;
      }
      case "mosaic": {
        const b = 2 + A * 60;
        const sw = Math.max(1, Math.round(w / b));
        const sh = Math.max(1, Math.round(h / b));
        const small = work(2, sw, sh);
        small.getContext("2d").drawImage(src, 0, 0, sw, sh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, w, h);
        break;
      }
      case "mirror": {
        const mode = e.mode || "left";
        ctx.drawImage(src, 0, 0);
        const half = (sx, sy, sw, sh, flipX, flipY) => {
          ctx.save();
          ctx.translate(flipX ? w : 0, flipY ? h : 0);
          ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
          ctx.drawImage(src, sx, sy, sw, sh, sx, sy, sw, sh);
          ctx.restore();
        };
        if (mode === "left" || mode === "quad") half(0, 0, w / 2, h, true, false);
        if (mode === "right") half(w / 2, 0, w / 2, h, true, false);
        if (mode === "top" || mode === "quad") {
          const copy = work(2, w, h);
          copy.getContext("2d").drawImage(ctx.canvas, 0, 0);
          ctx.save();
          ctx.translate(0, h);
          ctx.scale(1, -1);
          ctx.drawImage(copy, 0, 0, w, h / 2, 0, 0, w, h / 2);
          ctx.restore();
        }
        if (mode === "bottom") half(0, h / 2, w, h / 2, false, true);
        break;
      }
    }
    ctx.restore();
  }

  function canvasEffect(ctx, src, e, w, h) {
    const A = amountOf(e);
    const S = Math.min(w, h);
    ctx.save();
    switch (e.type) {
      case "blur":
        ctx.filter = `blur(${(A * S * 0.03).toFixed(2)}px)`;
        ctx.drawImage(src, 0, 0);
        break;
      case "glow": {
        ctx.drawImage(src, 0, 0);
        ctx.filter = `blur(${(S * 0.02).toFixed(2)}px) brightness(1.3)`;
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = A * 0.9;
        ctx.drawImage(src, 0, 0);
        break;
      }
      case "tiltshift": {
        ctx.drawImage(src, 0, 0);
        const blurred = work(2, w, h);
        const b = blurred.getContext("2d");
        b.save();
        b.filter = `blur(${(A * S * 0.025).toFixed(2)}px)`;
        b.drawImage(src, 0, 0);
        b.restore();
        // Keep the blur outside the focus band: a mask with a clear band.
        const pos = (Number(e.pos) || 50) / 100;
        const half = (Number(e.width) || 25) / 200;
        const g = b.createLinearGradient(0, 0, 0, h);
        const stop = (at, a) => g.addColorStop(M.clamp(at, 0, 1), `rgba(0,0,0,${a})`);
        stop(0, 1);
        stop(pos - half - 0.12, 1);
        stop(pos - half, 0);
        stop(pos + half, 0);
        stop(pos + half + 0.12, 1);
        stop(1, 1);
        b.globalCompositeOperation = "destination-in";
        b.fillStyle = g;
        b.fillRect(0, 0, w, h);
        b.globalCompositeOperation = "source-over";
        ctx.drawImage(blurred, 0, 0);
        break;
      }
      case "letterbox": {
        ctx.drawImage(src, 0, 0);
        const ratio = Number(e.ratio) || 2.39;
        const contentH = w / ratio;
        if (contentH < h) {
          const bar = ((h - contentH) / 2) * A;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, w, bar);
          ctx.fillRect(0, h - bar, w, bar);
        }
        break;
      }
      default:
        ctx.drawImage(src, 0, 0);
    }
    ctx.restore();
  }

  // ---- particles ------------------------------------------------------------------------------------
  // A repeatable random number for particle i, slot k.
  function rnd(i, k, seed = 0) {
    const x = Math.sin(i * 127.1 + k * 311.7 + seed * 74.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const CONFETTI_COLORS = ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f15bb5", "#fee440"];
  const BOKEH_COLORS = ["255,200,120", "255,150,180", "180,210,255", "255,240,200"];

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.closePath();
  }

  function starPath(ctx, x, y, r, points = 4, inner = 0.25) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI) / points - Math.PI / 2;
      const rr = i % 2 ? r * inner : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawParticles(ctx, e, W, H, t, seed = 0) {
    const A = amountOf(e);
    const sp = (Number(e.speed) || 50) / 50;
    const sz = (Number(e.size) || 50) / 50;
    const S = Math.min(W, H);
    const many = e.type === "rain" ? 320 : e.type === "bokeh" ? 40 : e.type === "sparkles" ? 80 : 160;
    const n = Math.round(4 + many * A);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const r1 = rnd(i, 1, seed);
      const r2 = rnd(i, 2, seed);
      const r3 = rnd(i, 3, seed);
      const r4 = rnd(i, 4, seed);
      switch (e.type) {
        case "snow": {
          const y = (((r2 + t * (0.04 + 0.08 * r4) * sp) % 1) * 1.1 - 0.05) * H;
          const x = (r1 + Math.sin(t * 0.8 * sp + r3 * 6.283) * 0.03) * W;
          const rad = Math.max(0.6, (0.6 + 2.4 * r4) * sz * (S / 500));
          ctx.globalAlpha = 0.55 + 0.45 * r3;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "rain": {
          const len = (0.03 + 0.04 * r4) * H * sz;
          const y = (((r2 + t * (0.9 + 0.6 * r4) * sp) % 1) * 1.2 - 0.1) * H;
          const x = r1 * W * 1.1 - W * 0.05 + y * 0.12;
          ctx.globalAlpha = 0.25 + 0.35 * r3;
          ctx.strokeStyle = "#cfe3ff";
          ctx.lineWidth = Math.max(0.6, (S / 900) * sz);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - len * 0.12, y - len);
          ctx.stroke();
          break;
        }
        case "confetti": {
          const y = (((r2 + t * (0.1 + 0.12 * r4) * sp) % 1) * 1.15 - 0.08) * H;
          const x = (r1 + Math.sin(t * 2 * sp + r3 * 6.283) * 0.02) * W;
          const s = (3 + 6 * r4) * sz * (S / 600);
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(t * (2 + 4 * r3) * sp + r1 * 6);
          ctx.scale(1, Math.abs(Math.cos(t * 3 * sp + r2 * 6)) + 0.15);
          ctx.fillRect(-s, -s / 2, s * 2, s);
          ctx.restore();
          break;
        }
        case "hearts": {
          const k = (r2 + t * (0.06 + 0.06 * r4) * sp) % 1;
          const y = H * (1.08 - k * 1.2);
          const x = (r1 + Math.sin(t * 1.5 * sp + r3 * 6.283) * 0.03) * W;
          const s = (8 + 14 * r4) * sz * (S / 600);
          ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 1.6)) * 0.85;
          ctx.fillStyle = r3 < 0.5 ? "#ff3b6b" : "#ff8fb1";
          heartPath(ctx, x, y - s / 2, s);
          ctx.fill();
          break;
        }
        case "sparkles": {
          const tw = Math.max(0, Math.sin(t * (2 + 3 * r4) * sp + r3 * 6.283));
          if (tw <= 0.02) break;
          const x = r1 * W;
          const y = r2 * H;
          const s = (4 + 10 * r4) * sz * (S / 600) * tw;
          ctx.globalAlpha = tw;
          ctx.fillStyle = r3 < 0.6 ? "#ffffff" : "#fff3b0";
          ctx.shadowColor = "rgba(255,255,255,0.9)";
          ctx.shadowBlur = s * 1.5;
          starPath(ctx, x, y, s);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case "bokeh": {
          const x = (r1 + Math.sin(t * 0.25 * sp + r3 * 6.283) * 0.05) * W;
          const y = (r2 + Math.cos(t * 0.2 * sp + r4 * 6.283) * 0.05) * H;
          const rad = (0.03 + 0.07 * r4) * S * sz;
          const col = BOKEH_COLORS[i % BOKEH_COLORS.length];
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, `rgba(${col},0.35)`);
          g.addColorStop(0.8, `rgba(${col},0.22)`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * sp + r3 * 6.283) ** 2;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          break;
        }
      }
    }
    ctx.restore();
  }

  // ---- motion ------------------------------------------------------------------------------------------
  // How motion effects move a clip at t seconds into it: { dx, dy (fractions of the canvas), scale, rot (degrees) }.
  function motion(effects, t, dur = 5) {
    const m = { dx: 0, dy: 0, scale: 1, rot: 0 };
    for (const e of effects || []) {
      const def = M.effectDef(e.type);
      if (!def || def.kind !== "motion" || e.on === false) continue;
      const A = amountOf(e);
      switch (e.type) {
        case "shake": {
          const sp = (Number(e.speed) || 50) / 50;
          m.dx += (Math.sin(t * 13 * sp + 1.3) + Math.sin(t * 29 * sp + 4.1) * 0.5) * 0.02 * A;
          m.dy += (Math.sin(t * 17 * sp + 2.7) + Math.sin(t * 31 * sp + 0.4) * 0.5) * 0.02 * A;
          m.rot += Math.sin(t * 19 * sp) * 1.5 * A;
          break;
        }
        case "pulse": {
          const beat = (t * (Number(e.bpm) || 100)) / 60;
          m.scale *= 1 + 0.12 * A * Math.exp(-(beat - Math.floor(beat)) * 6);
          break;
        }
        case "kenburns": {
          const u0 = M.clamp(t / Math.max(0.1, dur), 0, 1);
          const u = u0 * u0 * (3 - 2 * u0);
          const k = 0.25 * A;
          const dir = e.dir || "in";
          if (dir === "in") m.scale *= 1 + k * u;
          else if (dir === "out") m.scale *= 1 + k * (1 - u);
          else {
            m.scale *= 1 + k;
            const pan = (k / 2) * (0.5 - u) * 2;
            if (dir === "left") m.dx += pan;
            if (dir === "right") m.dx -= pan;
            if (dir === "up") m.dy += pan;
            if (dir === "down") m.dy -= pan;
          }
          break;
        }
        case "spin":
          m.rot += t * A * 360 * (e.dir === "ccw" ? -1 : 1) * 0.5;
          break;
        case "sway": {
          const w = Math.sin(t * Math.PI * ((Number(e.speed) || 30) / 50));
          m.rot += w * 12 * A;
          m.dx += w * 0.01 * A;
          break;
        }
        case "popin": {
          const u = M.clamp(t / 0.6, 0, 1);
          const c1 = 1.70158;
          const back = 1 + (c1 + 1) * (u - 1) ** 3 + c1 * (u - 1) ** 2;
          m.scale *= 1 + (back - 1) * A;
          break;
        }
      }
    }
    m.scale = Math.max(0, m.scale);
    return m;
  }

  function hasMotion(effects) {
    return (effects || []).some((e) => e.on !== false && M.effectDef(e.type) && M.effectDef(e.type).kind === "motion");
  }

  // ---- transitions --------------------------------------------------------------------------------------
  const smooth = (p) => p * p * (3 - 2 * p);

  // Draws img (a full-canvas layer, or null) with alpha / an extra transform about the centre.
  function put(ctx, img, W, H, { alpha = 1, scale = 1, rot = 0, dx = 0, dy = 0, filter = "none" } = {}) {
    if (!img || alpha <= 0 || scale <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (filter !== "none") ctx.filter = filter;
    ctx.translate(W / 2 + dx, H / 2 + dy);
    if (rot) ctx.rotate(rot);
    if (scale !== 1) ctx.scale(scale, scale);
    ctx.drawImage(img, -W / 2, -H / 2, W, H);
    ctx.restore();
  }

  // A true mix of two layers: a × (1 - k) + b × k (also where only one of them has pixels).
  function mixInto(ctx, a, b, k, W, H, opts = {}) {
    const tmp = work(3, W, H);
    const t = tmp.getContext("2d");
    put(t, a, W, H, { ...(opts.a || {}), alpha: (opts.a && opts.a.alpha != null ? opts.a.alpha : 1) * (1 - k) });
    t.save();
    t.globalCompositeOperation = "lighter";
    put(t, b, W, H, { ...(opts.b || {}), alpha: (opts.b && opts.b.alpha != null ? opts.b.alpha : 1) * k });
    t.restore();
    return tmp;
  }

  function clipped(ctx, img, W, H, path) {
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    path(ctx);
    ctx.clip();
    ctx.drawImage(img, 0, 0, W, H);
    ctx.restore();
  }

  // Mixes the outgoing layer a and the incoming layer b (full-canvas canvases or null) into ctx at
  // progress p (0 = all a, 1 = all b).
  function transition(type, ctx, a, b, p, W, H) {
    const e = smooth(p);
    const S = Math.min(W, H);
    const R = Math.hypot(W, H) / 2;
    const draw = (img) => img && ctx.drawImage(img, 0, 0, W, H);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    switch (type) {
      case "dipblack":
      case "dipwhite": {
        const img = p < 0.5 ? a : b;
        const k = p < 0.5 ? p * 2 : (1 - p) * 2;
        const tmp = work(3, W, H);
        const t = tmp.getContext("2d");
        if (img) t.drawImage(img, 0, 0, W, H);
        t.globalCompositeOperation = "source-atop";
        t.fillStyle = type === "dipblack" ? `rgba(0,0,0,${k})` : `rgba(255,255,255,${k})`;
        t.fillRect(0, 0, W, H);
        t.globalCompositeOperation = "source-over";
        draw(tmp);
        break;
      }
      case "flash": {
        const tmp = mixInto(ctx, a, b, e, W, H);
        const t = tmp.getContext("2d");
        t.globalCompositeOperation = "source-atop";
        t.fillStyle = `rgba(255,255,255,${1 - Math.abs(2 * p - 1)})`;
        t.fillRect(0, 0, W, H);
        t.globalCompositeOperation = "source-over";
        draw(tmp);
        break;
      }
      case "blurdissolve": {
        const f = `blur(${(Math.sin(Math.PI * p) * S * 0.03).toFixed(2)}px)`;
        draw(mixInto(ctx, a, b, e, W, H, { a: { filter: f }, b: { filter: f } }));
        break;
      }
      case "wipeleft":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.rect(W * (1 - e), 0, W * e, H));
        break;
      case "wiperight":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.rect(0, 0, W * e, H));
        break;
      case "wipeup":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.rect(0, H * (1 - e), W, H * e));
        break;
      case "wipedown":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.rect(0, 0, W, H * e));
        break;
      case "clock":
        draw(a);
        if (p > 0)
          clipped(ctx, b, W, H, (c) => {
            c.moveTo(W / 2, H / 2);
            c.arc(W / 2, H / 2, R * 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
            c.closePath();
          });
        break;
      case "irisopen":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.arc(W / 2, H / 2, R * e, 0, Math.PI * 2));
        break;
      case "irisclose":
        draw(b);
        clipped(ctx, a, W, H, (c) => c.arc(W / 2, H / 2, R * (1 - e), 0, Math.PI * 2));
        break;
      case "diamond": {
        const s = e * (W + H) * 0.55;
        draw(a);
        clipped(ctx, b, W, H, (c) => {
          c.moveTo(W / 2, H / 2 - s);
          c.lineTo(W / 2 + s, H / 2);
          c.lineTo(W / 2, H / 2 + s);
          c.lineTo(W / 2 - s, H / 2);
          c.closePath();
        });
        break;
      }
      case "barndoor":
        draw(a);
        clipped(ctx, b, W, H, (c) => c.rect((W / 2) * (1 - e), 0, W * e, H));
        break;
      case "slideleft":
      case "slideright":
      case "slideup":
      case "slidedown": {
        const dir = type.slice(5);
        draw(a);
        const off = 1 - e;
        put(ctx, b, W, H, { dx: dir === "left" ? W * off : dir === "right" ? -W * off : 0, dy: dir === "up" ? H * off : dir === "down" ? -H * off : 0 });
        break;
      }
      case "pushleft":
      case "pushright":
      case "pushup":
      case "pushdown":
      case "whip": {
        const dir = type === "whip" ? "left" : type.slice(4);
        const k = type === "whip" ? (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2) : e;
        const sx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
        const sy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
        const filter = type === "whip" ? `blur(${(Math.sin(Math.PI * p) * S * 0.04).toFixed(2)}px)` : "none";
        put(ctx, a, W, H, { dx: sx * W * k, dy: sy * H * k, filter });
        put(ctx, b, W, H, { dx: -sx * W * (1 - k), dy: -sy * H * (1 - k), filter });
        break;
      }
      case "zoomin":
        draw(mixInto(ctx, a, b, e, W, H, { a: { scale: 1 + e } , b: { scale: 1.3 - 0.3 * e } }));
        break;
      case "zoomout":
        draw(mixInto(ctx, a, b, e, W, H, { a: { scale: 1 - 0.5 * e }, b: { scale: 1.5 - 0.5 * e } }));
        break;
      case "spin":
        if (p < 0.5) put(ctx, a, W, H, { rot: Math.PI * p * 2, scale: 1 - smooth(p * 2) });
        else put(ctx, b, W, H, { rot: -Math.PI * (1 - p) * 2, scale: smooth((p - 0.5) * 2) });
        break;
      case "pixelate": {
        const block = Math.max(1, 1 + Math.sin(Math.PI * p) * (S / 14));
        const sw = Math.max(1, Math.round(W / block));
        const sh = Math.max(1, Math.round(H / block));
        const k = M.clamp((p - 0.35) / 0.3, 0, 1);
        const mixed = mixInto(ctx, a, b, k, W, H);
        const small = work(2, sw, sh);
        small.getContext("2d").drawImage(mixed, 0, 0, sw, sh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, W, H);
        break;
      }
      case "glitch": {
        const img = p < 0.5 ? a : b;
        const k = Math.sin(Math.PI * p);
        const f = Math.floor(p * 30);
        const slices = 14;
        if (!img) break;
        for (let i = 0; i < slices; i++) {
          const y0 = (i / slices) * H;
          const hh = H / slices + 1;
          const off = (rnd(i, f, 3) - 0.5) * W * 0.16 * k * (rnd(i, f + 9, 5) > 0.45 ? 1 : 0.1);
          ctx.drawImage(img, 0, y0, W, hh, off, y0, W, hh);
        }
        if (k > 0.3) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.25 * k;
          ctx.drawImage(img, S * 0.012 * k, 0, W, H);
        }
        break;
      }
      default:
        // dissolve
        draw(mixInto(ctx, a, b, p, W, H));
    }
    ctx.restore();
  }

  return { apply, applyKey, keyPixels, animated, motion, hasMotion, transition, supported, drawParticles, glParams, FRAGMENT, GL_IDS };
})();
