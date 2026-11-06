// The editor's playback: a timeline clock drives every video / audio clip's own media element (the same
// media in two clips = two elements), kept in step with the clock; their sound goes through a clip
// gain (volume, fades, mute) and a master gain to the speakers, and while exporting to the recording.
// Also: reading imported files (probe), timeline thumbnails, and the video / GIF exports.
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Engine = (() => {
  const M = IgfvEditor.Model;
  const DRIFT = 0.15; // seconds a playing element may be off the clock before it's re-seeked

  function once(target, type, timeout = 0) {
    return new Promise((resolve, reject) => {
      let timer = 0;
      const ok = () => {
        clearTimeout(timer);
        target.removeEventListener("error", bad);
        resolve();
      };
      const bad = () => {
        clearTimeout(timer);
        target.removeEventListener(type, ok);
        reject(new Error("media error"));
      };
      target.addEventListener(type, ok, { once: true });
      target.addEventListener("error", bad, { once: true });
      if (timeout) timer = setTimeout(ok, timeout);
    });
  }

  async function seekTo(el, time, timeout = 2000) {
    if (Math.abs(el.currentTime - time) < 1e-3 && el.readyState >= 2) return;
    const done = once(el, "seeked", timeout);
    el.currentTime = time;
    await done;
  }

  function makeMedia(url, kind) {
    const el = document.createElement(kind === "audio" ? "audio" : "video");
    el.preload = "auto";
    el.playsInline = true;
    el.src = url;
    return el;
  }

  // What an imported file (or fetched post item) is: { kind, w, h, duration, bitmap? }.
  async function probe(blob, url, nameHint = "") {
    const type = blob.type || "";
    let kind = type.startsWith("image/") ? "image" : type.startsWith("audio/") ? "audio" : type.startsWith("video/") ? "video" : "";
    if (!kind) kind = /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(nameHint) ? "image" : /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i.test(nameHint) ? "audio" : "video";
    // An animated GIF: its frames (decoded once); a single-frame GIF is a photo.
    if (kind === "image" && (type === "image/gif" || (!type && /\.gif$/i.test(nameHint))) && IgfvEditor.GifDec) {
      const gif = await decodeGif(blob);
      if (gif) return { kind: "gif", w: gif.w, h: gif.h, duration: gif.duration, gif, bitmap: gif.frames[0].canvas };
    }
    if (kind === "image") {
      const bitmap = await createImageBitmap(blob);
      return { kind, w: bitmap.width, h: bitmap.height, duration: 0, bitmap };
    }
    const el = makeMedia(url, kind);
    try {
      if (el.readyState < 1) await once(el, "loadedmetadata", 20000);
      const w = el.videoWidth || 0;
      const h = el.videoHeight || 0;
      const duration = Number.isFinite(el.duration) ? el.duration : 0;
      if (!duration) throw new Error("This file can't be played");
      // Has sound? Firefox's mozHasAudio (after loadeddata); elsewhere unknown (null).
      let hasAudio = null;
      if (kind === "video" && w && "mozHasAudio" in el) {
        if (el.readyState < 2) await once(el, "loadeddata", 3000).catch(() => {});
        if (el.readyState >= 2 && typeof el.mozHasAudio === "boolean") hasAudio = el.mozHasAudio;
      }
      return { kind: kind === "video" && !w ? "audio" : kind, w, h, duration, hasAudio };
    } finally {
      el.removeAttribute("src");
      el.load();
    }
  }

  // A GIF's frames, or null when it isn't animated (or can't be read).
  async function decodeGif(blob) {
    try {
      const gif = IgfvEditor.GifDec.decode(new Uint8Array(await blob.arrayBuffer()), { maxSize: 384 });
      return gif.frames.length > 1 ? gif : null;
    } catch (err) {
      console.debug("[igfv] editor: GIF not decoded", err);
      return null;
    }
  }

  // n frames across a video (small canvases), from a separate element.
  async function thumbnails(url, duration, n, height = 40) {
    const el = makeMedia(url, "video");
    el.muted = true;
    const out = [];
    try {
      if (el.readyState < 1) await once(el, "loadedmetadata", 20000);
      const w = Math.max(1, Math.round((height * (el.videoWidth || 16)) / Math.max(1, el.videoHeight || 9)));
      for (let i = 0; i < n; i++) {
        const t = Math.min(Math.max(0, duration - 0.05), ((i + 0.5) / n) * duration);
        await seekTo(el, t);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = height;
        c.getContext("2d").drawImage(el, 0, 0, w, height);
        out.push({ time: t, canvas: c });
      }
    } catch (err) {
      console.debug("[igfv] editor: thumbnails failed", err);
    } finally {
      el.removeAttribute("src");
      el.load();
    }
    return out;
  }

  class Engine {
    // project(): the current project; mediaUrl(id): a blob URL; onFrame(t): after the time changes.
    constructor({ project, mediaUrl, onFrame }) {
      this.project = project;
      this.mediaUrl = mediaUrl;
      this.onFrame = onFrame || (() => {});
      this.time = 0;
      this.playing = false;
      this.raf = 0;
      this.els = new Map(); // clip id -> { el, mediaId, gain }
      this.audio = null;
      this.previewVolume = 1; // what you hear while editing (0 = muted); exports don't use it
    }

    // The loudness of the preview (0-1); exports record at full level.
    setPreviewVolume(v) {
      this.previewVolume = Math.max(0, Math.min(1, Number(v) || 0));
      if (this.audio && !this.recording) this.audio.speakers.gain.value = this.previewVolume;
      this.sync(this.time, this.playing);
    }

    get duration() {
      return M.duration(this.project());
    }

    element(clip) {
      let e = this.els.get(clip.id);
      if (e && e.mediaId !== clip.media) {
        this.drop(clip.id);
        e = null;
      }
      if (!e) {
        e = { el: makeMedia(this.mediaUrl(clip.media), clip.type), mediaId: clip.media, gain: null };
        this.els.set(clip.id, e);
        // A paused frame that's ready (after loading or seeking) is drawn.
        const ready = () => {
          if (!this.playing) this.onFrame(this.time);
        };
        e.el.addEventListener("seeked", ready);
        e.el.addEventListener("loadeddata", ready);
        if (this.audio) this.connect(e);
      }
      return e;
    }

    drop(id) {
      const e = this.els.get(id);
      if (!e) return;
      e.el.pause();
      e.el.removeAttribute("src");
      e.el.load();
      this.els.delete(id);
    }

    ensureAudio() {
      if (this.audio) return;
      try {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        const speakers = ctx.createGain();
        master.connect(speakers);
        speakers.connect(ctx.destination);
        speakers.gain.value = this.previewVolume;
        this.audio = { ctx, master, speakers };
        for (const e of this.els.values()) this.connect(e);
      } catch (err) {
        console.debug("[igfv] editor: no audio graph", err);
        this.audio = null;
      }
    }

    connect(e) {
      if (e.gain || !this.audio) return;
      try {
        const source = this.audio.ctx.createMediaElementSource(e.el);
        const gain = this.audio.ctx.createGain();
        source.connect(gain);
        gain.connect(this.audio.master);
        e.gain = gain;
      } catch (err) {
        console.debug("[igfv] editor: clip without audio graph", err);
      }
    }

    // Puts every video / audio clip's element where it should be at time t.
    sync(t, playing) {
      const p = this.project();
      for (const clip of p.clips) {
        if (clip.type !== "video" && clip.type !== "audio") continue;
        // A video stays in sync through its transitions (silent outside its own time).
        const [from, to] = clip.type === "video" ? M.visualSpan(p, clip) : [clip.start, clip.start + clip.dur];
        const active = t >= from - 1e-6 && t < to - 1e-6;
        const inside = t >= clip.start - 1e-6 && t < clip.start + clip.dur - 1e-6;
        if (!active && !this.els.has(clip.id)) continue;
        const e = this.element(clip);
        const el = e.el;
        if (!active) {
          if (!el.paused) el.pause();
          continue;
        }
        const tr = M.trackOf(p, clip.track);
        const len = (p.media[clip.media] && p.media[clip.media].duration) || Infinity;
        const target = M.clamp(M.sourceTime(clip, t), 0, Math.max(0, len - 0.02));
        const gain = (tr && tr.muted) || !inside ? 0 : M.clipGain(clip, t);
        if (e.gain) e.gain.gain.value = gain;
        else {
          el.muted = gain === 0 || (!this.recording && this.previewVolume === 0);
          el.volume = Math.min(1, gain * (this.recording ? 1 : this.previewVolume));
        }
        if (el.playbackRate !== (clip.speed || 1)) el.playbackRate = clip.speed || 1;
        if (playing) {
          if (el.paused) {
            el.currentTime = target;
            el.play().catch(() => {});
          } else if (Math.abs(el.currentTime - target) > DRIFT) {
            el.currentTime = target;
          }
        } else {
          if (!el.paused) el.pause();
          if (Math.abs(el.currentTime - target) > 0.01) el.currentTime = target;
        }
      }
      for (const id of [...this.els.keys()]) if (!M.clipOf(p, id)) this.drop(id);
    }

    // The frame of a video clip, for the renderer.
    source(clip) {
      const e = this.els.get(clip.id) || this.element(clip);
      const el = e.el;
      if (el.readyState < 2 && !el.videoWidth) return null;
      // pending: seeking or not loaded yet, so the picture isn't the frame at currentTime (not cached).
      const pending = Boolean(el.seeking || el.readyState < 2);
      return { el, w: el.videoWidth, h: el.videoHeight, frameKey: `${clip.id}:${el.currentTime.toFixed(3)}`, pending };
    }

    async settle(timeout = 2000) {
      const waits = [];
      for (const e of this.els.values()) if (e.el.seeking) waits.push(once(e.el, "seeked", timeout).catch(() => {}));
      await Promise.all(waits);
    }

    async seek(t, { quiet = false } = {}) {
      if (this.playing) this.pause();
      this.time = M.clamp(t, 0, Math.max(0, this.duration));
      this.sync(this.time, false);
      await this.settle();
      if (!quiet) this.onFrame(this.time);
    }

    async play() {
      const p = this.project();
      if (this.playing || M.isStill(p) || this.duration <= 0) return;
      if (this.time >= this.duration - 0.03) this.time = 0;
      this.ensureAudio();
      if (this.audio && this.audio.ctx.state === "suspended") await this.audio.ctx.resume().catch(() => {});
      this.playing = true;
      this.t0 = performance.now() - this.time * 1000;
      const tick = () => {
        if (!this.playing) return;
        const t = (performance.now() - this.t0) / 1000;
        if (t >= this.duration) {
          this.time = this.duration;
          this.pause();
          this.onFrame(this.time);
          return;
        }
        this.time = t;
        this.sync(t, true);
        this.onFrame(t);
        this.raf = requestAnimationFrame(tick);
      };
      this.sync(this.time, true);
      this.raf = requestAnimationFrame(tick);
    }

    pause() {
      const was = this.playing;
      this.playing = false;
      cancelAnimationFrame(this.raf);
      for (const e of this.els.values()) if (!e.el.paused) e.el.pause();
      // The elements ran a little ahead of the clock: put them on the paused frame now.
      if (was) this.sync(this.time, false);
    }

    destroy() {
      this.pause();
      for (const id of [...this.els.keys()]) this.drop(id);
      if (this.audio) this.audio.ctx.close().catch(() => {});
    }

    // ---- export: video (real time, through the compositor, with the mixed sound) ----------------
    async exportVideo({ width, height, compose, onProgress = () => {}, isCancelled = () => false }) {
      this.pause();
      await this.seek(0, { quiet: true });
      const total = this.duration;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      compose(canvas, 0);
      const tracks = [...canvas.captureStream(30).getVideoTracks()];
      this.ensureAudio();
      let dest = null;
      if (this.audio) {
        try {
          dest = this.audio.ctx.createMediaStreamDestination();
          this.audio.master.connect(dest);
          tracks.push(...dest.stream.getAudioTracks());
          this.audio.speakers.gain.value = 0; // recorded, not played out loud
          this.recording = true;
          if (this.audio.ctx.state === "suspended") await this.audio.ctx.resume().catch(() => {});
        } catch (err) {
          console.debug("[igfv] editor: recording without sound", err);
        }
      }
      const types = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
      const mimeType = types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(new MediaStream(tracks), {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: Math.min(16_000_000, Math.max(2_000_000, width * height * 6)),
      });
      const chunks = [];
      recorder.addEventListener("dataavailable", (e) => e.data && e.data.size && chunks.push(e.data));
      const stopped = once(recorder, "stop").catch(() => {});
      let cancelled = false;
      try {
        recorder.start(1000);
        const t0 = performance.now();
        await new Promise((resolve) => {
          const tick = () => {
            if (isCancelled()) {
              cancelled = true;
              return resolve();
            }
            const t = Math.min(total, (performance.now() - t0) / 1000);
            this.time = t;
            this.sync(t, true);
            compose(canvas, t);
            onProgress(total ? t / total : 1);
            if (t >= total) return resolve();
            this.raf = requestAnimationFrame(tick);
          };
          this.raf = requestAnimationFrame(tick);
        });
      } finally {
        cancelAnimationFrame(this.raf);
        this.pause();
        if (recorder.state !== "inactive") recorder.stop();
        await stopped;
        if (dest) {
          try {
            this.audio.master.disconnect(dest);
          } catch (err) {
            // already gone
          }
        }
        this.recording = false;
        if (this.audio) this.audio.speakers.gain.value = this.previewVolume;
      }
      if (cancelled) return null;
      onProgress(1);
      return new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" });
    }

    // ---- export: GIF (frame by frame: seek, compose, encode) ----------------------------------------
    async exportGif({ from = 0, to, fps, width, height, compose, dither = true, onProgress = () => {}, isCancelled = () => false }) {
      this.pause();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const frames = [];
      const count = Math.max(1, Math.round((to - from) * fps));
      for (let k = 0; k < count; k++) {
        if (isCancelled()) return null;
        const t = from + k / fps;
        await this.seek(t, { quiet: true });
        compose(canvas, t);
        const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height);
        frames.push({ width, height, data: data.data });
        onProgress((0.5 * (k + 1)) / count);
      }
      const bytes = await IgfvEditor.Gif.encode(frames, { delay: 1000 / fps, dither }, (q) => onProgress(0.5 + q * 0.5), isCancelled);
      return bytes ? new Blob([bytes], { type: "image/gif" }) : null;
    }
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s < 10 ? "0" : ""}${s.toFixed(s % 1 ? 1 : 0)}`;
  }

  // Timecode for the ruler / transport: m:ss.f
  function timecode(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const f = Math.floor((t % 1) * 10);
    return `${m}:${String(s).padStart(2, "0")}.${f}`;
  }

  return { Engine, probe, decodeGif, thumbnails, seekTo, formatTime, timecode };
})();
