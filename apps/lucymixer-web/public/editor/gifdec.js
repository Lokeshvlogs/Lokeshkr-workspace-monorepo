// A small GIF decoder for animated stickers: GIF87a / GIF89a, global and local palettes,
// transparency, interlacing, frame delays and disposal (keep, background, previous).
// parse() gives the full-size RGBA picture of every frame in turn; decode() turns them into
// canvases no bigger than maxSize, ready for the renderer.
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.GifDec = (() => {
  const MAX_FRAMES = 400;

  function u16(b, i) {
    return b[i] | (b[i + 1] << 8);
  }

  function palette(b, pos, size) {
    return { colors: b.subarray(pos, pos + size * 3), end: pos + size * 3 };
  }

  // The data sub-blocks from pos, joined; returns { data, end }.
  function subBlocks(b, pos) {
    const parts = [];
    let total = 0;
    while (pos < b.length) {
      const n = b[pos++];
      if (!n) break;
      parts.push(b.subarray(pos, pos + n));
      total += n;
      pos += n;
    }
    const data = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
      data.set(p, o);
      o += p.length;
    }
    return { data, end: pos };
  }

  function skipBlocks(b, pos) {
    while (pos < b.length) {
      const n = b[pos++];
      if (!n) break;
      pos += n;
    }
    return pos;
  }

  // LZW: the colour indices of one frame (count pixels; a short stream leaves the rest 0).
  function lzw(minSize, data, count) {
    const out = new Uint8Array(count);
    const clear = 1 << minSize;
    const eoi = clear + 1;
    const prefix = new Int16Array(4096);
    const suffix = new Uint8Array(4096);
    const stack = new Uint8Array(4097);
    for (let i = 0; i < clear; i++) suffix[i] = i;
    let size = minSize + 1;
    let mask = (1 << size) - 1;
    let next = eoi + 1;
    let old = -1;
    let first = 0;
    let datum = 0;
    let bits = 0;
    let pos = 0;
    let op = 0;
    while (op < count) {
      while (bits < size && pos < data.length) {
        datum |= data[pos++] << bits;
        bits += 8;
      }
      if (bits < size) break;
      let code = datum & mask;
      datum >>>= size;
      bits -= size;
      if (code === clear) {
        size = minSize + 1;
        mask = (1 << size) - 1;
        next = eoi + 1;
        old = -1;
        continue;
      }
      if (code === eoi) break;
      if (old === -1) {
        if (code >= clear) break; // corrupt
        out[op++] = suffix[code];
        old = code;
        first = code;
        continue;
      }
      const inCode = code;
      let sp = 0;
      if (code >= next) {
        if (code > next) break; // corrupt
        stack[sp++] = first;
        code = old;
      }
      while (code > eoi) {
        stack[sp++] = suffix[code];
        code = prefix[code];
      }
      first = suffix[code];
      stack[sp++] = first;
      if (next < 4096) {
        prefix[next] = old;
        suffix[next] = first;
        next++;
        if (next > mask && size < 12) {
          size++;
          mask = (1 << size) - 1;
        }
      }
      old = inCode;
      while (sp > 0 && op < count) out[op++] = stack[--sp];
    }
    return out;
  }

  // Rows of an interlaced frame in the order they're stored.
  function interlacedRows(h) {
    const rows = [];
    for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let y = start; y < h; y += step) rows.push(y);
    return rows;
  }

  // Calls onFrame(rgba, delaySeconds, index) for each frame (rgba is reused: copy it).
  // Returns { w, h, count, loops }.
  function parse(bytes, onFrame, { maxFrames = MAX_FRAMES } = {}) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const sig = String.fromCharCode(...b.subarray(0, 6));
    if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error("Not a GIF");
    const w = u16(b, 6);
    const h = u16(b, 8);
    if (!w || !h || w * h > 4096 * 4096) throw new Error("Bad GIF size");
    const packed = b[10];
    let pos = 13;
    let global = null;
    if (packed & 0x80) {
      const pal = palette(b, pos, 1 << ((packed & 7) + 1));
      global = pal.colors;
      pos = pal.end;
    }
    const canvas = new Uint8ClampedArray(w * h * 4);
    let saved = null;
    let gce = { disposal: 0, delay: 0, transparent: -1 };
    let prev = null; // the previous frame's rect and disposal
    let count = 0;
    let loops = 0;
    while (pos < b.length && count < maxFrames) {
      const block = b[pos++];
      if (block === 0x3b) break;
      if (block === 0x21) {
        const label = b[pos++];
        if (label === 0xf9 && b[pos] >= 4) {
          const p = b[pos + 1];
          gce = { disposal: (p >> 2) & 7, delay: u16(b, pos + 2), transparent: p & 1 ? b[pos + 4] : -1 };
          pos = skipBlocks(b, pos);
        } else if (label === 0xff && b[pos] === 11 && String.fromCharCode(...b.subarray(pos + 1, pos + 12)) === "NETSCAPE2.0") {
          loops = u16(b, pos + 14);
          pos = skipBlocks(b, pos);
        } else {
          pos = skipBlocks(b, pos);
        }
        continue;
      }
      if (block !== 0x2c) break; // unknown: stop with what we have
      const fx = u16(b, pos);
      const fy = u16(b, pos + 2);
      const fw = u16(b, pos + 4);
      const fh = u16(b, pos + 6);
      const fp = b[pos + 8];
      pos += 9;
      let colors = global;
      if (fp & 0x80) {
        const pal = palette(b, pos, 1 << ((fp & 7) + 1));
        colors = pal.colors;
        pos = pal.end;
      }
      const minSize = b[pos++];
      const { data, end } = subBlocks(b, pos);
      pos = end;
      // The previous frame's disposal.
      if (prev) {
        if (prev.disposal === 2) clearRect(canvas, w, h, prev);
        else if (prev.disposal === 3 && saved) canvas.set(saved);
      }
      if (gce.disposal === 3) saved = canvas.slice();
      if (colors && minSize >= 1 && minSize <= 11) {
        const idx = lzw(minSize, data, fw * fh);
        const rows = fp & 0x40 ? interlacedRows(fh) : null;
        const tr = gce.transparent;
        for (let r = 0; r < fh; r++) {
          const y = fy + (rows ? rows[r] : r);
          if (y >= h) continue;
          for (let x = 0; x < fw; x++) {
            const cx = fx + x;
            if (cx >= w) continue;
            const ci = idx[r * fw + x];
            if (ci === tr) continue;
            const o = (y * w + cx) * 4;
            canvas[o] = colors[ci * 3];
            canvas[o + 1] = colors[ci * 3 + 1];
            canvas[o + 2] = colors[ci * 3 + 2];
            canvas[o + 3] = 255;
          }
        }
      }
      // Browsers play 0 / 1 centisecond delays at 100 ms.
      const delay = gce.delay < 2 ? 0.1 : gce.delay / 100;
      onFrame(canvas, delay, count);
      count++;
      prev = { x: fx, y: fy, w: fw, h: fh, disposal: gce.disposal };
      gce = { disposal: 0, delay: 0, transparent: -1 };
    }
    if (!count) throw new Error("No frames in the GIF");
    return { w, h, count, loops };
  }

  function clearRect(canvas, w, h, r) {
    for (let y = r.y; y < Math.min(h, r.y + r.h); y++) canvas.fill(0, (y * w + r.x) * 4, (y * w + Math.min(w, r.x + r.w)) * 4);
  }

  // The logical size without decoding.
  function sizeOf(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return { w: u16(b, 6), h: u16(b, 8) };
  }

  // { w, h, frames: [{ canvas, start, delay }], duration, loops } with canvases at most maxSize on a side.
  function decode(bytes, { maxSize = 256, maxFrames = MAX_FRAMES, makeCanvas = () => document.createElement("canvas") } = {}) {
    const { w, h } = sizeOf(bytes);
    const k = Math.min(1, maxSize / Math.max(1, w, h));
    const full = makeCanvas();
    full.width = w;
    full.height = h;
    const fullCtx = full.getContext("2d");
    const image = fullCtx.createImageData(w, h);
    const frames = [];
    let t = 0;
    const info = parse(
      bytes,
      (rgba, delay) => {
        image.data.set(rgba);
        fullCtx.putImageData(image, 0, 0);
        const c = makeCanvas();
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(h * k));
        const ctx = c.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(full, 0, 0, c.width, c.height);
        frames.push({ canvas: c, start: t, delay });
        t += delay;
      },
      { maxFrames }
    );
    return { w: info.w, h: info.h, frames, duration: t, loops: info.loops };
  }

  // The frame index at local time t (looping when loop is true; else holding the last frame).
  function frameAt(gif, t, loop = true) {
    const n = gif.frames.length;
    if (n < 2 || !(gif.duration > 0)) return 0;
    let tt = t;
    if (loop) tt = ((t % gif.duration) + gif.duration) % gif.duration;
    else if (t >= gif.duration) return n - 1;
    if (tt <= 0) return 0;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (gif.frames[mid].start <= tt) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  return { parse, decode, frameAt, sizeOf, lzw };
})();

if (typeof module !== "undefined") module.exports = IgfvEditor.GifDec;
