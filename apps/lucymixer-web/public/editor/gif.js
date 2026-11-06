// The editor's GIF export: a small GIF89a encoder. One 256-colour palette for the whole animation
// (median cut over samples of every frame, so colours don't flicker between frames), optional 4×4
// ordered dithering, and LZW. Frames are ImageData-like ({ width, height, data: RGBA bytes }).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Gif = (() => {
  const MAX_SAMPLES = 60000;

  // ---- palette: median cut ------------------------------------------------------------------
  function samplePixels(frames) {
    const total = frames.reduce((n, f) => n + f.width * f.height, 0);
    const step = Math.max(1, Math.floor(total / MAX_SAMPLES));
    const out = [];
    let k = 0;
    for (const f of frames) {
      const d = f.data;
      for (let i = 0; i < f.width * f.height; i++, k++) {
        if (k % step) continue;
        out.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
      }
    }
    return out;
  }

  function medianCut(pixels, size = 256) {
    if (!pixels.length) return [[0, 0, 0]];
    let boxes = [pixels];
    while (boxes.length < size) {
      // Split the box with the widest channel range (ties: the most pixels).
      let best = -1;
      let bestRange = -1;
      let bestChannel = 0;
      boxes.forEach((box, i) => {
        if (box.length < 2) return;
        for (let c = 0; c < 3; c++) {
          let lo = 255;
          let hi = 0;
          for (const p of box) {
            if (p[c] < lo) lo = p[c];
            if (p[c] > hi) hi = p[c];
          }
          const range = hi - lo;
          if (range > bestRange || (range === bestRange && best >= 0 && box.length > boxes[best].length)) {
            best = i;
            bestRange = range;
            bestChannel = c;
          }
        }
      });
      if (best < 0 || bestRange <= 0) break;
      const box = boxes[best].slice().sort((a, b) => a[bestChannel] - b[bestChannel]);
      const mid = box.length >> 1;
      boxes.splice(best, 1, box.slice(0, mid), box.slice(mid));
    }
    return boxes.map((box) => {
      const sum = [0, 0, 0];
      for (const p of box) {
        sum[0] += p[0];
        sum[1] += p[1];
        sum[2] += p[2];
      }
      return sum.map((v) => Math.round(v / box.length));
    });
  }

  // The nearest palette entry, cached by 15-bit colour.
  function makeMapper(palette) {
    const cache = new Int16Array(32768).fill(-1);
    return (r, g, b) => {
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const hit = cache[key];
      if (hit >= 0) return hit;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        const dr = p[0] - r;
        const dg = p[1] - g;
        const db = p[2] - b;
        const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      cache[key] = best;
      return best;
    };
  }

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.5) * 24);

  function indexFrame(frame, map, dither) {
    const { width, height, data } = frame;
    const out = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        let r = data[i * 4];
        let g = data[i * 4 + 1];
        let b = data[i * 4 + 2];
        if (dither) {
          const t = BAYER[(y & 3) * 4 + (x & 3)];
          r = Math.max(0, Math.min(255, r + t));
          g = Math.max(0, Math.min(255, g + t));
          b = Math.max(0, Math.min(255, b + t));
        }
        out[i] = map(r, g, b);
      }
    }
    return out;
  }

  // ---- LZW ----------------------------------------------------------------------------------
  function lzw(indices, minCodeSize) {
    const out = [];
    let cur = 0;
    let bits = 0;
    const clear = 1 << minCodeSize;
    const end = clear + 1;
    let codeSize = minCodeSize + 1;
    let next = end + 1;
    let dict = new Map();
    const emit = (code) => {
      cur |= code << bits;
      bits += codeSize;
      while (bits >= 8) {
        out.push(cur & 255);
        cur >>>= 8;
        bits -= 8;
      }
    };
    emit(clear);
    let prefix = indices.length ? indices[0] : 0;
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = prefix * 256 + k;
      const found = dict.get(key);
      if (found !== undefined) {
        prefix = found;
        continue;
      }
      emit(prefix);
      if (next < 4096) {
        dict.set(key, next++);
        if (next > 1 << codeSize && codeSize < 12) codeSize++;
      } else {
        emit(clear);
        dict = new Map();
        codeSize = minCodeSize + 1;
        next = end + 1;
      }
      prefix = k;
    }
    emit(prefix);
    emit(end);
    if (bits > 0) out.push(cur & 255);
    return out;
  }

  // ---- file ---------------------------------------------------------------------------------
  class Bytes {
    constructor() {
      this.chunks = [];
      this.buf = new Uint8Array(65536);
      this.n = 0;
    }
    byte(b) {
      if (this.n === this.buf.length) {
        this.chunks.push(this.buf);
        this.buf = new Uint8Array(65536);
        this.n = 0;
      }
      this.buf[this.n++] = b;
    }
    word(w) {
      this.byte(w & 255);
      this.byte((w >> 8) & 255);
    }
    str(s) {
      for (const ch of s) this.byte(ch.charCodeAt(0));
    }
    bytes(list) {
      for (const b of list) this.byte(b);
    }
    result() {
      const all = [...this.chunks, this.buf.subarray(0, this.n)];
      const size = all.reduce((n, c) => n + c.length, 0);
      const out = new Uint8Array(size);
      let at = 0;
      for (const c of all) {
        out.set(c, at);
        at += c.length;
      }
      return out;
    }
  }

  // frames: [{ width, height, data }]; options: { delay (ms per frame), loop (0 = forever),
  // dither }; onProgress(0..1). Resolves to a Uint8Array; yields between frames.
  async function encode(frames, { delay = 100, loop = 0, dither = true } = {}, onProgress = () => {}, isCancelled = () => false) {
    if (!frames.length) throw new Error("no frames");
    const { width, height } = frames[0];
    const palette = medianCut(samplePixels(frames), 256);
    while (palette.length < 256) palette.push([0, 0, 0]);
    const map = makeMapper(palette);
    const out = new Bytes();
    out.str("GIF89a");
    out.word(width);
    out.word(height);
    out.byte(0xf7); // global colour table, 8 bits, 256 entries
    out.byte(0);
    out.byte(0);
    for (const p of palette) out.bytes(p);
    // Loop forever (NETSCAPE2.0).
    out.bytes([0x21, 0xff, 0x0b]);
    out.str("NETSCAPE2.0");
    out.bytes([0x03, 0x01]);
    out.word(loop);
    out.byte(0);
    const centis = Math.max(2, Math.round(delay / 10));
    for (let f = 0; f < frames.length; f++) {
      if (isCancelled()) return null;
      const frame = frames[f];
      out.bytes([0x21, 0xf9, 0x04, 0x00]);
      out.word(centis);
      out.bytes([0x00, 0x00]);
      out.byte(0x2c);
      out.word(0);
      out.word(0);
      out.word(frame.width);
      out.word(frame.height);
      out.byte(0);
      const data = lzw(indexFrame(frame, map, dither), 8);
      out.byte(8);
      for (let i = 0; i < data.length; i += 255) {
        const block = data.slice(i, i + 255);
        out.byte(block.length);
        out.bytes(block);
      }
      out.byte(0);
      onProgress((f + 1) / frames.length);
      await new Promise((r) => setTimeout(r, 0));
    }
    out.byte(0x3b);
    return out.result();
  }

  return { encode, medianCut, lzw, indexFrame, makeMapper };
})();
