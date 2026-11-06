// The editor's timeline, drawn on a canvas: track headers (name, hide / mute, lock, remove), the
// ruler and playhead, and the clips as blocks (thumbnails for video / images). Clips are dragged in
// time and across tracks of their kind, trimmed by their edges, with snapping; the ruler scrubs.
// Video tracks are listed top track first (Vn ... V1), then the audio tracks (A1 ... An).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Timeline = (() => {
  const M = IgfvEditor.Model;
  const HEADER = 112;
  const RULER = 22;
  const ROW_V = 46;
  const ROW_A = 34;
  const ROW_MIN = 34;
  const ROW_MAX = 120;
  const GAP = 2;
  const EDGE = 6; // px: grab a clip's edge to trim it
  const SNAP_PX = 8;
  const SEP = 3; // px around a row's bottom line: drag to resize that row
  // The Blade tool's cursor: a small razor (hot spot on its edge).
  const BLADE_CURSOR =
    'url("data:image/svg+xml,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path d="M11 1v20" stroke="#ff3b5c" stroke-width="2"/><path d="M4 4h6v7H4z" fill="#fff" stroke="#111"/><circle cx="7" cy="7.5" r="1.4" fill="#111"/></svg>') +
    '") 11 11, crosshair';

  const COLORS = {
    video: "#2f5d9e",
    image: "#2b7a78",
    audio: "#2f7d46",
    text: "#6b4aa8",
    sticker: "#a8662f",
    asticker: "#b5552f",
    gif: "#2f8a9e",
    adjust: "#5b3fa8",
    shape: "#5d6470",
    draw: "#a8467a",
    blur: "#4b5566",
    pixelate: "#4b5566",
    retouch: "#7a6a2f",
  };

  class Timeline {
    // api: { project(), time(), selected(), select(id), seek(t), move(id, start, track), trim(id, edge, t),
    //        toggleTrack(id, key), removeTrack(id), endDrag(), snapOn(), thumbs(mediaId), label(clip),
    //        clipSelected(id), toggleClip(id), shiftClips(dt) -> applied,
    //        trackSelected(id), selectTrack(id | null, mode), shiftTracks(dt) -> applied, blade(),
    //        cut(clipId, t), setTrackHeight(id, h | null), showTransition(clipId), transPicked(),
    //        kfPicked() -> { clip, index }, pickKey(clipId, i), moveKey(clipId, i, t) -> i, addKeyAt(clipId, t) }
    //        (move and shiftClips take { alt }: Alt flips the Push option for that drag)
    constructor(host, api) {
      this.api = api;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "igfv-ed-timeline-canvas";
      host.appendChild(this.canvas);
      this.pps = 60; // pixels per second
      this.scrollX = 0; // seconds at the left edge of the clip area
      this.scrollY = 0; // pixels
      this.drag = null;
      this.ghost = null;
      this.hits = [];
      this.autoFit = true;
      this.trackH = ROW_V; // video row height (audio rows are a bit lower); Ctrl+Shift+wheel
      const c = this.canvas;
      c.addEventListener("pointerdown", (e) => this.down(e));
      c.addEventListener("pointermove", (e) => this.move(e));
      c.addEventListener("pointerup", (e) => this.up(e));
      c.addEventListener("pointercancel", (e) => this.up(e));
      c.addEventListener("wheel", (e) => this.wheel(e), { passive: false });
      c.addEventListener("dblclick", (e) => this.dblclick(e));
      c.addEventListener("pointerleave", () => {
        if (this.bladeAt) {
          this.bladeAt = null;
          this.draw();
        }
      });
    }

    layout() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.w = Math.max(200, Math.round(r.width || 800));
      this.h = Math.max(80, Math.round(r.height || 200));
      if (this.canvas.width !== Math.round(this.w * dpr) || this.canvas.height !== Math.round(this.h * dpr)) {
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
      }
      this.dpr = dpr;
      const p = this.api.project();
      // Rows: video tracks top first, then audio.
      const rows = [];
      let y = RULER;
      const rowV = Math.round(this.trackH);
      const rowA = Math.max(ROW_MIN, Math.round((this.trackH * ROW_A) / ROW_V));
      // A track's own height (dragged at its bottom line), else the default for its kind.
      const own = (t, def) => (t.h ? M.clamp(Math.round(t.h), ROW_MIN, ROW_MAX) : def);
      for (const t of [...M.tracksOf(p, "video")].reverse()) {
        const h = own(t, rowV);
        rows.push({ track: t, y, h });
        y += h + GAP;
      }
      for (const t of M.tracksOf(p, "audio")) {
        const h = own(t, rowA);
        rows.push({ track: t, y, h });
        y += h + GAP;
      }
      this.rows = rows;
      this.contentH = y;
      this.scrollY = M.clamp(this.scrollY, 0, Math.max(0, y - this.h));
      if (this.autoFit && !this.drag) this.fit(); // not while dragging: the clips would run away
    }

    // Zoom so the whole project fits.
    fit() {
      const d = Math.max(5, M.duration(this.api.project()) * 1.08);
      this.pps = M.clamp((this.w - HEADER - 10) / d, 2, 600);
      this.scrollX = 0;
    }

    setTrackH(h) {
      this.trackH = M.clamp(Math.round(h), ROW_MIN, ROW_MAX);
      this.draw();
    }

    zoomBy(k, anchorX = null) {
      this.autoFit = false;
      const ax = anchorX == null ? HEADER + (this.w - HEADER) / 2 : anchorX;
      const tAt = this.tAt(ax);
      this.pps = M.clamp(this.pps * k, 2, 600);
      this.scrollX = Math.max(0, tAt - (ax - HEADER) / this.pps);
      this.draw();
    }

    x(t) {
      return HEADER + (t - this.scrollX) * this.pps;
    }

    tAt(x) {
      return Math.max(0, this.scrollX + (x - HEADER) / this.pps);
    }

    rowAt(y) {
      const yy = y + this.scrollY;
      return this.rows.find((r) => yy >= r.y && yy < r.y + r.h + GAP) || null;
    }

    draw() {
      this.layout();
      const p = this.api.project();
      const ctx = this.canvas.getContext("2d");
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = "#101013";
      ctx.fillRect(0, 0, this.w, this.h);
      this.hits = [];
      const selected = this.api.selected();
      // The selected clips (and their joined partners) are outlined.
      const lit = new Set(p.clips.filter((c) => c.id === selected || (this.api.clipSelected && this.api.clipSelected(c.id))).map((c) => c.id));
      for (const id of [...lit]) {
        const o = M.partner(p, M.clipOf(p, id));
        if (o) lit.add(o.id);
      }
      const isSel = (tr) => Boolean(this.api.trackSelected && this.api.trackSelected(tr.id));
      // Rows and clips.
      for (const row of this.rows) {
        const y = row.y - this.scrollY;
        if (y > this.h || y + row.h < RULER) continue;
        const tr = row.track;
        ctx.fillStyle = isSel(tr) ? (tr.kind === "video" ? "#1f2333" : "#1c2629") : tr.kind === "video" ? "#17171c" : "#15191a";
        ctx.fillRect(HEADER, y, this.w - HEADER, row.h);
        for (const clip of p.clips.filter((c) => c.track === tr.id)) this.drawClip(ctx, clip, y, row.h, lit.has(clip.id), tr);
        if (tr.hidden || tr.muted) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(HEADER, y, this.w - HEADER, row.h);
        }
      }
      // The Blade's cut line, over the clip under the pointer.
      if (this.bladeAt && this.api.blade && this.api.blade()) {
        const b = this.bladeAt;
        const row = this.rows.find((r) => r.track.id === b.track);
        if (row) {
          const bx = Math.round(this.x(b.time)) + 0.5;
          const by = row.y - this.scrollY;
          ctx.fillStyle = "#ff3b5c";
          ctx.fillRect(bx - 1, by, 2, row.h);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(bx - 0.5, by + 2, 1, row.h - 4);
        }
      }
      // Ghost of a refused move.
      if (this.ghost) {
        ctx.strokeStyle = this.ghost.ok ? "#ffffff" : "#ff4d4d";
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(this.x(this.ghost.start), this.ghost.y - this.scrollY + 2, this.ghost.dur * this.pps, this.ghost.h - 4);
        ctx.setLineDash([]);
      }
      // Headers (drawn over the clips scrolled under them).
      for (const row of this.rows) {
        const y = row.y - this.scrollY;
        if (y > this.h || y + row.h < RULER) continue;
        const tr = row.track;
        ctx.fillStyle = isSel(tr) ? "#272b3b" : "#1c1c22";
        ctx.fillRect(0, y, HEADER - 2, row.h);
        if (isSel(tr)) {
          ctx.fillStyle = "#4db5ff";
          ctx.fillRect(0, y, 3, row.h);
        }
        ctx.fillStyle = tr.kind === "video" ? "#7fb2ff" : "#7fdc9a";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillText(tr.name, 8, y + 16);
        const icons = [
          [tr.kind === "video" ? (tr.hidden ? "○" : "◉") : tr.muted ? "\u{1f507}" : "\u{1f50a}", tr.kind === "video" ? "hidden" : "muted", tr.kind === "video" ? (tr.hidden ? "Show track" : "Hide track") : tr.muted ? "Unmute track" : "Mute track"],
          [tr.locked ? "\u{1f512}" : "\u{1f513}", "locked", tr.locked ? "Unlock track" : "Lock track"],
        ];
        if (tr.kind === "video") icons.push([tr.muted ? "\u{1f507}" : "\u{1f50a}", "muted", tr.muted ? "Unmute track" : "Mute track"]);
        icons.push(["✕", "remove", "Remove this track (empty tracks only)"]);
        ctx.font = "12px system-ui, sans-serif";
        icons.forEach(([glyph, key, title], i) => {
          const ix = 8 + i * 24;
          const iy = y + row.h - 18;
          ctx.fillStyle = key === "remove" ? "#777" : "#cfcfcf";
          ctx.fillText(glyph, ix, iy + 12);
          this.hits.push({ x: ix - 3, y: iy - 2, w: 22, h: 18, track: tr.id, key, title });
        });
      }
      // Ruler.
      ctx.fillStyle = "#141418";
      ctx.fillRect(0, 0, this.w, RULER);
      ctx.fillStyle = "#8a8a8a";
      ctx.font = "10px system-ui, sans-serif";
      const step = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120].find((s) => s * this.pps >= 64) || 120;
      const first = Math.floor(this.scrollX / step) * step;
      for (let t = first; this.x(t) < this.w; t += step) {
        const x = this.x(t);
        if (x < HEADER) continue;
        ctx.fillRect(Math.round(x), 13, 1, 9);
        ctx.fillText(IgfvEditor.Engine ? IgfvEditor.Engine.timecode(t) : t.toFixed(1), x + 3, 11);
      }
      // End of the project.
      const end = this.x(M.duration(p));
      if (end > HEADER && end < this.w) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(Math.round(end), RULER, 1, this.h - RULER);
      }
      // Playhead.
      const px = this.x(this.api.time());
      if (px >= HEADER - 1) {
        ctx.fillStyle = "#ff3b5c";
        ctx.fillRect(Math.round(px) - 1, 0, 2, this.h);
        ctx.beginPath();
        ctx.moveTo(px - 6, 0);
        ctx.lineTo(px + 6, 0);
        ctx.lineTo(px, 8);
        ctx.fill();
      }
      ctx.fillStyle = "#1c1c22";
      ctx.fillRect(0, 0, HEADER - 2, RULER);
    }

    drawClip(ctx, clip, y, h, selected, track) {
      const x0 = this.x(clip.start);
      const x1 = this.x(clip.start + clip.dur);
      if (x1 < HEADER || x0 > this.w) return;
      const top = y + 2;
      const hh = h - 4;
      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.max(HEADER, x0), top, Math.max(1, Math.min(this.w, x1) - Math.max(HEADER, x0)), hh);
      ctx.clip();
      ctx.fillStyle = COLORS[clip.type] || "#555";
      ctx.fillRect(x0, top, x1 - x0, hh);
      // Thumbnails (video: across the clip's source range; image: repeated).
      const thumbs = clip.media != null ? this.api.thumbs(clip.media) : null;
      if (thumbs && thumbs.length && (clip.type === "video" || clip.type === "image" || clip.type === "gif")) {
        const th = thumbs[0].canvas;
        const tw = (th.width * hh) / Math.max(1, th.height);
        ctx.globalAlpha = 0.85;
        for (let x = x0; x < x1; x += tw) {
          let thumb = thumbs[0];
          if (clip.type === "video") {
            const src = M.sourceTime(clip, clip.start + (x + tw / 2 - x0) / this.pps);
            thumb = thumbs.reduce((a, b) => (Math.abs(b.time - src) < Math.abs(a.time - src) ? b : a));
          }
          ctx.drawImage(thumb.canvas, x, top, tw, hh);
        }
        ctx.globalAlpha = 1;
      }
      if (clip.type === "audio" || clip.type === "video") {
        // Fades as ramps.
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        if (clip.fadeIn > 0) {
          ctx.beginPath();
          ctx.moveTo(x0, top);
          ctx.lineTo(x0 + clip.fadeIn * this.pps, top);
          ctx.lineTo(x0, top + hh);
          ctx.fill();
        }
        if (clip.fadeOut > 0) {
          ctx.beginPath();
          ctx.moveTo(x1, top);
          ctx.lineTo(x1 - clip.fadeOut * this.pps, top);
          ctx.lineTo(x1, top + hh);
          ctx.fill();
        }
      }
      if (clip.type === "audio") {
        // A simple level bar (volume).
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        const vh = Math.min(1, (clip.volume ?? 1) / 2) * (hh - 6);
        ctx.fillRect(x0, top + hh - 3 - vh, x1 - x0, 1);
      }
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      const label = this.api.label(clip) + (clip.speed && clip.speed !== 1 ? `  ${clip.speed}×` : "") + (clip.muted ? "  \u{1f507}" : "");
      ctx.font = "11px system-ui, sans-serif";
      const lw = Math.min(x1 - x0 - 6, ctx.measureText(label).width + 8);
      if (lw > 12) {
        ctx.fillRect(Math.max(HEADER, x0) + 3, top + 3, lw, 15);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, Math.max(HEADER, x0) + 7, top + 14);
      }
      // Joined to its audio / video: a link badge at the right end.
      if (clip.link != null && x1 - Math.max(HEADER, x0) > 40) {
        const bx = Math.min(this.w, x1) - 20;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(bx, top + 3, 16, 15);
        ctx.fillStyle = "#fff";
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillText("\u{1f517}", bx + 2, top + 14);
      }
      ctx.restore();
      this.drawEffectChips(ctx, clip, x0, x1, top, hh);
      // A transition in: a bow tie over the cut (or a ramp at the start, from below).
      const ti = M.transInfo(this.api.project(), clip);
      if (ti) {
        const a = this.x(ti.from);
        const b = this.x(ti.to);
        if (b > HEADER && a < this.w) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(HEADER, top, this.w - HEADER, hh);
          ctx.clip();
          const picked = this.api.transPicked && this.api.transPicked() === clip.id;
          ctx.fillStyle = picked ? "rgba(77,181,255,0.8)" : selected ? "rgba(255,209,102,0.55)" : "rgba(255,255,255,0.35)";
          ctx.beginPath();
          if (ti.prev) {
            const m = (a + b) / 2;
            ctx.moveTo(a, top);
            ctx.lineTo(b, top + hh);
            ctx.lineTo(b, top);
            ctx.lineTo(a, top + hh);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.fillRect(Math.round(m) - 0.5, top, 1, hh);
          } else {
            ctx.moveTo(a, top + hh);
            ctx.lineTo(b, top);
            ctx.lineTo(a, top);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          const def = M.TRANSITIONS.find((x) => x.id === ti.type);
          const hx = Math.max(HEADER, Math.min(a, b - 10));
          this.hits.unshift({ x: hx, y: top, w: Math.max(10, Math.min(this.w, b) - hx), h: hh, clip: clip.id, key: "trans", title: `${def ? def.label : "Transition"} · click: its settings (Del removes it) · right-click: remove, change` });
        }
      }
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeStyle = selected ? "#ffd166" : track.locked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.35)";
      ctx.strokeRect(Math.max(HEADER, x0) + 0.5, top + 0.5, Math.max(1, Math.min(this.w, x1) - Math.max(HEADER, x0) - 1), hh - 1);
      this.drawKeys(ctx, clip, top, hh, selected);
    }

    // Keyframes: diamonds along the bottom of the clip, joined by a line over the animated span.
    drawKeys(ctx, clip, top, hh, selected) {
      const kf = clip.kf;
      if (!kf || !kf.length) return;
      const picked = this.api.kfPicked && this.api.kfPicked();
      const y = top + hh - 7;
      const r = 4.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(HEADER, top, this.w - HEADER, hh);
      ctx.clip();
      if (kf.length > 1) {
        ctx.strokeStyle = selected ? "rgba(255,209,102,0.7)" : "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x(clip.start + kf[0].t), y + 0.5);
        ctx.lineTo(this.x(clip.start + kf[kf.length - 1].t), y + 0.5);
        ctx.stroke();
      }
      kf.forEach((k, i) => {
        const x = this.x(clip.start + k.t);
        if (x < HEADER - r || x > this.w + r) return;
        const on = picked && picked.clip === clip.id && picked.index === i;
        ctx.fillStyle = on ? "#4db5ff" : selected ? "#ffd166" : "rgba(255,255,255,0.6)";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        this.hits.unshift({ x: x - r - 2, y: y - r - 2, w: 2 * r + 4, h: 2 * r + 4, clip: clip.id, index: i, key: "kf", title: `Keyframe at ${(clip.start + k.t).toFixed(2)} s \u00b7 drag: move it \u00b7 Del: delete \u00b7 right-click: ease` });
      });
      ctx.restore();
    }

    // A clip's effects as chips along the bottom of its bar: "Glitch ✕". Click ✕ to remove one, the
    // name to select the clip (its effects show in the side panel). What doesn't fit: "+N".
    drawEffectChips(ctx, clip, x0, x1, top, hh) {
      const list = (clip.effects || []).filter((e) => M.effectDef(e.type));
      if (!list.length) return;
      const left = Math.max(HEADER, x0) + 3;
      const right = Math.min(this.w, x1) - 3;
      const ch = 14;
      const y = hh >= 30 ? top + hh - ch - 3 : top + 2;
      if (right - left < 24) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, hh);
      ctx.clip();
      ctx.font = "10px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      let x = left;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const name = M.effectDef(e.type).label;
        const w = ctx.measureText(name).width + 22;
        const rest = list.length - i;
        if (x + w > right - (rest > 1 ? 26 : 0)) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          this.pill(ctx, x, y, 24, ch);
          ctx.fillStyle = "#fff";
          ctx.fillText(`+${rest}`, x + 5, y + ch / 2 + 0.5);
          this.hits.push({ x, y, w: 24, h: ch, clip: clip.id, key: "fxSelect", title: list.slice(i).map((x2) => M.effectDef(x2.type).label).join(", ") });
          break;
        }
        ctx.fillStyle = e.on === false ? "rgba(90,90,100,0.85)" : "rgba(124,92,255,0.92)";
        this.pill(ctx, x, y, w, ch);
        ctx.fillStyle = "#fff";
        ctx.fillText(name, x + 6, y + ch / 2 + 0.5);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText("✕", x + w - 13, y + ch / 2 + 0.5);
        this.hits.push({ x, y, w: w - 15, h: ch, clip: clip.id, fx: e.id, key: "fxSelect", title: `${name}: click to edit` });
        this.hits.push({ x: x + w - 15, y, w: 15, h: ch, clip: clip.id, fx: e.id, key: "fxRemove", title: `Remove ${name}` });
        x += w + 4;
      }
      ctx.restore();
    }

    pill(ctx, x, y, w, h) {
      const r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    }

    local(e) {
      const r = this.canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    clipAt(x, y) {
      const row = this.rowAt(y);
      if (!row || x < HEADER) return null;
      const t = this.tAt(x);
      const p = this.api.project();
      const clip = p.clips.find((c) => c.track === row.track.id && t >= c.start && t <= c.start + c.dur);
      if (!clip) return { row };
      const nearLeft = Math.abs(x - this.x(clip.start)) <= EDGE;
      const nearRight = Math.abs(x - this.x(clip.start + clip.dur)) <= EDGE;
      return { row, clip, edge: nearLeft ? "left" : nearRight ? "right" : null };
    }

    // What's under a right-click: { clip (or null), track (or null), time, header }, or null outside.
    contextAt(clientX, clientY) {
      this.layout();
      const r = this.canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
      const row = this.rowAt(y);
      const hit = x >= HEADER ? this.clipAt(x, y) : null;
      return { clip: (hit && hit.clip) || null, track: row ? row.track : null, time: this.tAt(Math.max(HEADER, x)), header: x < HEADER };
    }

    // The row whose bottom line is at y (to resize it), or null.
    sepAt(y) {
      if (y < RULER) return null;
      const yy = y + this.scrollY;
      return this.rows.find((r) => yy >= r.y + r.h - SEP && yy <= r.y + r.h + GAP + SEP) || null;
    }

    dblclick(e) {
      this.layout();
      const [x, y] = this.local(e);
      const row = this.sepAt(y);
      if (row && this.api.setTrackHeight) {
        this.api.setTrackHeight(row.track.id, null);
        this.api.endDrag();
        return;
      }
      // the keyframe band along the bottom of a clip: a keyframe there
      const hit = x >= HEADER ? this.clipAt(x, y) : null;
      if (hit && hit.clip && this.api.addKeyAt) {
        const top = hit.row.y - this.scrollY + 2;
        const hh = hit.row.h - 4;
        if (y >= top + hh - 14) this.api.addKeyAt(hit.clip.id, this.tAt(x) - hit.clip.start);
      }
    }

    // Where a point lands: { track, time } (for drops from the media bin).
    pointAt(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
      const row = this.rowAt(y);
      return { track: row ? row.track.id : null, time: this.tAt(Math.max(HEADER, x)) };
    }

    down(e) {
      if (e.button !== 0) return;
      this.layout();
      const [x, y] = this.local(e);
      this.canvas.setPointerCapture?.(e.pointerId);
      // A row's bottom line: resize that row.
      const sep = this.api.setTrackHeight ? this.sepAt(y) : null;
      if (sep) {
        this.drag = { kind: "rowh", track: sep.track.id, y0: y, h0: sep.h, id: e.pointerId };
        return;
      }
      const icon = this.hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      // A transition's bow-tie (not with the Blade, and a clip's trim edge comes first).
      const onEdge = () => {
        const h = this.clipAt(x, y);
        return Boolean(h && h.edge);
      };
      if (icon && !(icon.key === "trans" && ((this.api.blade && this.api.blade()) || onEdge()))) {
        if (icon.key === "kf") {
          this.drag = { kind: "kf", clipId: icon.clip, index: icon.index, x0: x, moved: false, id: e.pointerId };
          return;
        }
        if (icon.key === "trans") {
          this.api.showTransition(icon.clip);
          this.draw();
          return;
        }
        if (icon.key === "fxRemove") return this.api.removeEffect(icon.clip, icon.fx);
        if (icon.key === "fxSelect") return this.api.showEffects(icon.clip);
        if (icon.key === "remove") this.api.removeTrack(icon.track);
        else this.api.toggleTrack(icon.track, icon.key);
        return;
      }
      // A track header: select it (Ctrl: add / remove, Shift: a range); drag sideways to move it
      // (and the other selected tracks) in time.
      if (x < HEADER && y >= RULER && this.api.selectTrack) {
        const row = this.rowAt(y);
        if (!row) return;
        const mode = e.ctrlKey || e.metaKey ? "toggle" : e.shiftKey ? "range" : this.api.trackSelected(row.track.id) ? "keep" : "only";
        this.api.selectTrack(row.track.id, mode);
        if (this.api.trackSelected(row.track.id)) this.drag = { kind: "tracks", id: e.pointerId, x0: x, applied: 0 };
        this.draw();
        return;
      }
      if (y < RULER || x < HEADER) {
        if (x >= HEADER) {
          this.drag = { kind: "scrub", id: e.pointerId };
          this.api.seek(this.tAt(x));
        }
        return;
      }
      const hit = this.clipAt(x, y);
      // The Blade: a click cuts the clip there (and its joined partner).
      if (this.api.blade && this.api.blade()) {
        if (hit && hit.clip) this.api.cut(hit.clip.id, this.snapTime(this.tAt(x), hit.clip.id));
        return;
      }
      // Ctrl / Shift+click a clip: add it to (or take it out of) the selected clips; elsewhere it
      // keeps the selection.
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && this.api.toggleClip) {
        if (hit && hit.clip) this.api.toggleClip(hit.clip.id);
        this.draw();
        return;
      }
      if (hit && hit.clip) {
        const tr = hit.row.track;
        // (a template's pieces are selected together, so they move together too)
        this.api.select(hit.clip.id, Boolean(this.api.clipSelected && this.api.clipSelected(hit.clip.id)));
        const multi = this.api.clipSelected && this.api.clipSelected(hit.clip.id);
        if (tr.locked) return;
        const c = hit.clip;
        // One of several selected clips: they all move with it (in time; each keeps its track).
        if (multi && !hit.edge) {
          this.drag = { kind: "clips", id: e.pointerId, clipId: c.id, offset: this.tAt(x) - c.start, x0: x, y0: y, moved: false };
          return;
        }
        // A clip on a selected track: all the selected tracks move with it.
        if (!hit.edge && this.api.trackSelected && this.api.trackSelected(tr.id)) {
          this.drag = { kind: "tracks", id: e.pointerId, clipId: c.id, offset: this.tAt(x) - c.start, x0: x, y0: y, moved: false };
          return;
        }
        this.drag = hit.edge
          ? { kind: "trim", edge: hit.edge, clipId: c.id, id: e.pointerId }
          : { kind: "move", clipId: c.id, offset: this.tAt(x) - c.start, id: e.pointerId, x0: x, y0: y, moved: false, dur: c.dur, kindOf: tr.kind };
        return;
      }
      this.api.select(null);
      if (this.api.selectTrack) this.api.selectTrack(null);
      this.drag = { kind: "scrub", id: e.pointerId };
      this.api.seek(this.tAt(x));
    }

    snapTime(t, ignoreId) {
      if (!this.api.snapOn()) return t;
      return M.snap(t, M.snapPoints(this.api.project(), ignoreId, this.api.time()), SNAP_PX / this.pps);
    }

    move(e) {
      const [x, y] = this.local(e);
      if (!this.drag || e.pointerId !== this.drag.id) {
        const chip = this.hits.find((h) => h.clip != null && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
        this.canvas.title = chip ? chip.title : "";
        if (chip) {
          this.canvas.style.cursor = "pointer";
          return;
        }
        if (this.api.setTrackHeight && this.sepAt(y)) {
          this.canvas.style.cursor = "row-resize";
          this.canvas.title = "Drag to resize this track \u00b7 double-click: default height";
          return;
        }
        const hit = this.clipAt(x, y);
        if (this.api.blade && this.api.blade()) {
          this.canvas.style.cursor = x >= HEADER && y >= RULER ? BLADE_CURSOR : "default";
          const next = hit && hit.clip ? { track: hit.clip.track, time: this.snapTime(this.tAt(x), hit.clip.id) } : null;
          if (JSON.stringify(next) !== JSON.stringify(this.bladeAt || null)) {
            this.bladeAt = next;
            this.draw();
          }
          return;
        }
        const header = x < HEADER && y >= RULER && this.rowAt(y);
        this.canvas.style.cursor = hit && hit.edge ? "ew-resize" : hit && hit.clip ? "grab" : header ? (this.api.trackSelected && this.api.trackSelected(header.track.id) ? "grab" : "pointer") : x >= HEADER ? "text" : "default";
        if (header && !this.canvas.title) this.canvas.title = "Click: select this track (Ctrl: several, Shift: a range) \u00b7 drag sideways: move the selected tracks";
        return;
      }
      const d = this.drag;
      if (d.kind === "rowh") return this.api.setTrackHeight(d.track, M.clamp(d.h0 + (y - d.y0), ROW_MIN, ROW_MAX));
      if (d.kind === "tracks") {
        if (d.clipId != null) {
          if (!d.moved && Math.hypot(x - d.x0, y - d.y0) < 4) return;
          d.moved = true;
          const clip = M.clipOf(this.api.project(), d.clipId);
          if (!clip) return;
          const start = this.snapTime(Math.max(0, this.tAt(x) - d.offset), d.clipId);
          this.api.shiftTracks(start - clip.start);
        } else {
          const want = (x - d.x0) / this.pps;
          d.applied += this.api.shiftTracks(want - d.applied);
        }
        this.draw();
        return;
      }
      if (d.kind === "kf") {
        if (!d.moved && Math.abs(x - d.x0) < 3) return;
        d.moved = true;
        const clip = M.clipOf(this.api.project(), d.clipId);
        if (!clip) return;
        // snapped to the playhead and clip edges, else to whole frames
        let t = this.snapTime(this.tAt(x), d.clipId);
        if (t === this.tAt(x)) t = Math.round(t * 30) / 30;
        d.index = this.api.moveKey(d.clipId, d.index, t - clip.start);
        this.draw();
        return;
      }
      if (d.kind === "clips") {
        if (!d.moved && Math.hypot(x - d.x0, y - d.y0) < 4) return;
        d.moved = true;
        const clip = M.clipOf(this.api.project(), d.clipId);
        if (!clip) return;
        const start = this.snapTime(Math.max(0, this.tAt(x) - d.offset), d.clipId);
        // Up / down: the rows the pointer moved across (tracks of the dragged clip's kind).
        const p = this.api.project();
        const kind = M.trackKindFor(clip.type);
        const row = this.rowAt(y);
        const list = M.tracksOf(p, kind).map((t) => t.id);
        const level = row && row.track.kind === kind ? list.indexOf(row.track.id) - list.indexOf(clip.track) : 0;
        const res = this.api.shiftClips(start - clip.start, level, { alt: e.altKey });
        const tr = level && !(res && res.leveled) && row ? row : null;
        this.ghost = tr ? { start: clip.start, dur: clip.dur, y: tr.y, h: tr.h, ok: false } : null;
        this.draw();
        return;
      }
      if (d.kind === "scrub") return this.api.seek(this.tAt(Math.max(HEADER, x)));
      if (d.kind === "trim") return this.api.trim(d.clipId, d.edge, this.snapTime(this.tAt(x), d.clipId));
      if (d.kind === "move") {
        if (!d.moved && Math.hypot(x - d.x0, y - d.y0) < 4) return;
        d.moved = true;
        let start = Math.max(0, this.tAt(x) - d.offset);
        // Snap the start, or else the end.
        const s1 = this.snapTime(start, d.clipId);
        if (s1 !== start) start = s1;
        else {
          const e1 = this.snapTime(start + d.dur, d.clipId);
          if (e1 !== start + d.dur) start = e1 - d.dur;
        }
        const row = this.rowAt(y);
        const clip = M.clipOf(this.api.project(), d.clipId);
        const track = row && row.track.kind === d.kindOf && !row.track.locked ? row.track.id : clip.track;
        const ok = this.api.move(d.clipId, start, track, { alt: e.altKey });
        const tr = this.rows.find((r) => r.track.id === track);
        this.ghost = ok ? null : { start, dur: d.dur, y: tr ? tr.y : 0, h: tr ? tr.h : this.trackH, ok };
        this.draw();
      }
    }

    up(e) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const d = this.drag;
      if (d.kind === "kf" && !d.moved) this.api.pickKey(d.clipId, d.index);
      this.drag = null;
      this.ghost = null;
      this.api.endDrag();
      this.draw();
    }

    // Wheel: scroll across the tracks (Shift: in time); Ctrl: zoom time at the pointer (else the playhead);
    // Ctrl+Shift or Alt: track height.
    wheel(e) {
      e.preventDefault();
      const d = e.deltaY || e.deltaX;
      const zoomRows = ((e.ctrlKey || e.metaKey) && e.shiftKey) || e.altKey;
      if (zoomRows) {
        if (!d) return;
        this.setTrackH(this.trackH * (d < 0 ? 1.12 : 1 / 1.12));
        if (this.api.trackHeight) this.api.trackHeight(this.trackH);
        return;
      }
      const r = this.canvas.getBoundingClientRect();
      const inside = e.target === this.canvas && e.clientX - r.left >= HEADER;
      const x = inside ? e.clientX - r.left : this.x(this.api.time());
      // Settings can make the plain wheel zoom (then Ctrl+wheel scrolls).
      const zoomFirst = Boolean(this.api.wheelZooms && this.api.wheelZooms());
      if ((e.ctrlKey || e.metaKey) !== zoomFirst && !e.shiftKey) return d && this.zoomBy(d < 0 ? 1.2 : 1 / 1.2, x >= HEADER && x <= this.w ? x : null);
      // The wheel scrolls the tracks up / down; Shift+wheel (or a sideways swipe) scrolls in time.
      // Firefox often counts the wheel in lines (deltaMode 1) or pages (2): as pixels here.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.h : 1;
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (sideways) {
        this.autoFit = false;
        this.scrollX = Math.max(0, this.scrollX + ((e.deltaY + e.deltaX) * unit) / this.pps); // Firefox may report Shift+wheel as deltaX
      } else {
        this.scrollY = Math.max(0, this.scrollY + e.deltaY * unit);
      }
      this.draw();
    }
  }

  return { Timeline, HEADER, RULER };
})();
