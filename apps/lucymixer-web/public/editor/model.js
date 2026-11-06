// The editor's project: a canvas with a background, tracks (video tracks layered bottom to top, audio
// tracks), and clips on them: media (video / image / audio) and overlays (text, sticker, shape,
// drawing, blur / pixelate, retouch). Pure maths (placement, trimming, splitting, timing, crop,
// colour tables) and undo / redo; no page access, so it's unit-tested in node.
//
// Clip placement is in fractions of the canvas: cx, cy (centre), rotation (degrees), opacity, blend.
// Media clips have a scale (1 = fit inside the canvas); text / stickers a size (fraction of the
// canvas's shorter side); shapes and regions w, h (fractions of the canvas).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Model = (() => {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const EPS = 1e-6;
  const STILL_DUR = 5; // seconds, a new still clip (image, text...) in a project
  const MIN_DUR = 0.1;

  const ASPECTS = [
    { id: "free", label: "Free", ratio: null },
    { id: "original", label: "Original", ratio: "original" },
    { id: "1:1", label: "1:1", ratio: 1 },
    { id: "4:5", label: "4:5", ratio: 4 / 5 },
    { id: "9:16", label: "9:16", ratio: 9 / 16 },
    { id: "16:9", label: "16:9", ratio: 16 / 9 },
    { id: "3:2", label: "3:2", ratio: 3 / 2 },
  ];

  const CANVAS_PRESETS = [
    { id: "original", label: "Original" },
    { id: "9:16", label: "9:16", w: 1080, h: 1920 },
    { id: "1:1", label: "1:1", w: 1080, h: 1080 },
    { id: "4:5", label: "4:5", w: 1080, h: 1350 },
    { id: "16:9", label: "16:9", w: 1920, h: 1080 },
  ];

  // HSL bands: centre hue (degrees) of red, orange, yellow, green, aqua, blue, purple, magenta.
  const HSL_BANDS = [
    { id: "red", label: "Red", hue: 0, color: "#ff4040" },
    { id: "orange", label: "Orange", hue: 30, color: "#ff9a30" },
    { id: "yellow", label: "Yellow", hue: 60, color: "#ffe040" },
    { id: "green", label: "Green", hue: 120, color: "#40d060" },
    { id: "aqua", label: "Aqua", hue: 180, color: "#40d0d0" },
    { id: "blue", label: "Blue", hue: 225, color: "#4070ff" },
    { id: "purple", label: "Purple", hue: 270, color: "#9050ff" },
    { id: "magenta", label: "Magenta", hue: 315, color: "#ff40c0" },
  ];

  const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];
  const MEDIA_TYPES = new Set(["video", "image", "audio", "gif"]);
  const VISUAL_MEDIA = new Set(["video", "image", "gif"]);

  // ---- effects, transitions, sticker animations (the catalogues; effects.js draws them) ------------
  // An effect on a clip: { id, type, on, amount (0-100), ...params }. kind: "key" (removes a colour,
  // before the colour adjustments), "gl" (shader), "2d" (canvas), "motion" (moves the clip),
  // "particles" (drawn over it). anim: changes over time.
  const range = (k, label, min, max, def, step = 1) => ({ k, label, min, max, def, step });
  const color = (k, label, def) => ({ k, label, type: "color", def });
  const choice = (k, label, choices, def) => ({ k, label, type: "choice", choices, def });
  const EFFECT_GROUPS = ["Keying", "Stylize", "Blur & light", "Distort", "Motion", "Particles"];
  const EFFECTS = [
    {
      id: "chromakey",
      label: "Green screen",
      group: "Keying",
      kind: "key",
      noAmount: true,
      amount: 100,
      params: [color("color", "Key colour", "#00d000"), range("similarity", "Similarity", 1, 100, 40), range("smoothness", "Smoothness", 0, 100, 25), range("spill", "Spill removal", 0, 100, 50)],
    },
    { id: "glitch", label: "Glitch", group: "Stylize", kind: "gl", anim: true, amount: 50, params: [range("speed", "Speed", 0, 100, 50)] },
    { id: "rgbsplit", label: "RGB split", group: "Stylize", kind: "gl", amount: 40, params: [range("angle", "Angle", 0, 360, 0)] },
    { id: "vhs", label: "VHS", group: "Stylize", kind: "gl", anim: true, amount: 70, params: [] },
    { id: "oldfilm", label: "Old film", group: "Stylize", kind: "gl", anim: true, amount: 70, params: [] },
    { id: "halftone", label: "Halftone", group: "Stylize", kind: "gl", amount: 100, params: [range("size", "Dot size", 2, 24, 7), choice("ink", "Ink", [["colour", "Colour"], ["black", "Black"]], "colour")] },
    { id: "posterize", label: "Posterize", group: "Stylize", kind: "gl", amount: 60, params: [] },
    { id: "mosaic", label: "Mosaic", group: "Stylize", kind: "gl", amount: 30, params: [] },
    { id: "sketch", label: "Sketch", group: "Stylize", kind: "gl", amount: 100, params: [] },
    { id: "emboss", label: "Emboss", group: "Stylize", kind: "gl", amount: 100, params: [] },
    { id: "duotone", label: "Duotone", group: "Stylize", kind: "gl", amount: 100, params: [color("c1", "Shadows", "#1b0a4a"), color("c2", "Highlights", "#ff7ab6")] },
    { id: "thermal", label: "Thermal", group: "Stylize", kind: "gl", amount: 100, params: [] },
    { id: "nightvision", label: "Night vision", group: "Stylize", kind: "gl", anim: true, amount: 100, params: [] },
    { id: "invert", label: "Invert", group: "Stylize", kind: "gl", amount: 100, params: [] },
    { id: "neon", label: "Neon edges", group: "Stylize", kind: "gl", amount: 80, params: [] },
    { id: "blur", label: "Blur", group: "Blur & light", kind: "2d", amount: 30, params: [] },
    { id: "zoomblur", label: "Zoom blur", group: "Blur & light", kind: "gl", amount: 40, params: [range("x", "Centre X", 0, 100, 50), range("y", "Centre Y", 0, 100, 50)] },
    { id: "motionblur", label: "Motion blur", group: "Blur & light", kind: "gl", amount: 40, params: [range("angle", "Angle", 0, 180, 0)] },
    { id: "tiltshift", label: "Tilt-shift", group: "Blur & light", kind: "2d", amount: 60, params: [range("pos", "Focus", 0, 100, 50), range("width", "Focus width", 5, 80, 25)] },
    { id: "glow", label: "Glow", group: "Blur & light", kind: "2d", amount: 50, params: [] },
    { id: "lightleak", label: "Light leak", group: "Blur & light", kind: "gl", anim: true, amount: 60, params: [color("c1", "Colour 1", "#ff8a3d"), color("c2", "Colour 2", "#ff3d7f"), range("speed", "Speed", 0, 100, 40)] },
    { id: "lensvignette", label: "Lens vignette", group: "Blur & light", kind: "gl", amount: 60, params: [range("size", "Size", 0, 100, 50)] },
    { id: "letterbox", label: "Cinematic bars", group: "Blur & light", kind: "2d", amount: 100, params: [choice("ratio", "Ratio", [["2.39", "2.39:1"], ["2", "2:1"], ["1.85", "1.85:1"]], "2.39")] },
    { id: "mirror", label: "Mirror", group: "Distort", kind: "gl", noAmount: true, amount: 100, params: [choice("mode", "Mirror", [["left", "Left → right"], ["right", "Right → left"], ["top", "Top → bottom"], ["bottom", "Bottom → top"], ["quad", "Quad"]], "left")] },
    { id: "kaleido", label: "Kaleidoscope", group: "Distort", kind: "gl", amount: 100, anim: (e) => Number(e.spin) !== 0, params: [range("segments", "Segments", 3, 12, 6), range("spin", "Spin", -100, 100, 0)] },
    { id: "bulge", label: "Bulge", group: "Distort", kind: "gl", amount: 50, params: [] },
    { id: "pinch", label: "Pinch", group: "Distort", kind: "gl", amount: 50, params: [] },
    { id: "swirl", label: "Swirl", group: "Distort", kind: "gl", amount: 50, params: [] },
    { id: "wave", label: "Wave", group: "Distort", kind: "gl", anim: true, amount: 40, params: [range("freq", "Waves", 1, 30, 10), range("speed", "Speed", 0, 100, 40)] },
    { id: "ripple", label: "Ripple", group: "Distort", kind: "gl", anim: true, amount: 40, params: [range("speed", "Speed", 0, 100, 50)] },
    { id: "shake", label: "Shake", group: "Motion", kind: "motion", anim: true, amount: 40, params: [range("speed", "Speed", 1, 100, 50)] },
    { id: "pulse", label: "Pulse", group: "Motion", kind: "motion", anim: true, amount: 40, params: [range("bpm", "Beats / min", 30, 200, 100)] },
    { id: "kenburns", label: "Ken Burns", group: "Motion", kind: "motion", anim: true, amount: 50, params: [choice("dir", "Move", [["in", "Zoom in"], ["out", "Zoom out"], ["left", "Pan left"], ["right", "Pan right"], ["up", "Pan up"], ["down", "Pan down"]], "in")] },
    { id: "spin", label: "Spin", group: "Motion", kind: "motion", anim: true, amount: 50, params: [choice("dir", "Direction", [["cw", "Clockwise"], ["ccw", "Anticlockwise"]], "cw")] },
    { id: "sway", label: "Sway", group: "Motion", kind: "motion", anim: true, amount: 40, params: [range("speed", "Speed", 1, 100, 30)] },
    { id: "popin", label: "Pop in", group: "Motion", kind: "motion", anim: true, amount: 60, params: [] },
    { id: "strobe", label: "Strobe", group: "Motion", kind: "gl", anim: true, amount: 60, params: [range("speed", "Speed", 1, 100, 50)] },
    { id: "snow", label: "Snow", group: "Particles", kind: "particles", anim: true, amount: 50, params: [range("speed", "Speed", 1, 100, 40), range("size", "Size", 1, 100, 40)] },
    { id: "rain", label: "Rain", group: "Particles", kind: "particles", anim: true, amount: 50, params: [range("speed", "Speed", 1, 100, 60), range("size", "Size", 1, 100, 40)] },
    { id: "confetti", label: "Confetti", group: "Particles", kind: "particles", anim: true, amount: 50, params: [range("speed", "Speed", 1, 100, 40), range("size", "Size", 1, 100, 50)] },
    { id: "hearts", label: "Hearts", group: "Particles", kind: "particles", anim: true, amount: 40, params: [range("speed", "Speed", 1, 100, 40), range("size", "Size", 1, 100, 50)] },
    { id: "sparkles", label: "Sparkles", group: "Particles", kind: "particles", anim: true, amount: 40, params: [range("speed", "Speed", 1, 100, 50), range("size", "Size", 1, 100, 50)] },
    { id: "bokeh", label: "Bokeh", group: "Particles", kind: "particles", anim: true, amount: 40, params: [range("speed", "Speed", 1, 100, 30), range("size", "Size", 1, 100, 60)] },
  ];
  const EFFECT_BY_ID = new Map(EFFECTS.map((e) => [e.id, e]));

  function effectDef(type) {
    return EFFECT_BY_ID.get(type) || null;
  }

  // A new effect with its defaults.
  function makeEffect(p, type) {
    const def = effectDef(type);
    if (!def) throw new Error(`Unknown effect ${type}`);
    const e = { id: p.nextId++, type, on: true, amount: def.amount };
    for (const prm of def.params) e[prm.k] = prm.def;
    return e;
  }

  function effectAnimated(e) {
    const def = effectDef(e.type);
    if (!def || e.on === false) return false;
    return typeof def.anim === "function" ? def.anim(e) : Boolean(def.anim);
  }

  // Transitions: at the start of a clip, from the clip before it on the track (or from below).
  const TRANSITION_GROUPS = ["Dissolve", "Wipe", "Slide", "Stylize"];
  const TRANSITIONS = [
    { id: "dissolve", label: "Cross dissolve", group: "Dissolve" },
    { id: "dipblack", label: "Dip to black", group: "Dissolve" },
    { id: "dipwhite", label: "Dip to white", group: "Dissolve" },
    { id: "flash", label: "Flash", group: "Dissolve" },
    { id: "blurdissolve", label: "Blur dissolve", group: "Dissolve" },
    { id: "wipeleft", label: "Wipe \u2190", group: "Wipe" },
    { id: "wiperight", label: "Wipe \u2192", group: "Wipe" },
    { id: "wipeup", label: "Wipe \u2191", group: "Wipe" },
    { id: "wipedown", label: "Wipe \u2193", group: "Wipe" },
    { id: "clock", label: "Clock wipe", group: "Wipe" },
    { id: "irisopen", label: "Iris open", group: "Wipe" },
    { id: "irisclose", label: "Iris close", group: "Wipe" },
    { id: "diamond", label: "Diamond", group: "Wipe" },
    { id: "barndoor", label: "Barn door", group: "Wipe" },
    { id: "slideleft", label: "Slide \u2190", group: "Slide" },
    { id: "slideright", label: "Slide \u2192", group: "Slide" },
    { id: "slideup", label: "Slide \u2191", group: "Slide" },
    { id: "slidedown", label: "Slide \u2193", group: "Slide" },
    { id: "pushleft", label: "Push \u2190", group: "Slide" },
    { id: "pushright", label: "Push \u2192", group: "Slide" },
    { id: "pushup", label: "Push \u2191", group: "Slide" },
    { id: "pushdown", label: "Push \u2193", group: "Slide" },
    { id: "whip", label: "Whip pan", group: "Slide" },
    { id: "zoomin", label: "Zoom in", group: "Stylize" },
    { id: "zoomout", label: "Zoom out", group: "Stylize" },
    { id: "spin", label: "Spin", group: "Stylize" },
    { id: "pixelate", label: "Pixelate", group: "Stylize" },
    { id: "glitch", label: "Glitch", group: "Stylize" },
  ];
  const TRANSITION_DEFAULT_DUR = 0.8;

  // Sticker animations (emoji and text stickers).
  const STICKER_ANIMS = [
    { id: "none", label: "None" },
    { id: "bounce", label: "Bounce" },
    { id: "spin", label: "Spin" },
    { id: "pulse", label: "Pulse" },
    { id: "shake", label: "Shake" },
    { id: "float", label: "Float" },
    { id: "wobble", label: "Wobble" },
    { id: "heartbeat", label: "Heartbeat" },
    { id: "popin", label: "Pop in" },
    { id: "swing", label: "Swing" },
    { id: "slidein", label: "Slide in \u2192" },
    { id: "slideright", label: "Slide in \u2190" },
    { id: "slideup", label: "Slide up" },
    { id: "fadein", label: "Fade in" },
    { id: "ticker", label: "Ticker" },
  ];

  function defaultAdjust(fx) {
    const base = typeof igfvFxDefaults === "function" ? igfvFxDefaults() : {};
    const hsl = {};
    for (const band of HSL_BANDS) hsl[band.id] = { h: 0, s: 0, l: 0 };
    return {
      ...base,
      ...(fx ? clone(fx) : {}),
      whites: 0,
      blacks: 0,
      vibrance: 0,
      clarity: 0,
      grain: 0,
      grainSize: 1.5,
      vignetteMid: 50,
      vignetteRound: 0,
      hsl,
      levels: { inBlack: 0, inWhite: 255, gamma: 1, outBlack: 0, outWhite: 255 },
      split: { hiHue: 40, hiSat: 0, shHue: 210, shSat: 0, balance: 0 },
    };
  }

  // ---- project, tracks, media ---------------------------------------------------------------
  // A project around the opened item: a canvas of its own (turned) size, the item filling it on V1.
  // Without media: an empty project of the given size (9:16 by default).
  function createProject({ media = null, fx = null, rotation = 0, size = null }) {
    const rot = ((Math.round(rotation / 90) % 4) + 4) % 4;
    const w = media ? (rot % 2 ? media.h : media.w) : (size && size.w) || 1080;
    const h = media ? (rot % 2 ? media.w : media.h) : (size && size.h) || 1920;
    const p = {
      w,
      h,
      original: { w, h },
      bg: { color: "#000000", alpha: 1 },
      tracks: [],
      clips: [],
      media: {},
      bins: [], // the media pool's named bins (media with no bin are in Master)
      nextId: 1,
    };
    addTrack(p, "video");
    addTrack(p, "audio");
    if (!media) return p;
    const id = addMedia(p, media);
    const clip = mediaClip(p, id, { track: tracksOf(p, "video")[0].id, start: 0 });
    clip.crop.rot = rot;
    clip.adjust = defaultAdjust(fx);
    p.clips.push(clip);
    return p;
  }

  // info: { kind, name, w, h, duration, bin?, source? } (source: { code, index } of an Instagram post).
  function addMedia(p, info) {
    const id = p.nextId++;
    p.media[id] = {
      kind: info.kind,
      name: info.name || `Media ${id}`,
      w: info.w || 0,
      h: info.h || 0,
      duration: info.duration || 0,
      bin: info.bin ?? null,
      source: info.source || null,
    };
    // Properties: file size, format, whether a video has sound (true / false / null = unknown).
    if (info.size) p.media[id].size = info.size;
    if (info.type) p.media[id].type = info.type;
    if (info.hasAudio != null) p.media[id].hasAudio = info.hasAudio;
    return id;
  }

  // ---- the media pool's bins ----------------------------------------------------------------------
  function addBin(p, name) {
    p.bins ||= [];
    const bin = { id: p.nextId++, name: String(name || `Bin ${p.bins.length + 1}`).slice(0, 60) };
    p.bins.push(bin);
    return bin;
  }

  function renameBin(p, id, name) {
    const bin = (p.bins || []).find((b) => b.id === id);
    if (bin && String(name || "").trim()) bin.name = String(name).trim().slice(0, 60);
    return Boolean(bin);
  }

  // Deletes a bin; its media go back to Master.
  function removeBin(p, id) {
    p.bins = (p.bins || []).filter((b) => b.id !== id);
    for (const m of Object.values(p.media)) if (m.bin === id) m.bin = null;
  }

  function moveMedia(p, mediaId, binId) {
    const m = p.media[mediaId];
    if (!m) return false;
    m.bin = binId != null && (p.bins || []).some((b) => b.id === binId) ? binId : null;
    return true;
  }

  function mediaUsed(p, mediaId) {
    return p.clips.some((c) => c.media === mediaId);
  }

  // Removes media from the project (not while a clip uses it).
  function removeMedia(p, mediaId) {
    if (!p.media[mediaId] || mediaUsed(p, mediaId)) return false;
    delete p.media[mediaId];
    return true;
  }

  // Media ids in a bin (null = Master: everything), in the order they were added.
  function mediaInBin(p, binId) {
    return Object.keys(p.media)
      .map(Number)
      .filter((id) => binId == null || p.media[id].bin === binId);
  }

  // Media already imported from this Instagram post item, or null.
  function mediaBySource(p, source) {
    if (!source) return null;
    const hit = Object.entries(p.media).find(([, m]) => m.source && m.source.code === source.code && (m.source.index || 0) === (source.index || 0));
    return hit ? Number(hit[0]) : null;
  }

  function addTrack(p, kind) {
    const n = tracksOf(p, kind).length + 1;
    const track = { id: p.nextId++, kind, name: `${kind === "video" ? "V" : "A"}${n}`, hidden: false, muted: false, locked: false };
    p.tracks.push(track);
    return track;
  }

  function removeTrack(p, id) {
    if (p.clips.some((c) => c.track === id)) return false;
    const track = p.tracks.find((t) => t.id === id);
    if (!track || tracksOf(p, track.kind).length < 2) return false;
    p.tracks = p.tracks.filter((t) => t.id !== id);
    renameTracks(p);
    return true;
  }

  function renameTracks(p) {
    for (const kind of ["video", "audio"]) tracksOf(p, kind).forEach((t, i) => (t.name = `${kind === "video" ? "V" : "A"}${i + 1}`));
  }

  // Tracks of a kind, bottom (V1 / A1) first.
  function tracksOf(p, kind) {
    return p.tracks.filter((t) => t.kind === kind);
  }

  function trackOf(p, id) {
    return p.tracks.find((t) => t.id === id) || null;
  }

  function clipOf(p, id) {
    return p.clips.find((c) => c.id === id) || null;
  }

  function trackKindFor(type) {
    return type === "audio" ? "audio" : "video";
  }

  function duration(p) {
    return p.clips.reduce((d, c) => Math.max(d, c.start + c.dur), 0);
  }

  // Nothing that changes over time (video, audio, GIFs, animated stickers / effects, transitions):
  // a still picture (image export, no playback).
  function isStill(p) {
    return !p.clips.some(
      (c) =>
        c.type === "video" ||
        c.type === "audio" ||
        c.type === "gif" ||
        c.type === "asticker" ||
        (c.anim && c.anim !== "none") ||
        c.transIn ||
        (Array.isArray(c.kf) && c.kf.length > 1) ||
        (c.effects || []).some(effectAnimated)
    );
  }

  // Old projects (drafts) get what newer versions added.
  function normalizeProject(p) {
    for (const c of p.clips) if ((VISUAL_MEDIA.has(c.type) || c.type === "adjust") && !Array.isArray(c.effects)) c.effects = [];
    return p;
  }

  // A new media clip (not yet in the project).
  function mediaClip(p, mediaId, { track, start = 0, dur = null } = {}) {
    const m = p.media[mediaId];
    const kind = m.kind;
    const length = kind === "image" ? (dur || (isStill(p) ? STILL_DUR : Math.max(STILL_DUR, duration(p) - start))) : kind === "gif" ? dur || STILL_DUR : m.duration;
    const clip = { id: p.nextId++, track, start, dur: Math.max(MIN_DUR, dur || length), type: kind, media: mediaId };
    if (kind === "video" || kind === "audio") Object.assign(clip, { in: 0, speed: 1, volume: 1, muted: false, fadeIn: 0, fadeOut: 0 });
    if (VISUAL_MEDIA.has(kind)) {
      Object.assign(clip, {
        cx: 0.5,
        cy: 0.5,
        scale: 1,
        rotation: 0,
        opacity: 1,
        blend: "normal",
        crop: { x: 0, y: 0, w: 1, h: 1, aspect: "free", angle: 0, rot: 0, flipH: false, flipV: false },
        adjust: defaultAdjust(null),
        frame: { border: 0, borderColor: "#ffffff", radius: 0 },
        effects: [],
      });
    }
    if (kind === "gif") Object.assign(clip, { speed: 1, loop: true });
    return clip;
  }

  // An adjustment clip: its effects apply to everything below it on the canvas while it's shown.
  function adjustClip(p, { start = 0, dur = STILL_DUR, effects = [] } = {}) {
    return { id: p.nextId++, track: null, start, dur: Math.max(MIN_DUR, dur), type: "adjust", effects, opacity: 1 };
  }

  // Is [start, start + dur) free on the track (ignoring one clip)?
  function fits(p, trackId, start, dur, ignoreId = null) {
    if (start < -EPS) return false;
    return !p.clips.some((c) => c.track === trackId && c.id !== ignoreId && start < c.start + c.dur - EPS && c.start < start + dur - EPS);
  }

  // Puts a clip in the project: on `track` if it's free there; else the first free track of its
  // kind from the top (`top`) or the bottom; else on a new track. Returns the clip.
  function placeClip(p, clip, { track = null, top = false, newTrack = false } = {}) {
    const kind = trackKindFor(clip.type);
    let target = null;
    if (track && trackOf(p, track) && trackOf(p, track).kind === kind && fits(p, track, clip.start, clip.dur)) target = track;
    if (!target && !newTrack) {
      const list = tracksOf(p, kind);
      if (top) list.reverse();
      const free = list.find((t) => !t.locked && fits(p, t.id, clip.start, clip.dur));
      if (free) target = free.id;
    }
    if (!target) target = addTrack(p, kind).id;
    clip.track = target;
    p.clips.push(clip);
    return clip;
  }

  // ---- time -----------------------------------------------------------------------------------
  // Clips shown / heard at time t (a still project shows every visual clip), bottom track first.
  // transitions: also clips shown by a transition just outside their own time (visualSpan).
  function activeClips(p, t, { visual = true, audio = false, transitions = false } = {}) {
    const still = isStill(p);
    const order = new Map(p.tracks.map((tr, i) => [tr.id, i]));
    return p.clips
      .filter((c) => {
        const tr = trackOf(p, c.track);
        if (!tr) return false;
        const isAudio = c.type === "audio";
        if (isAudio ? !audio : !visual) return false;
        if (!isAudio && tr.hidden) return false;
        if (still) return !isAudio;
        if (t >= c.start - EPS && t < c.start + c.dur - EPS) return true;
        if (!transitions || isAudio) return false;
        const [from, to] = visualSpan(p, c);
        return t >= from - EPS && t < to - EPS;
      })
      .sort((a, b) => order.get(a.track) - order.get(b.track) || a.start - b.start);
  }

  // ---- transitions ------------------------------------------------------------------------------
  const CUT_EPS = 1e-3;
  const canTransition = (c) => c && trackKindFor(c.type) === "video" && c.type !== "adjust";

  // The clip ending where this one starts on its track (a cut), if any.
  function prevOnTrack(p, clip) {
    return p.clips.find((c) => c.track === clip.track && c.id !== clip.id && Math.abs(c.start + c.dur - clip.start) < CUT_EPS) || null;
  }

  function nextOnTrack(p, clip) {
    return p.clips.find((c) => c.track === clip.track && c.id !== clip.id && Math.abs(clip.start + clip.dur - c.start) < CUT_EPS) || null;
  }

  // A clip's transition in: { prev, from, to, d, type, ease, color } or null. With a clip before it:
  // centred on the cut (align "center"), starting at it ("start") or ending at it ("end"); else
  // from the clip's start. Its length is kept within the clips it covers.
  function transInfo(p, clip) {
    if (!clip || !clip.transIn || !canTransition(clip)) return null;
    let prev = prevOnTrack(p, clip);
    if (!canTransition(prev)) prev = null;
    const align = prev ? clip.transIn.align || "center" : "start";
    const max = align === "start" ? clip.dur : align === "end" ? prev.dur : Math.min(prev.dur, clip.dur);
    const d = clamp(clip.transIn.dur || TRANSITION_DEFAULT_DUR, 0.05, max);
    const from = align === "start" ? clip.start : align === "end" ? clip.start - d : clip.start - d / 2;
    return { prev, from, to: from + d, d, type: clip.transIn.type, ease: clip.transIn.ease || "smooth", color: clip.transIn.color || null };
  }

  // [from, to): when a clip is on screen, its transitions included.
  function visualSpan(p, clip) {
    let from = clip.start;
    let to = clip.start + clip.dur;
    const ti = transInfo(p, clip);
    if (ti && ti.prev) from = ti.from;
    const next = nextOnTrack(p, clip);
    const tn = next && transInfo(p, next);
    if (tn && tn.prev && tn.prev.id === clip.id) to = tn.to;
    return [from, to];
  }

  // At time t: { type, progress (0-1), role: "in" | "out", partner (clip id or null) }, or null.
  function transitionAt(p, clip, t) {
    const ti = transInfo(p, clip);
    if (ti && t >= ti.from - EPS && t < ti.to - EPS) return { type: ti.type, ease: ti.ease, color: ti.color, progress: clamp((t - ti.from) / ti.d, 0, 1), role: "in", partner: ti.prev ? ti.prev.id : null };
    const next = nextOnTrack(p, clip);
    const tn = next && transInfo(p, next);
    if (tn && tn.prev && tn.prev.id === clip.id && t >= tn.from - EPS && t < tn.to - EPS) return { type: tn.type, ease: tn.ease, color: tn.color, progress: clamp((t - tn.from) / tn.d, 0, 1), role: "out", partner: next.id };
    return null;
  }

  // The media time shown by a video / audio clip at timeline time t.
  function sourceTime(clip, t) {
    return (clip.in || 0) + (t - clip.start) * (clip.speed || 1);
  }

  // The longest a media clip can be from its start (by what's left of its source).
  function maxDur(p, clip) {
    const m = p.media[clip.media];
    if (!m || clip.type === "image" || clip.type === "gif" || !m.duration) return Infinity;
    return (m.duration - (clip.in || 0)) / (clip.speed || 1);
  }

  // Volume at time t: clip volume × fades × mute (track mute is applied by the caller).
  function clipGain(clip, t) {
    if (clip.muted || clip.audioOut) return 0; // audioOut: its sound is a detached audio clip
    let g = clip.volume ?? 1;
    const into = t - clip.start;
    const left = clip.start + clip.dur - t;
    if (clip.fadeIn > 0) g *= clamp(into / clip.fadeIn, 0, 1);
    if (clip.fadeOut > 0) g *= clamp(left / clip.fadeOut, 0, 1);
    return Math.max(0, g);
  }

  // The nearest snap point within `dist` (seconds), else t.
  function snap(t, points, dist) {
    let best = t;
    let bestD = dist;
    for (const s of points) {
      const d = Math.abs(s - t);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  // Snap points for moving / trimming a clip: 0, the playhead, other clips' edges.
  function snapPoints(p, ignoreId, playhead) {
    const pts = [0];
    if (playhead != null) pts.push(playhead);
    for (const c of p.clips) if (c.id !== ignoreId) pts.push(c.start, c.start + c.dur);
    return pts;
  }

  // Moves a clip to start on track (same kind, unlocked, free there). False if it can't go there.
  function moveClip(p, id, start, trackId) {
    const clip = clipOf(p, id);
    if (!clip) return false;
    const tr = trackOf(p, trackId);
    if (!tr || tr.kind !== trackKindFor(clip.type) || tr.locked) return false;
    const s = Math.max(0, start);
    if (!fits(p, trackId, s, clip.dur, id)) return false;
    clip.start = s;
    clip.track = trackId;
    return true;
  }

  // Trims the left or right edge to time t, within the source and the neighbours on the track.
  function trimClip(p, id, edge, t) {
    const clip = clipOf(p, id);
    if (!clip) return false;
    const end = clip.start + clip.dur;
    const others = p.clips.filter((c) => c.track === clip.track && c.id !== id);
    if (edge === "left") {
      let min = 0;
      for (const c of others) if (c.start + c.dur <= clip.start + EPS) min = Math.max(min, c.start + c.dur);
      if (clip.type === "video" || clip.type === "audio") min = Math.max(min, clip.start - (clip.in || 0) / (clip.speed || 1));
      const s = clamp(t, min, end - MIN_DUR);
      if (clip.in != null) clip.in = Math.max(0, clip.in + (s - clip.start) * (clip.speed || 1));
      // keyframes stay with the picture: they move by the trimmed amount
      if (clip.kf) clip.kf = sliceKeys(clip, s - clip.start, clip.dur);
      clip.dur = end - s;
      clip.start = s;
    } else {
      let max = Infinity;
      for (const c of others) if (c.start >= end - EPS) max = Math.min(max, c.start);
      max = Math.min(max, clip.start + maxDur(p, clip));
      clip.dur = clamp(t, clip.start + MIN_DUR, max) - clip.start;
      if (clip.kf) clip.kf = sliceKeys(clip, 0, clip.dur);
    }
    if (clip.kf && !clip.kf.length) delete clip.kf;
    return true;
  }

  // Splits a clip at timeline time t into two; returns the new (right) clip, or null.
  function splitClip(p, id, t) {
    const clip = clipOf(p, id);
    if (!clip || t <= clip.start + 0.05 || t >= clip.start + clip.dur - 0.05) return null;
    const right = clone(clip);
    right.id = p.nextId++;
    delete right.link; // joined pieces are re-joined by splitLinked
    right.start = t;
    right.dur = clip.start + clip.dur - t;
    if (clip.in != null) right.in = sourceTime(clip, t);
    if (clip.fadeIn != null) {
      right.fadeIn = 0;
      clip.fadeOut = 0;
    }
    if (clip.kf) {
      // each piece keeps its part of the animation (and the value at the cut)
      const cut = t - clip.start;
      right.kf = sliceKeys(clip, cut, clip.dur);
      clip.kf = sliceKeys(clip, 0, cut);
    }
    clip.dur = t - clip.start;
    p.clips.push(right);
    return right;
  }

  // Joins a clip with the clip touching it on its track (the one before, else the one after) when
  // they're pieces of the same media that continue each other (as after a split). Returns
  // { clip (the kept, left one), removed (id) } or { error: "gap" | "different" }.
  function mergeClips(p, id) {
    const clip = clipOf(p, id);
    if (!clip) return { error: "gap" };
    const prev = prevOnTrack(p, clip);
    const next = nextOnTrack(p, clip);
    if (!prev && !next) return { error: "gap" };
    const pieces = (a, b) => {
      if (!a || !b || a.type !== b.type || a.media == null || a.media !== b.media) return false;
      if (a.in == null) return true; // photos, GIFs
      return (a.speed || 1) === (b.speed || 1) && Math.abs(sourceTime(a, a.start + a.dur) - (b.in || 0)) < 0.02;
    };
    const [left, right] = pieces(prev, clip) ? [prev, clip] : pieces(clip, next) ? [clip, next] : [null, null];
    if (!left) return { error: "different" };
    if (left.kf || right.kf) {
      const off = right.start - left.start;
      const a = left.kf || [{ t: 0, v: keyValues(left), ease: "linear" }];
      const b = (right.kf || [{ t: 0, v: keyValues(right), ease: "linear" }]).map((k) => ({ ...k, v: { ...k.v }, t: k.t + off }));
      // (at the joint both pieces have a key with the same values: the right one's stays)
      const all = a.concat(b).sort((x, y) => x.t - y.t);
      left.kf = all.filter((k, i) => i === all.length - 1 || all[i + 1].t - k.t > 1e-6);
    }
    left.dur = right.start + right.dur - left.start;
    if (right.fadeOut != null) left.fadeOut = right.fadeOut;
    deleteClip(p, right.id);
    return { clip: left, removed: right.id };
  }

  // Ripple insert: a new clip of the media at time t on the track; a clip there is split at t and
  // everything on the track from t on moves right by the new clip's length. Returns the clip.
  function insertMedia(p, mediaId, trackId, t) {
    const span = p.clips.find((c) => c.track === trackId && t > c.start + EPS && t < c.start + c.dur - EPS);
    if (span && !splitClip(p, span.id, t)) {
      // Too close to an edge to split: insert at that edge instead.
      t = t - span.start < span.start + span.dur - t ? span.start : span.start + span.dur;
    }
    const still = p.media[mediaId].kind === "image" || p.media[mediaId].kind === "gif";
    const clip = mediaClip(p, mediaId, { track: trackId, start: t, dur: still ? STILL_DUR : null });
    for (const c of p.clips) if (c.track === trackId && c.start >= t - EPS) c.start += clip.dur;
    p.clips.push(clip);
    return clip;
  }

  // ---- keyframes ----------------------------------------------------------------------------------
  // clip.kf = [{ t (seconds from the clip's start), v: { the animated values }, ease }], sorted by t.
  // ease: how the values travel to the next keyframe: "linear" | "ease" | "in" | "out" | "inout" |
  // "hold" | { bezier: [x1, y1, x2, y2] } (CSS cubic-bezier).
  const KF_EASES = [
    { id: "linear", label: "Linear" },
    { id: "ease", label: "Ease" },
    { id: "in", label: "Ease in" },
    { id: "out", label: "Ease out" },
    { id: "inout", label: "Ease in-out" },
    { id: "hold", label: "Hold" },
  ];
  const BEZIERS = { ease: [0.25, 0.1, 0.25, 1], in: [0.42, 0, 1, 1], out: [0, 0, 0.58, 1], inout: [0.42, 0, 0.58, 1] };

  // A CSS-style cubic Bézier timing curve through (0,0), (x1,y1), (x2,y2), (1,1): f(u) for u in 0-1.
  function cubicBezier(x1, y1, x2, y2) {
    const bx = (s) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
    const by = (s) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
    const dx = (s) => 3 * x1 * (1 - s) ** 2 + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s;
    return (u) => {
      if (u <= 0) return 0;
      if (u >= 1) return 1;
      // Newton-Raphson on x(s) = u, then bisection if it didn't settle.
      let s = u;
      for (let i = 0; i < 8; i++) {
        const err = bx(s) - u;
        if (Math.abs(err) < 1e-7) return by(s);
        const d = dx(s);
        if (Math.abs(d) < 1e-6) break;
        s -= err / d;
      }
      let lo = 0;
      let hi = 1;
      s = u;
      for (let i = 0; i < 40; i++) {
        const x = bx(s);
        if (Math.abs(x - u) < 1e-7) break;
        if (x < u) lo = s;
        else hi = s;
        s = (lo + hi) / 2;
      }
      return by(s);
    };
  }

  const easeCache = new Map();
  function easeFn(ease) {
    if (!ease || ease === "linear") return (u) => u;
    if (ease === "hold") return (u) => (u < 1 ? 0 : 1);
    const pts = typeof ease === "object" && Array.isArray(ease.bezier) ? ease.bezier : BEZIERS[ease];
    if (!pts) return (u) => u;
    const key = pts.join(",");
    if (!easeCache.has(key)) easeCache.set(key, cubicBezier(...pts.map(Number)));
    return easeCache.get(key);
  }

  // The values a clip's keyframes animate, by type.
  function kfProps(type) {
    if (VISUAL_MEDIA.has(type)) return ["cx", "cy", "scale", "rotation", "opacity"];
    if (type === "text" || type === "sticker" || type === "asticker") return ["cx", "cy", "size", "rotation", "opacity"];
    if (type === "shape" || type === "blur" || type === "pixelate") return ["cx", "cy", "w", "h", "rotation", "opacity"];
    return [];
  }

  const KF_DEFAULTS = { rotation: 0, opacity: 1, scale: 1 };
  function keyValues(clip) {
    const v = {};
    for (const k of kfProps(clip.type)) v[k] = clip[k] ?? KF_DEFAULTS[k] ?? 0;
    return v;
  }

  // One value at lt seconds into the clip: before the first key its value, after the last its value,
  // in between eased from one key to the next.
  function valueAt(kf, prop, lt) {
    if (!kf.length) return undefined;
    if (lt <= kf[0].t) return kf[0].v[prop];
    const last = kf[kf.length - 1];
    if (lt >= last.t) return last.v[prop];
    let i = 0;
    while (i < kf.length - 2 && kf[i + 1].t <= lt) i++;
    const a = kf[i];
    const b = kf[i + 1];
    const span = b.t - a.t;
    const u = span > 1e-9 ? (lt - a.t) / span : 1;
    const e = easeFn(a.ease)(u);
    const va = a.v[prop];
    const vb = b.v[prop];
    if (va == null || vb == null) return va ?? vb;
    return va + (vb - va) * e;
  }

  // The clip as it is lt seconds in: its animated values filled in (the clip itself without keys).
  function animated(clip, lt) {
    if (!clip || !Array.isArray(clip.kf) || !clip.kf.length) return clip;
    const out = { ...clip };
    for (const prop of kfProps(clip.type)) {
      const v = valueAt(clip.kf, prop, lt);
      if (v != null) out[prop] = v;
    }
    return out;
  }

  // The keyframe at t (within half a frame), or null.
  function kfAt(clip, t, tol = 1 / 60) {
    return (clip.kf || []).find((k) => Math.abs(k.t - t) <= tol) || null;
  }

  // Adds (or updates) the keyframe at t: the given values, else the clip's values there now.
  function addKey(clip, t, values = null, ease = null) {
    const tt = clamp(t, 0, clip.dur);
    const v = { ...keyValues(animated(clip, tt)), ...(values || {}) };
    clip.kf = clip.kf || [];
    let k = kfAt(clip, tt);
    if (k) {
      Object.assign(k.v, v);
      if (ease) k.ease = ease;
      return k;
    }
    // a new key in the middle of a segment eases like that segment
    const before = [...clip.kf].reverse().find((x) => x.t < tt);
    k = { t: tt, v, ease: ease || (before ? before.ease : "inout") };
    clip.kf.push(k);
    clip.kf.sort((a, b) => a.t - b.t);
    return k;
  }

  // Changes the values at t: the keyframe there (made if needed).
  function patchAt(clip, t, patch) {
    const k = addKey(clip, t);
    for (const [key, val] of Object.entries(patch)) if (key in k.v) k.v[key] = val;
    return k;
  }

  function removeKey(clip, index) {
    if (!clip.kf) return;
    clip.kf.splice(index, 1);
    if (!clip.kf.length) delete clip.kf;
  }

  // Moves a keyframe to t (within the clip); returns its new index.
  function moveKey(clip, index, t) {
    const k = clip.kf && clip.kf[index];
    if (!k) return -1;
    k.t = clamp(t, 0, clip.dur);
    clip.kf.sort((a, b) => a.t - b.t);
    return clip.kf.indexOf(k);
  }

  // The keyframes for the part [from, to] of a clip, shifted to start at 0: with the values at the
  // ends when the animation goes on past them (a split, a trim).
  function sliceKeys(clip, from, to) {
    const kf = clip.kf || [];
    if (!kf.length) return [];
    const at = (t) => keyValues(animated(clip, t));
    const easeAt = (t) => {
      let e = kf[0].ease;
      for (const k of kf) if (k.t <= t + 1e-9) e = k.ease;
      return e;
    };
    const out = [];
    if (kf[0].t < from - 1e-6) out.push({ t: 0, v: at(from), ease: easeAt(from) });
    for (const k of kf) if (k.t >= from - 1e-6 && k.t <= to + 1e-6) out.push({ t: Math.max(0, k.t - from), v: { ...k.v }, ease: k.ease });
    if (kf[kf.length - 1].t > to + 1e-6) out.push({ t: to - from, v: at(to), ease: easeAt(to) });
    return out.filter((k, i) => i === 0 || Math.abs(k.t - out[i - 1].t) > 1e-6);
  }

  // ---- joined clips (a video and its detached audio) --------------------------------------------
  // The clip joined to this one (same `link`), or null.
  function partner(p, clip) {
    if (!clip || clip.link == null) return null;
    return p.clips.find((c) => c.id !== clip.id && c.link === clip.link) || null;
  }

  function linkClips(p, aId, bId) {
    const a = clipOf(p, aId);
    const b = clipOf(p, bId);
    if (!a || !b || a === b) return false;
    for (const c of [a, b]) {
      const old = partner(p, c);
      if (old && old !== a && old !== b) delete old.link;
    }
    a.link = b.link = p.nextId++;
    return true;
  }

  function unlink(p, id) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    if (clip) delete clip.link;
    if (other) delete other.link;
    return Boolean(other);
  }

  // A video clip's sound as its own audio clip (same media and timing) on a free audio track, joined
  // to it; the video's own sound goes off (audioOut). Returns the audio clip, or null.
  function detachAudio(p, id) {
    const clip = clipOf(p, id);
    if (!clip || clip.type !== "video" || clip.audioOut) return null;
    const audio = {
      id: p.nextId++,
      track: null,
      start: clip.start,
      dur: clip.dur,
      type: "audio",
      media: clip.media,
      in: clip.in || 0,
      speed: clip.speed || 1,
      volume: clip.volume ?? 1,
      muted: Boolean(clip.muted),
      fadeIn: clip.fadeIn || 0,
      fadeOut: clip.fadeOut || 0,
    };
    placeClip(p, audio);
    clip.audioOut = true;
    linkClips(p, clip.id, audio.id);
    return audio;
  }

  // Puts the sound back in the video: its joined audio clip is deleted.
  function reattachAudio(p, id) {
    const clip = clipOf(p, id);
    const video = clip && clip.type === "video" ? clip : partner(p, clip);
    if (!video || video.type !== "video") return false;
    const audio = partner(p, video);
    if (audio && audio.type === "audio") deleteClip(p, audio.id);
    delete video.link;
    video.audioOut = false;
    return true;
  }

  // Splits a clip and, when it's joined, its partner at the same time (the right pieces joined).
  // Returns the right pieces.
  function splitLinked(p, id, t) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    const right = splitClip(p, id, t);
    const right2 = other ? splitClip(p, other.id, t) : null;
    if (right && right2) right.link = right2.link = p.nextId++;
    return [right, right2].filter(Boolean);
  }

  function deleteLinked(p, id) {
    const other = partner(p, clipOf(p, id));
    deleteClip(p, id);
    if (other) deleteClip(p, other.id);
  }

  // Moves a clip (and its partner by the same time; the partner keeps its track). False if either
  // can't go there.
  function moveLinked(p, id, start, trackId) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    if (!clip) return false;
    const s = Math.max(0, start);
    if (other) {
      const os = other.start + (s - clip.start);
      const tr = trackOf(p, other.track);
      if (os < -EPS || (tr && tr.locked) || !fits(p, other.track, os, other.dur, other.id)) return false;
      if (!moveClip(p, id, s, trackId)) return false;
      other.start = Math.max(0, os);
      return true;
    }
    return moveClip(p, id, s, trackId);
  }

  // Trims a clip; its partner too when that edge lines up with it.
  function trimLinked(p, id, edge, t) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    const aligned = other && (edge === "left" ? Math.abs(other.start - clip.start) < 1e-3 : Math.abs(other.start + other.dur - clip.start - clip.dur) < 1e-3);
    const ok = trimClip(p, id, edge, t);
    if (ok && aligned) trimClip(p, other.id, edge, edge === "left" ? clip.start : clip.start + clip.dur);
    return ok;
  }

  // A copy right after it, and of its partner (joined to each other).
  function duplicateLinked(p, id) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    const copy = duplicateClip(p, id);
    if (!copy) return null;
    delete copy.link;
    if (other) {
      const c2 = clone(other);
      c2.id = p.nextId++;
      delete c2.link;
      c2.start = other.start + (copy.start - clip.start);
      placeClip(p, c2, { track: other.track });
      linkClips(p, copy.id, c2.id);
    }
    return copy;
  }

  // Merges a clip with its touching piece, and its partner with the partner piece.
  function mergeLinked(p, id) {
    const clip = clipOf(p, id);
    const other = partner(p, clip);
    const touching = [clip, prevOnTrack(p, clip), nextOnTrack(p, clip)].filter(Boolean);
    const res = mergeClips(p, id);
    if (res.error || !other) return res;
    const removedLink = (touching.find((c) => c.id === res.removed) || {}).link;
    const otherPiece = removedLink != null ? p.clips.find((c) => c.link === removedLink) : null;
    if (otherPiece) {
      const keepLink = res.clip.link;
      const r2 = mergeClips(p, otherPiece.id);
      if (!r2.error) r2.clip.link = keepLink;
    }
    return res;
  }

  // Moves every clip on these tracks by dt seconds (clamped so none starts before 0); joined
  // partners on other tracks move too when they fit. Returns the dt applied.
  function shiftTracks(p, trackIds, dt) {
    const ids = new Set(trackIds);
    const on = p.clips.filter((c) => ids.has(c.track));
    if (!on.length || !dt) return 0;
    const d = Math.max(dt, -Math.min(...on.map((c) => c.start)));
    if (Math.abs(d) < EPS) return 0;
    const moved = new Set(on.map((c) => c.id));
    const extra = [];
    for (const c of on) {
      const o = partner(p, c);
      if (o && !moved.has(o.id) && !extra.includes(o)) extra.push(o);
    }
    for (const c of on) c.start += d;
    for (const o of extra) {
      const tr = trackOf(p, o.track);
      if (o.start + d >= -EPS && !(tr && tr.locked) && fits(p, o.track, o.start + d, o.dur, o.id)) o.start = Math.max(0, o.start + d);
    }
    return d;
  }

  // Moves these clips (and their joined partners) by dt seconds, keeping their tracks. push: the
  // clips in their way on those tracks are pushed along (chained; nothing before 0:00); stop: they
  // stop at 0:00 and against the clips next to them; else the move is all or nothing. Returns the
  // dt applied.
  function shiftClips(p, clipIds, dt, { stop = true, push = false } = {}) {
    const moving = new Set(clipIds);
    for (const id of clipIds) {
      const o = partner(p, clipOf(p, id));
      const tr = o && trackOf(p, o.track);
      if (o && !(tr && tr.locked)) moving.add(o.id);
    }
    const list = p.clips.filter((c) => moving.has(c.id));
    if (!list.length || !dt) return 0;
    if (push) return pushClips(p, list, moving, dt);
    const still = p.clips.filter((c) => !moving.has(c.id));
    let d = dt;
    if (stop) {
      d = Math.max(d, -Math.min(...list.map((c) => c.start)));
      for (const c of list) {
        for (const o of still) {
          if (o.track !== c.track) continue;
          if (d > 0 && o.start >= c.start + c.dur - EPS) d = Math.min(d, o.start - (c.start + c.dur));
          if (d < 0 && o.start + o.dur <= c.start + EPS) d = Math.max(d, o.start + o.dur - c.start);
        }
      }
    } else if (list.some((c) => c.start + d < -EPS || still.some((o) => o.track === c.track && c.start + d < o.start + o.dur - EPS && o.start < c.start + d + c.dur - EPS))) {
      return 0;
    }
    if (Math.abs(d) < EPS) return 0;
    for (const c of list) c.start = Math.max(0, c.start + d);
    return d;
  }

  // shiftClips with push: on each track of the moving clips, a sweep in the direction of the move
  // puts each clip after (or before) the one it would run into. The new positions are linear in dt,
  // so a move that would take something before 0:00 is shortened by that much.
  function pushClips(p, list, moving, dt) {
    const tracks = [...new Set(list.map((c) => c.track))];
    const plan = (d) => {
      const out = new Map();
      for (const tid of tracks) {
        const on = p.clips.filter((c) => c.track === tid);
        if (d > 0) {
          on.sort((a, b) => a.start - b.start);
          let edge = -Infinity;
          for (const c of on) {
            let s = c.start;
            if (moving.has(c.id)) s = c.start + d;
            else if (edge > c.start + EPS) s = edge;
            if (s !== c.start) out.set(c, s);
            edge = Math.max(edge, s + c.dur);
          }
        } else {
          on.sort((a, b) => b.start + b.dur - (a.start + a.dur));
          let edge = Infinity;
          for (const c of on) {
            let e = c.start + c.dur;
            if (moving.has(c.id)) e += d;
            else if (edge < e - EPS) e = edge;
            const s = e - c.dur;
            if (s !== c.start) out.set(c, s);
            edge = Math.min(edge, s);
          }
        }
      }
      return out;
    };
    let d = dt;
    let out = plan(d);
    for (let i = 0; i < 3 && d < 0; i++) {
      const low = Math.min(0, ...[...out.values()]);
      if (low >= -EPS) break;
      d -= low;
      out = plan(d);
    }
    if (d < 0 && Math.min(0, ...[...out.values()]) < -EPS) return 0;
    if (Math.abs(d) < EPS || !out.size) return 0;
    const pushed = [];
    for (const [c, s] of out) {
      if (!moving.has(c.id)) pushed.push([c, s - c.start]);
      c.start = Math.max(0, s);
    }
    // A pushed clip's joined partner (on another track) comes along when it fits there.
    for (const [c, delta] of pushed) {
      const o = partner(p, c);
      if (!o || moving.has(o.id) || out.has(o)) continue;
      const tr = trackOf(p, o.track);
      if (!(tr && tr.locked) && fits(p, o.track, o.start + delta, o.dur, o.id)) o.start = Math.max(0, o.start + delta);
    }
    return d;
  }

  // Moves these clips to other tracks (targetOf(clip) -> track id; joined partners keep theirs).
  // All or nothing: each target must take the clip's kind, be unlocked and be free there (the
  // moving clips aside). Returns true when they moved.
  function moveClipsToTracks(p, ids, targetOf) {
    const moving = ids.map((id) => clipOf(p, id)).filter(Boolean);
    if (!moving.length) return false;
    const away = new Set(moving.map((c) => c.id));
    const plan = moving.map((c) => [c, targetOf(c)]);
    for (const [c, tid] of plan) {
      const tr = trackOf(p, tid);
      if (!tr || tr.locked || tr.kind !== trackKindFor(c.type)) return false;
    }
    for (const [c, tid] of plan) {
      const clash = p.clips.some((o) => o.track === tid && !away.has(o.id) && c.start < o.start + o.dur - EPS && o.start < c.start + c.dur - EPS);
      // the moving clips among themselves: two landing on the same track mustn't overlap
      const self = plan.some(([o, t2]) => o !== c && t2 === tid && c.start < o.start + o.dur - EPS && o.start < c.start + c.dur - EPS);
      if (clash || self) return false;
    }
    for (const [c, tid] of plan) c.track = tid;
    return true;
  }

  function deleteClip(p, id) {
    p.clips = p.clips.filter((c) => c.id !== id);
  }

  // A copy right after it on its track (or a new track).
  function duplicateClip(p, id) {
    const clip = clipOf(p, id);
    if (!clip) return null;
    const copy = clone(clip);
    copy.id = p.nextId++;
    copy.start = clip.start + clip.dur;
    return placeClip(p, copy, { track: clip.track });
  }

  // ---- geometry -------------------------------------------------------------------------------
  // The source turned by the crop's quarter turns: its size.
  function orientedSize(media, crop) {
    return crop.rot % 2 ? [media.h, media.w] : [media.w, media.h];
  }

  // The cropped source in pixels.
  function cropPixels(media, crop) {
    const [ow, oh] = orientedSize(media, crop);
    return [Math.max(1, crop.w * ow), Math.max(1, crop.h * oh)];
  }

  // A media clip's box on a canvas of W × H (pixels): the crop fitted inside the canvas × scale.
  function mediaBox(p, clip, W, H) {
    const m = p.media[clip.media];
    const [cw, ch] = cropPixels(m, clip.crop);
    const fit = Math.min(W / cw, H / ch);
    return { w: cw * fit * clip.scale, h: ch * fit * clip.scale };
  }

  // The scale at which a media clip covers the whole canvas.
  function fillScale(p, clip) {
    const box = mediaBox(p, { ...clip, scale: 1 }, p.w, p.h);
    return Math.max(p.w / box.w, p.h / box.h);
  }

  // The biggest crop of a ratio (width / height, in pixels), centred on the current crop's centre.
  function cropForRatio(crop, media, ratio) {
    const [ow, oh] = orientedSize(media, crop);
    let w = ow;
    let h = w / ratio;
    if (h > oh) {
      h = oh;
      w = h * ratio;
    }
    const fw = w / ow;
    const fh = h / oh;
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    return { ...crop, aspect: "free", w: fw, h: fh, x: clamp(cx - fw / 2, 0, 1 - fw), y: clamp(cy - fh / 2, 0, 1 - fh) };
  }

  // Scales and centres a clip whose crop has its region's shape so it fills the region.
  function layoutInRegion(p, clip, r) {
    const ratio = (r.w * p.w) / (r.h * p.h);
    // At scale 1 the crop fits the canvas: across its width when it's wider than the canvas.
    clip.scale = ratio >= p.w / p.h ? r.w : r.h;
    clip.cx = r.x + r.w / 2;
    clip.cy = r.y + r.h / 2;
    clip.rotation = 0;
  }

  // Fills a region of the canvas ({ x, y, w, h }, fractions) with a visual media clip: cropped to
  // the region's shape, scaled to it and centred in it (split screens, picture in picture). The
  // clip keeps the region, so it follows a change of the canvas size.
  function fitInRegion(p, clip, region) {
    const m = p.media[clip.media];
    if (!m || !clip.crop) return false;
    clip.region = { x: region.x, y: region.y, w: region.w, h: region.h };
    delete clip.boxZoom;
    delete clip.boxPan;
    clip.crop = cropForRatio(clip.crop, m, (region.w * p.w) / (region.h * p.h));
    layoutInRegion(p, clip, clip.region);
    return true;
  }

  // The smallest a picture gets in its split-screen box (× the size that covers the box).
  const BOX_ZOOM_MIN = 0.25;

  // Lays a clip out again from its region (after the canvas or the region changed), keeping how far
  // its picture is zoomed in and where the picture is centred. Zoomed out (boxZoom < 1): the whole
  // picture, boxZoom × the size that covers the box, moved by boxPan (× the box), shown only inside
  // the box (render.js masks it).
  function refitRegion(p, clip) {
    const m = p.media[clip.media];
    const r = clip.region;
    if (!m || !r || !clip.crop) return false;
    const cr = clip.crop;
    if (clip.boxZoom != null && clip.boxZoom < 1) {
      clip.crop = { ...cr, aspect: "free", x: 0, y: 0, w: 1, h: 1 };
      const [ow, oh] = orientedSize(m, clip.crop);
      const fit = Math.min(p.w / ow, p.h / oh); // the picture at scale 1
      const cover = Math.max((r.w * p.w) / (ow * fit), (r.h * p.h) / (oh * fit));
      clip.boxZoom = clamp(clip.boxZoom, BOX_ZOOM_MIN, 1);
      clip.scale = cover * clip.boxZoom;
      const pan = clip.boxPan || { x: 0, y: 0 };
      clip.cx = r.x + r.w / 2 + pan.x * r.w;
      clip.cy = r.y + r.h / 2 + pan.y * r.h;
      clip.rotation = 0;
      return true;
    }
    const [ow, oh] = orientedSize(m, cr);
    const whole = { ...cr, x: 0, y: 0, w: 1, h: 1 };
    const fullOld = cropForRatio(whole, m, (cr.w * ow) / Math.max(1e-9, cr.h * oh));
    const zoom = clamp(cr.w / Math.max(1e-9, fullOld.w), 0.01, 1);
    const fullNew = cropForRatio(whole, m, (r.w * p.w) / (r.h * p.h));
    const w = fullNew.w * zoom;
    const h = fullNew.h * zoom;
    const cx = cr.x + cr.w / 2;
    const cy = cr.y + cr.h / 2;
    clip.crop = { ...cr, aspect: "free", w, h, x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h) };
    layoutInRegion(p, clip, r);
    return true;
  }

  function refitAll(p) {
    for (const c of p.clips) if (c.region && c.crop) refitRegion(p, c);
  }

  // The crop rectangle (fractions of the oriented source) for an aspect ratio: the biggest one,
  // centred on the current crop's centre.
  function cropForAspect(crop, media, aspectId) {
    const [ow, oh] = orientedSize(media, crop);
    const def = ASPECTS.find((a) => a.id === aspectId) || ASPECTS[0];
    if (!def.ratio) return { ...crop, aspect: def.id };
    const ratio = def.ratio === "original" ? ow / oh : def.ratio;
    let w = ow;
    let h = w / ratio;
    if (h > oh) {
      h = oh;
      w = h * ratio;
    }
    const fw = w / ow;
    const fh = h / oh;
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    return { ...crop, aspect: def.id, w: fw, h: fh, x: clamp(cx - fw / 2, 0, 1 - fw), y: clamp(cy - fh / 2, 0, 1 - fh) };
  }

  function aspectRatioOf(crop, media) {
    const def = ASPECTS.find((a) => a.id === crop.aspect);
    if (!def || !def.ratio) return null;
    const [ow, oh] = orientedSize(media, crop);
    return def.ratio === "original" ? ow / oh : def.ratio;
  }

  // Turns the crop with a quarter turn of the source (dir ±1).
  function turnCrop(crop, dir) {
    const c = { ...crop, rot: (crop.rot + dir + 4) % 4 };
    return Object.assign(c, dir > 0 ? { x: 1 - crop.y - crop.h, y: crop.x, w: crop.h, h: crop.w } : { x: crop.y, y: 1 - crop.x - crop.w, w: crop.h, h: crop.w });
  }

  // How much the image is enlarged so a straightened (rotated) image still covers the crop.
  function straightenZoom(cropW, cropH, ow, oh, angleDeg) {
    const a = (Math.abs(angleDeg) * Math.PI) / 180;
    if (!a) return 1;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return Math.max(1, (cropW * cos + cropH * sin) / ow, (cropW * sin + cropH * cos) / oh);
  }

  // Sets the canvas size by preset ("original" = the opened item's) or to w × h.
  function setCanvas(p, presetId, w, h) {
    const pre = CANVAS_PRESETS.find((c) => c.id === presetId);
    if (pre && pre.id === "original") Object.assign(p, { w: p.original.w, h: p.original.h });
    else if (pre) Object.assign(p, { w: pre.w, h: pre.h });
    else Object.assign(p, { w: clamp(Math.round(w), 16, 8192), h: clamp(Math.round(h), 16, 8192) });
    // Split-screen boxes keep their place in the layout.
    refitAll(p);
  }

  // An output size for a scale; even sizes (video encoders want them).
  function outputSize(p, scale = 1, even = false) {
    let w = Math.max(1, Math.round(p.w * scale));
    let h = Math.max(1, Math.round(p.h * scale));
    if (even) {
      w -= w % 2;
      h -= h % 2;
    }
    return { width: Math.max(2, w), height: Math.max(2, h) };
  }

  function scaleForMax(p, maxSide) {
    if (!maxSide) return 1;
    return Math.min(1, maxSide / Math.max(p.w, p.h));
  }

  // ---- colour tables --------------------------------------------------------------------------
  // How much a hue (degrees) belongs to each band: a smooth bump around the band's centre, reaching
  // the neighbours' centres; the weights add up to 1.
  function hslWeights(hue) {
    const h = ((hue % 360) + 360) % 360;
    const centres = HSL_BANDS.map((b) => b.hue);
    const weights = new Array(centres.length).fill(0);
    for (let i = 0; i < centres.length; i++) {
      const a = centres[i];
      const b = i + 1 < centres.length ? centres[i + 1] : centres[0] + 360;
      let x = h;
      if (x < a) x += 360;
      if (x >= a && x <= b) {
        const t = (x - a) / (b - a);
        const s = t * t * (3 - 2 * t);
        weights[i] += 1 - s;
        weights[(i + 1) % centres.length] += s;
        break;
      }
    }
    return weights;
  }

  // Levels as a 0..255 table.
  function levelsTable(levels) {
    const { inBlack = 0, inWhite = 255, gamma = 1, outBlack = 0, outWhite = 255 } = levels || {};
    const table = new Uint8Array(256);
    const span = Math.max(1, inWhite - inBlack);
    for (let i = 0; i < 256; i++) {
      const x = clamp((i - inBlack) / span, 0, 1);
      const y = Math.pow(x, 1 / clamp(gamma, 0.1, 10));
      table[i] = Math.round(clamp(outBlack + y * (outWhite - outBlack), 0, 255));
    }
    return table;
  }

  // The per-channel tables, as the viewer's filters do them (auto levels, exposure, temperature,
  // tint, shadows / highlights, curves: igfvChannelLuts), then levels, then whites / blacks.
  function channelTables(adjust) {
    const base = typeof igfvChannelLuts === "function" ? igfvChannelLuts(adjust) : null;
    const lv = levelsTable(adjust.levels);
    const w = (adjust.whites || 0) / 100;
    const b = (adjust.blacks || 0) / 100;
    const out = {};
    for (const ch of ["r", "g", "b"]) {
      const t = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        let x = lv[base ? base[ch][i] : i] / 255;
        if (w) x += w * 0.25 * x * x * x;
        if (b) x += b * 0.2 * (1 - x) * (1 - x) * (1 - x);
        t[i] = Math.round(clamp(x, 0, 1) * 255);
      }
      out[ch] = t;
    }
    return out;
  }

  function tablesNeutral(tables) {
    for (const ch of ["r", "g", "b"]) for (let i = 0; i < 256; i++) if (tables[ch][i] !== i) return false;
    return true;
  }

  // Blends a preset into the adjustments by intensity (0..1).
  function mixPreset(adjust, preset, t) {
    const out = clone(adjust);
    const target = { ...(typeof igfvFxDefaults === "function" ? igfvFxDefaults() : {}), ...(preset || {}) };
    for (const [key, value] of Object.entries(target)) {
      if (typeof value === "number" && typeof out[key] === "number") out[key] = out[key] + (value - out[key]) * t;
    }
    if (target.curves && t >= 0.5) out.curves = clone(target.curves);
    return out;
  }

  function adjustIsNeutral(adjust) {
    return JSON.stringify(adjust) === JSON.stringify(defaultAdjust(null));
  }

  // ---- history ---------------------------------------------------------------------------------
  // Snapshots of the whole project (small: no pixels). The same mergeKey in a row is one step.
  class History {
    constructor(doc, limit = 100) {
      this.limit = limit;
      this.past = [];
      this.future = [];
      this.doc = doc;
      this.mergeKey = null;
      this.changed = false;
    }
    change(fn, mergeKey = null) {
      if (!(mergeKey && mergeKey === this.mergeKey)) {
        this.past.push(clone(this.doc));
        if (this.past.length > this.limit) this.past.shift();
      }
      this.mergeKey = mergeKey;
      this.future = [];
      fn(this.doc);
      this.changed = true;
      return this.doc;
    }
    endMerge() {
      this.mergeKey = null;
    }
    canUndo() {
      return this.past.length > 0;
    }
    canRedo() {
      return this.future.length > 0;
    }
    undo() {
      if (!this.past.length) return this.doc;
      this.future.push(clone(this.doc));
      this.doc = this.past.pop();
      this.mergeKey = null;
      return this.doc;
    }
    redo() {
      if (!this.future.length) return this.doc;
      this.past.push(clone(this.doc));
      this.doc = this.future.pop();
      this.mergeKey = null;
      return this.doc;
    }
  }

  return {
    ASPECTS,
    CANVAS_PRESETS,
    HSL_BANDS,
    SPEEDS,
    STILL_DUR,
    MEDIA_TYPES,
    VISUAL_MEDIA,
    EFFECT_GROUPS,
    EFFECTS,
    TRANSITION_GROUPS,
    TRANSITIONS,
    TRANSITION_DEFAULT_DUR,
    STICKER_ANIMS,
    effectDef,
    makeEffect,
    effectAnimated,
    adjustClip,
    normalizeProject,
    prevOnTrack,
    nextOnTrack,
    transInfo,
    visualSpan,
    transitionAt,
    clamp,
    clone,
    defaultAdjust,
    createProject,
    addMedia,
    addBin,
    renameBin,
    removeBin,
    moveMedia,
    mediaUsed,
    removeMedia,
    mediaInBin,
    mediaBySource,
    addTrack,
    removeTrack,
    tracksOf,
    trackOf,
    clipOf,
    trackKindFor,
    duration,
    isStill,
    mediaClip,
    fits,
    placeClip,
    activeClips,
    sourceTime,
    maxDur,
    clipGain,
    snap,
    snapPoints,
    moveClip,
    trimClip,
    splitClip,
    mergeClips,
    insertMedia,
    partner,
    linkClips,
    unlink,
    detachAudio,
    reattachAudio,
    splitLinked,
    deleteLinked,
    moveLinked,
    trimLinked,
    duplicateLinked,
    mergeLinked,
    shiftTracks,
    shiftClips,
    moveClipsToTracks,
    deleteClip,
    duplicateClip,
    orientedSize,
    cropPixels,
    mediaBox,
    fillScale,
    cropForRatio,
    fitInRegion,
    refitRegion,
    refitAll,
    BOX_ZOOM_MIN,
    KF_EASES,
    cubicBezier,
    easeFn,
    kfProps,
    keyValues,
    valueAt,
    animated,
    kfAt,
    addKey,
    patchAt,
    removeKey,
    moveKey,
    sliceKeys,
    cropForAspect,
    aspectRatioOf,
    turnCrop,
    straightenZoom,
    setCanvas,
    outputSize,
    scaleForMax,
    hslWeights,
    levelsTable,
    channelTables,
    tablesNeutral,
    mixPreset,
    adjustIsNeutral,
    History,
  };
})();
