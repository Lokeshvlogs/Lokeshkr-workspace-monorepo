// The editor: a project editor over the viewer, laid out like DaVinci Resolve. Media bin and imports
// (Favorites, History, files) on the left, the canvas in the middle, the inspector on the right, the
// multi-track timeline at the bottom. Edits live in a project (IgfvEditor.Model) with undo / redo;
// IgfvEditor.Render draws it, IgfvEditor.Engine plays it; export downloads the result.
//
// IgfvEditor.open({ kind: "image" | "video", blob, fx, rotation, name, host, presets, sources, save,
//                   toast, onClose, title, topBar, startTab, maxMedia, desktopUrl })
//   blob: the item to open; without one the editor starts with an empty 9:16 project.
//   sources: { favorites(), history(before, search), loadPost(code), fetchBlob(url) } for importing;
//     linksOnly: Favorites / History are links that can't be imported (open them on Instagram);
//     signIn(): shown on those tabs when they report signedOut.
//   drafts: { list(), save(draft), load(id), rename(id, name), remove(id) }.
//   maxMedia: { long, short } in pixels: larger media is refused, pointing to desktopUrl.
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

(() => {
  const M = IgfvEditor.Model;
  const L = IgfvEditor.Layers;
  const E = IgfvEditor.Engine;
  const T = IgfvEditor.Timeline;
  const TP = IgfvEditor.Templates;

  // ---- small DOM helpers -----------------------------------------------------------------------------
  function el(tag, cls, props = {}) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(props)) {
      if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    return node;
  }

  function button(label, cls, onClick, title = "") {
    const b = el("button", `igfv-ed-btn ${cls || ""}`, { type: "button", text: label });
    if (title) b.title = title;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick(e);
    });
    return b;
  }

  const TOOLS = [
    { id: "select", label: "Select", icon: "↖" },
    { id: "crop", label: "Crop", icon: "⬚" },
    { id: "text", label: "Text", icon: "T" },
    { id: "templates", label: "Templates", icon: "\u25a6" },
    { id: "stickers", label: "Stickers", icon: "☺" },
    { id: "effects", label: "Effects", icon: "fx" },
    { id: "transitions", label: "Transitions", icon: "\u21c4" },
    { id: "draw", label: "Draw", icon: "✎" },
    { id: "shapes", label: "Shapes", icon: "▢" },
    { id: "retouch", label: "Retouch", icon: "✦" },
  ];

  const MEDIA_ICON = { video: "▶", image: "▣", audio: "♫", gif: "\u25ce" };

  const EMOJI = {
    Smileys: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😜 🤪 😎 🤩 🥳 😏 😒 😔 😢 😭 😤 😡 🤯 😱 🤔 🤫 🙄 😴 🤤 😷 🤠 🥺 😈 💀 👻 👽 🤖 💩",
    Hearts: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💯 ✨ ⭐ 🌟 💫 🔥 💥 💢 💦 💨",
    Hands: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 👋 👏 🙌 🙏 💪 🤝 ✍️ 💅",
    Animals: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐍 🐙 🐬 🐳 🦈 🌸 🌹 🌻 🌷 🌴 🍀 🍁",
    Food: "🍎 🍓 🍒 🍑 🍍 🥥 🥑 🍕 🍔 🍟 🌭 🍿 🥐 🍩 🍪 🎂 🍰 🍫 🍬 🍭 ☕ 🍵 🍺 🍷 🍸 🥂 🍾",
    Travel: "✈️ 🚗 🚲 🛵 🚀 ⛵ 🏖️ 🏝️ 🏔️ 🌋 🗽 🗼 🏰 🎡 🌅 🌄 🌃 🌈 ☀️ 🌙 ⛅ ❄️ ☔ ⚡ 🌊",
    Objects: "📷 🎥 🎬 🎧 🎤 🎸 🎹 🎮 📱 💻 ⌚ 💡 📚 ✏️ 🎁 🎈 🎉 🎊 🏆 🥇 ⚽ 🏀 🎯 💎 💍 👑 🕶️ 👟 👗 💄",
    Symbols: "✅ ❌ ⭕ ❗ ❓ ➡️ ⬅️ ⬆️ ⬇️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🔺 🔻 ♻️ ⚠️ 🚫 🔞 🆕 🆒 🆗 🔝 💲 #️⃣",
  };

  let S = null; // the open editor's state

  IgfvEditor.isOpen = () => Boolean(S);
  // Edits not saved as a draft or exported (the page warns before it's left).
  IgfvEditor.isDirty = () => dirty();
  // For tests and debugging: the open project, its engine and timeline.
  IgfvEditor.debug = {
    project: () => S && S.history && S.history.doc,
    engine: () => S && S.engine,
    timeline: () => S && S.timeline,
    select: (id) => S && select(id),
  };

  // ---- open / close -----------------------------------------------------------------------------------
  IgfvEditor.open = async function open(opts) {
    if (S) return;
    S = {
      opts,
      media: new Map(), // media id -> { blob, url, bitmap?, kind, thumbs? }
      preview: null, // the media previewed on the stage: { entry, panel, media }
      trackSel: new Set(), // selected track rows (moved together in time)
      transPick: null, // a clip whose transition was clicked on the timeline (Del removes the transition)
      clipSel: new Set(), // several selected clips (Ctrl+click on the timeline); empty: just S.selected
      focus: "canvas", // where the arrow keys go: "canvas" (nudge the item) or "timeline" (move tracks)
      blade: false, // the Blade (cut) tool on the timeline
      previewItems: new Map(), // post code -> its items (for previews)
      previewCache: new Map(), // "code:index" -> { blob, url } downloaded for a preview
      tool: "select",
      selected: null,
      zoom: "fit",
      pan: [0, 0],
      raf: 0,
      snap: true,
      push: false, // moving clips pushes the clips in their way along (Alt flips it while dragging)
      srcTab: opts.startTab || "favorites",
      srcQuery: "",
      favCat: null,
      currentBin: null, // the media pool's open bin (null = Master)
      clean: false, // saved as a draft or exported since the last change
      renderer: new IgfvEditor.Render.Renderer(),
      brush: { mode: "pen", size: 0.012, hardness: 1, color: "#ffffff", opacity: 1 },
      retouch: { mode: "blur", size: 0.05, strength: 50, shape: "rect", cloneFrom: null },
      shape: { shape: "rect", fill: "", stroke: "#ffffff", strokeWidth: 0.008 },
      hslBand: "red",
      curveChannel: "rgb",
      emojiCat: "Smileys",
      emojiQuery: "",
      presetAmount: 100,
      exporting: null,
      frameSeed: 0,
      history: null,
      favData: null,
      histRows: null,
      draftId: null,
      draftName: "",
    };
    try {
      buildShell();
      if (!opts.blob) {
        S.history = new M.History(M.createProject({}));
        S.engine = makeEngine();
        buildTimeline();
        S.history.changed = false;
        if (!S.renderer.advanced) toast("Some adjustments (HSL, split toning, clarity, grain) need WebGL, which isn't available here.");
        setTool("select");
        await S.engine.seek(0);
        afterChange(true);
        return;
      }
      showStatus("Loading…");
      const url = URL.createObjectURL(opts.blob);
      const info = await E.probe(opts.blob, url, opts.name || "");
      if (!S) return;
      checkSize(info);
      const project = M.createProject({
        media: { kind: info.kind, name: displayName(opts.name), w: info.w, h: info.h, duration: info.duration, size: opts.blob.size, type: opts.blob.type, hasAudio: info.hasAudio ?? null },
        fx: opts.fx,
        rotation: opts.rotation,
      });
      S.history = new M.History(project);
      const mediaId = Number(Object.keys(project.media)[0]);
      S.media.set(mediaId, { blob: opts.blob, url, bitmap: info.bitmap || null, kind: info.kind });
      S.engine = makeEngine();
      buildTimeline();
      makeThumbs(mediaId);
      S.history.changed = false;
      showStatus("");
      if (!S.renderer.advanced) toast("Some adjustments (HSL, split toning, clarity, grain) need WebGL, which isn't available here.");
      setTool("select");
      await S.engine.seek(0);
      afterChange(true);
    } catch (err) {
      console.debug("[igfv] editor failed to open", err);
      const message = (err && err.message) || "The editor couldn't open this";
      close(true);
      if (opts.toast) opts.toast(message);
    }
  };

  function makeEngine() {
    return new E.Engine({
      project: () => S.history.doc,
      mediaUrl: (id) => (S.media.get(id) || {}).url,
      onFrame: () => {
        requestRender();
        updateTransport();
        // A keyframed clip's panel shows its values at the playhead: refreshed once scrubbing pauses.
        const c = S && S.selected != null ? selectedClip() : null;
        if (c && c.kf && c.kf.length && !(S.engine && S.engine.playing)) {
          clearTimeout(S.kfPanelTimer);
          S.kfPanelTimer = setTimeout(() => S && !S.drag && renderInspector(), 200);
        }
      },
    });
  }

  function displayName(name) {
    return String(name || "Untitled").replace(/\.[a-z0-9]+$/i, "");
  }

  function close(force = false) {
    if (!S) return;
    if (!force && dirty()) {
      confirmModal("Discard your edits?", "Your changes haven't been saved as a draft or exported.", "Discard", () => close(true));
      return;
    }
    const st = S;
    S = null;
    cancelAnimationFrame(st.raf);
    if (st.exporting) st.exporting.cancelled = true;
    if (st.engine) st.engine.destroy();
    for (const m of st.media.values()) {
      if (m.bitmap && m.bitmap.close) m.bitmap.close();
      URL.revokeObjectURL(m.url);
    }
    if (st.preview && st.preview.media && st.preview.media.pause) st.preview.media.pause();
    for (const c of st.previewCache.values()) URL.revokeObjectURL(c.url);
    st.root.remove();
    window.removeEventListener("keydown", st.onKey, true);
    window.removeEventListener("resize", st.onResize);
    if (st.opts.onClose) st.opts.onClose();
  }
  IgfvEditor.close = close;

  // ---- project helpers ------------------------------------------------------------------------------------
  const proj = () => S.history.doc;
  // Changes not saved as a draft or exported yet.
  const dirty = () => Boolean(S && S.history && S.history.changed && !S.clean);
  const now = () => (S.engine ? S.engine.time : 0);

  function change(fn, mergeKey = null, { inspector = false } = {}) {
    S.history.change(fn, mergeKey);
    S.clean = false; // changed since the last save / export
    afterChange(inspector);
  }

  function afterChange(rebuildInspector) {
    if (!S || !S.history) return;
    fixSelection();
    if (S.preview && S.preview.entry.mediaId != null && !proj().media[S.preview.entry.mediaId]) closePreview();
    if (S.engine && !S.engine.playing) S.engine.sync(Math.min(now(), M.duration(proj())), false);
    requestRender();
    updateTopBar();
    if (rebuildInspector) renderInspector();
    renderPool();
    if (S.timeline) S.timeline.draw();
    updateTransport();
  }

  function undo() {
    S.history.undo();
    afterChange(true);
  }

  function redo() {
    S.history.redo();
    afterChange(true);
  }

  function fixSelection() {
    if (S.selected != null && !M.clipOf(proj(), S.selected)) S.selected = null;
  }

  function selectedClip() {
    return S.selected != null ? M.clipOf(proj(), S.selected) : null;
  }

  // Esc (also when it takes the viewer out of full screen): asks before closing the editor, whether
  // or not there are unsaved changes. keepEditing: called when the person stays (it may re-enter
  // full screen, which needs that click).
  IgfvEditor.requestClose = function requestClose({ keepEditing = null } = {}) {
    if (!S) return;
    if (keepEditing) S.leaveKeep = keepEditing;
    if (S.modal && S.modal.dataset.kind === "leave") return; // already asking (Esc and leaving full screen both come)
    if (S.engine && S.engine.playing) S.engine.pause();
    const unsaved = dirty();
    confirmModal(
      unsaved ? "Discard your edits?" : "Close the editor?",
      unsaved ? "Your changes haven't been saved as a draft or exported." : "Your project is saved or exported; you can open drafts again later.",
      unsaved ? "Discard and close" : "Close editor",
      () => close(true),
      () => {
        const keep = S && S.leaveKeep;
        if (S) S.leaveKeep = null;
        if (keep) keep();
      }
    );
    if (S.modal) S.modal.dataset.kind = "leave";
  };

  // keep: id is one of the selected clips, and the others stay selected.
  function select(id, keep = false) {
    if (!keep || !S.clipSel.has(id)) {
      S.clipSel.clear();
      addGroupOf(id);
    }
    S.transPick = null;
    S.kfPick = null;
    S.selected = id;
    if (S.tool === "crop" && !(selectedClip() && M.VISUAL_MEDIA.has(selectedClip().type))) S.tool = "select";
    afterChange(true);
  }

  function clipLabel(clip) {
    if (clip.type === "adjust") return "fx  Adjustment";
    if (M.MEDIA_TYPES.has(clip.type)) {
      const m = proj().media[clip.media];
      return `${MEDIA_ICON[clip.type] || ""} ${m ? m.name : clip.type}`;
    }
    return L.label(clip);
  }

  // The picture of a media clip at time t (images: their bitmap; GIFs: the frame then; video: the
  // engine's element, synced to the time).
  function sourceOf(clip, t = now()) {
    if (clip.type === "gif") {
      const m = S.media.get(clip.media);
      if (!m || !m.gif) return m && m.bitmap ? { el: m.bitmap, w: m.bitmap.width, h: m.bitmap.height, frameKey: "img" } : null;
      const i = IgfvEditor.GifDec.frameAt(m.gif, Math.max(0, t - clip.start) * (clip.speed || 1), clip.loop !== false);
      // The frames may be smaller than the GIF: drawn at its own size.
      return { el: m.gif.frames[i].canvas, w: m.gif.w, h: m.gif.h, frameKey: `gif${i}` };
    }
    if (clip.type === "image") {
      const m = S.media.get(clip.media);
      return m && m.bitmap ? { el: m.bitmap, w: m.bitmap.width, h: m.bitmap.height, frameKey: "img" } : null;
    }
    if (clip.type === "video") return S.engine.source(clip);
    return null;
  }

  // ---- shell ------------------------------------------------------------------------------------------------
  function buildShell() {
    const root = el("div", "", { id: "igfv-editor" });
    for (const type of ["click", "mousedown", "mouseup", "pointerdown", "wheel", "dblclick", "contextmenu"]) {
      root.addEventListener(type, (e) => e.stopPropagation());
    }
    S.root = root;

    const top = el("div", "igfv-ed-top");
    const closeBtn = button("✕", "igfv-ed-icon", () => close(), "Close the editor (Esc)");
    const title = el("div", "igfv-ed-title", { text: S.opts.title || "Editor" });
    S.undoBtn = button("↶", "igfv-ed-icon", undo, "Undo (Ctrl+Z)");
    S.redoBtn = button("↷", "igfv-ed-icon", redo, "Redo (Ctrl+Shift+Z)");
    const zoomOut = button("−", "igfv-ed-icon", () => zoomBy(1 / 1.25), "Zoom out (-)");
    S.zoomLabel = button("Fit", "igfv-ed-zoom", () => setZoom("fit"), "Fit (0)");
    const zoomIn = button("+", "igfv-ed-icon", () => zoomBy(1.25), "Zoom in (+)");
    // Compare: held down, the picture without colour adjustments and effects.
    S.compareBtn = button("\u{1f441} Compare", "igfv-ed-before", () => {}, "Hold to compare: the picture without your colour adjustments and effects (or hold ` )");
    S.compareBtn.addEventListener("pointerdown", () => setCompare(true));
    for (const t of ["pointerup", "pointerleave", "pointercancel"]) S.compareBtn.addEventListener(t, () => setCompare(false));
    const projectBtn = button("Project\u2026", "", openProjectSettings, "The canvas size, background and tracks");
    const timelineBtn = button("Timeline\u2026", "", openTimelineSettings, "Snap, push, track height, mute or show all tracks");
    const settingsBtn = button("\u2699 Settings\u2026", "", () => openSettings(), "Input / output, mouse and keyboard shortcuts");
    const draftsBtn = button("Drafts…", "", openDrafts, "Save or open drafts (Ctrl+S saves)");
    const exportBtn = button("Export…", "igfv-ed-primary", openExport, "Export (Ctrl+E)");
    S.status = el("div", "igfv-ed-status");
    top.append(closeBtn, title, S.undoBtn, S.redoBtn, el("span", "igfv-ed-sep"), zoomOut, S.zoomLabel, zoomIn, el("span", "igfv-ed-sep"), S.compareBtn, el("span", "igfv-ed-sep"), projectBtn, timelineBtn, settingsBtn, S.status, el("span", "igfv-ed-flex"), ...(S.opts.topBar ? [S.opts.topBar] : []), draftsBtn, exportBtn);

    // Left: sources (Favorites, History, Files) over the media pool.
    const left = el("div", "igfv-ed-left");
    S.left = left;
    buildLeft(left);

    const rail = el("div", "igfv-ed-rail");
    S.toolBtns = new Map();
    for (const t of TOOLS) {
      const b = button("", "igfv-ed-tool", () => setTool(t.id), t.label);
      b.append(el("span", "igfv-ed-tool-icon", { text: t.icon }), el("span", "igfv-ed-tool-label", { text: t.label }));
      rail.appendChild(b);
      S.toolBtns.set(t.id, b);
    }

    const stage = el("div", "igfv-ed-stage");
    const view = el("div", "igfv-ed-view");
    S.canvas = el("canvas", "igfv-ed-canvas");
    S.overlay = el("div", "igfv-ed-overlay");
    view.append(S.canvas, S.overlay);
    stage.appendChild(view);
    S.stage = stage;
    S.view = view;
    stage.addEventListener("pointerdown", onStageDown);
    stage.addEventListener("pointermove", onStageMove);
    stage.addEventListener("pointerup", onStageUp);
    stage.addEventListener("pointercancel", onStageUp);
    stage.addEventListener("dblclick", onStageDblClick);
    stage.addEventListener("contextmenu", canvasMenu);
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (!S || !S.history) return;
      const mouse = (S.settings && S.settings.mouse) || {};
      const ctrl = e.ctrlKey || e.metaKey;
      // Over a split-screen box: zoom the picture inside it.
      if (!ctrl && mouse.splitWheel !== false) {
        const [fx, fy] = toFrac(e);
        const hit = topHitAt(fx, fy);
        if (hit && hit.split && !M.trackOf(proj(), hit.track).locked) return zoomInBox(hit, fx, fy, e.deltaY < 0 ? 1.1 : 1 / 1.1);
      }
      if (!ctrl && mouse.canvasWheel === "none") return;
      zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });

    const side = el("div", "igfv-ed-side");
    S.inspector = el("div", "igfv-ed-inspector");
    // Drag the left edge to make the panel wider or narrower; double-click: the default width.
    const sideResize = el("div", "igfv-ed-side-resize", { title: "Drag to resize \u00b7 double-click: default width" });
    edgeDrag(sideResize, { axis: "x", sign: -1, size: () => S.sideW || side.getBoundingClientRect().width || 300, set: (w) => setSideWidth(clampSideWidth(w)), reset: () => setSideWidth(null) });
    side.append(S.inspector, sideResize);

    const main = el("div", "igfv-ed-main");
    // The left panel's show / hide tab, in the middle of its right edge (like the tile strip's).
    S.leftToggle = button("\u2039", "igfv-ed-left-toggle", toggleLeft, "Hide / show the media panel (\\)");
    // The right panel's show / hide tab, in the middle of its left edge.
    S.sideToggle = button("\u203a", "igfv-ed-side-toggle", toggleSide, "Hide / show the side panel (|)");
    main.append(left, S.leftToggle, rail, stage, S.sideToggle, side);
    S.bottom = el("div", "igfv-ed-bottom");
    // The timeline's top edge: drag to make it taller or shorter; double-click: the default height.
    const bottomResize = el("div", "igfv-ed-bottom-resize", { title: "Drag to resize the timeline \u00b7 double-click: default height" });
    edgeDrag(bottomResize, {
      axis: "y",
      sign: -1,
      size: () => S.timelineH || (S.timelineHost && S.timelineHost.getBoundingClientRect().height) || 220,
      set: (h) => setTimelineHeight(clampTimelineHeight(h)),
      reset: () => setTimelineHeight(null),
    });
    root.append(top, main, bottomResize, S.bottom);
    S.toastEl = el("div", "igfv-ed-toast");
    S.toastEl.hidden = true;
    root.appendChild(S.toastEl);

    (S.opts.host || document.documentElement).appendChild(root);
    S.onKey = (e) => {
      if (!S || e.igfvEditorHandled) return;
      const field = e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable='true']");
      if (field) return;
      if (IgfvEditor.key(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", S.onKey, true);
    S.onResize = () => {
      if (S.leftW) setLeftWidth(clampLeftWidth(S.leftW));
      if (S.sideW) setSideWidth(clampSideWidth(S.sideW));
      if (S.timelineH) setTimelineHeight(clampTimelineHeight(S.timelineH));
      requestRender();
      if (S.timeline) S.timeline.draw();
    };
    window.addEventListener("resize", S.onResize);
    setSourceTab(S.srcTab);
    loadUiPrefs();
    loadEditorSettings();
    // The bundled fonts: once loaded, texts are measured again and drawn with them.
    L.loadFonts(S.opts.sources && S.opts.sources.fontBytes).then((n) => {
      if (!S || !n || !S.history) return;
      const p = proj();
      for (const c of p.clips) if (c.type === "text") L.remeasure(c, p.w, p.h);
      requestRender();
      if (S.tool === "templates" || S.tool === "text") renderInspector();
    });
  }

  function showStatus(text) {
    if (S && S.status) S.status.textContent = text;
  }

  function toast(text) {
    if (!S) return;
    S.toastEl.textContent = text;
    S.toastEl.hidden = false;
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => S && (S.toastEl.hidden = true), 2800);
  }

  function updateTopBar() {
    if (!S || !S.undoBtn) return;
    S.undoBtn.disabled = !S.history || !S.history.canUndo();
    S.redoBtn.disabled = !S.history || !S.history.canRedo();
    S.zoomLabel.textContent = S.zoom === "fit" ? "Fit" : `${Math.round(S.zoom * 100)}%`;
  }

  // ---- compare, sound, mute all -------------------------------------------------------------------------
  function setCompare(on) {
    if (!S || S.before === on) return;
    S.before = on;
    if (S.compareBtn) S.compareBtn.classList.toggle("igfv-on", on);
    requestRender();
  }

  // The preview's loudness (0-1; exports aren't affected). save: remembered with the layout.
  function setPreviewVol(v, save = true) {
    S.previewVol = Math.max(0, Math.min(1, v));
    if (S.engine && S.engine.setPreviewVolume) S.engine.setPreviewVolume(S.previewVol);
    if (S.soundBtn) {
      S.soundBtn.textContent = S.previewVol === 0 ? "\u{1f507}" : S.previewVol < 0.5 ? "\u{1f509}" : "\u{1f50a}";
      S.soundBtn.classList.toggle("igfv-on", S.previewVol === 0);
    }
    if (S.soundSlider) S.soundSlider.value = String(Math.round(S.previewVol * 100));
    if (save) saveUiPrefs();
  }

  function togglePreviewMute() {
    if ((S.previewVol ?? 1) > 0) {
      S.volBeforeMute = S.previewVol ?? 1;
      setPreviewVol(0);
      toast("Sound off (preview only: exports keep their sound)");
    } else {
      setPreviewVol(S.volBeforeMute || 1);
      toast("Sound on");
    }
  }

  function muteAllTracks() {
    const p = proj();
    const mute = p.tracks.some((t) => !t.muted);
    change((q) => q.tracks.forEach((t) => (t.muted = mute)));
    toast(mute ? "All tracks muted" : "All tracks unmuted");
  }

  // ---- cut / copy / paste -------------------------------------------------------------------------------
  // The clips to copy: the selected ones, their joined partners and the rest of their groups.
  function clipboardIds() {
    const p = proj();
    const ids = new Set(selectedIds());
    for (const id of [...ids]) {
      const c = M.clipOf(p, id);
      const o = M.partner(p, c);
      if (o) ids.add(o.id);
      if (c.group != null) p.clips.filter((x) => x.group === c.group).forEach((x) => ids.add(x.id));
    }
    return [...ids];
  }

  function copyClips(quiet = false) {
    const p = proj();
    const ids = clipboardIds();
    if (!ids.length) {
      toast("Select clips first (click; Ctrl+click for several)");
      return null;
    }
    const clips = ids.map((id) => M.clone(M.clipOf(p, id)));
    S.clipboard = { clips, base: Math.min(...clips.map((c) => c.start)) };
    if (!quiet) toast(`Copied ${clips.length} clip${clips.length > 1 ? "s" : ""}: Ctrl+V pastes at the playhead`);
    return ids;
  }

  function cutClips() {
    const ids = copyClips(true);
    if (!ids) return;
    deleteClips(ids);
    toast(`Cut ${ids.length} clip${ids.length > 1 ? "s" : ""}: Ctrl+V pastes them at the playhead`);
  }

  // Pastes the copied clips at the playhead: on their own tracks where those are free there, else on
  // free (or new) tracks; joined pairs and groups stay together. One undo step.
  function pasteClips() {
    if (!S.clipboard || !S.clipboard.clips.length) return toast("Nothing copied yet: select clips and press Ctrl+C");
    const t = now();
    const pasted = [];
    let skipped = 0;
    change((p) => {
      const dt = t - S.clipboard.base;
      const links = new Map();
      const groups = new Map();
      for (const src of [...S.clipboard.clips].sort((a, b) => a.start - b.start)) {
        if (src.media != null && !p.media[src.media]) {
          skipped++;
          continue;
        }
        const c = M.clone(src);
        c.id = p.nextId++;
        c.start = Math.max(0, src.start + dt);
        if (c.link != null) {
          if (!links.has(c.link)) links.set(c.link, p.nextId++);
          c.link = links.get(c.link);
        }
        if (c.group != null) {
          if (!groups.has(c.group)) groups.set(c.group, p.nextId++);
          c.group = groups.get(c.group);
        }
        const tr = M.trackOf(p, src.track);
        M.placeClip(p, c, { track: tr && !tr.locked ? src.track : null, top: true });
        pasted.push(c);
      }
      // a joined clip whose partner wasn't pasted is on its own
      for (const c of pasted) if (c.link != null && !pasted.some((o) => o !== c && o.link === c.link)) delete c.link;
    }, null, { inspector: true });
    if (!pasted.length) return toast("The copied media isn't in the project any more");
    S.clipSel.clear();
    if (pasted.length > 1) pasted.forEach((c) => S.clipSel.add(c.id));
    S.selected = pasted[0].id;
    S.transPick = null;
    afterChange(true);
    toast(`Pasted ${pasted.length} clip${pasted.length > 1 ? "s" : ""}${skipped ? ` (${skipped} skipped: their media was removed)` : ""}`);
  }

  function selectAllClips() {
    const p = proj();
    const ids = p.clips.filter((c) => !M.trackOf(p, c.track).locked).map((c) => c.id);
    if (!ids.length) return;
    S.clipSel.clear();
    if (ids.length > 1) ids.forEach((i) => S.clipSel.add(i));
    S.selected = ids[0];
    S.focus = "timeline";
    afterChange(true);
  }

  // ---- settings (this computer) ----------------------------------------------------------------------------
  // Settings and the panel layout are kept in this browser; IgfvEditor.store ({ get(key), set(obj) },
  // Promises) can replace localStorage.
  function store() {
    if (IgfvEditor.store) return IgfvEditor.store;
    return {
      get: async (key) => {
        try {
          const raw = localStorage.getItem(key);
          return raw == null ? {} : { [key]: JSON.parse(raw) };
        } catch (err) {
          return {};
        }
      },
      set: async (obj) => {
        for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, JSON.stringify(v));
      },
    };
  }

  const SETTINGS_KEY = "lucymixer.editorSettings";
  const defaultSettings = () => ({
    keys: {},
    io: { overlayDur: 0, addFill: false, photoFormat: "auto", quality: 92, gifFps: 12 },
    mouse: { canvasWheel: "zoom", splitWheel: true, timelineWheel: "scroll" },
  });

  function loadEditorSettings() {
    store()
      .get(SETTINGS_KEY)
      .then((stored) => {
        if (!S) return;
        const own = stored[SETTINGS_KEY] || {};
        const def = defaultSettings();
        S.settings = { keys: { ...(own.keys || {}) }, io: { ...def.io, ...(own.io || {}) }, mouse: { ...def.mouse, ...(own.mouse || {}) } };
      })
      .catch(() => {});
  }

  function saveEditorSettings() {
    store().set({ [SETTINGS_KEY]: S.settings }).catch(() => {});
  }

  // ---- top bar: Project, Timeline, Settings ---------------------------------------------------------------
  function openProjectSettings() {
    modal((card) => {
      card.classList.add("igfv-ed-wide-card");
      S.projectBody = el("div", "igfv-ed-projbody");
      card.append(S.projectBody);
      inspectProject(S.projectBody);
      const row = el("div", "igfv-ed-buttons");
      row.appendChild(button("Done", "igfv-ed-primary", closeModal));
      card.appendChild(row);
    });
    S.modal.dataset.kind = "project";
  }

  function refreshProjectModal() {
    if (!S.modal || S.modal.dataset.kind !== "project" || !S.projectBody) return;
    S.projectBody.textContent = "";
    inspectProject(S.projectBody);
  }

  function openTimelineSettings() {
    modal((card) => {
      card.appendChild(el("h3", "", { text: "Timeline" }));
      const body = el("div");
      card.appendChild(body);
      const draw = () => {
        body.textContent = "";
        const toggle = (label, on, set) => {
          const row = el("label", "igfv-ed-row");
          const cb = el("input", "", { type: "checkbox", checked: on });
          cb.addEventListener("change", () => {
            set(cb.checked);
            draw();
          });
          row.append(cb, el("span", "igfv-ed-label", { text: label }));
          body.appendChild(row);
        };
        toggle("Snap: clips stick to edges and the playhead", Boolean(S.snap), (on) => {
          S.snap = on;
          if (S.snapBtn) S.snapBtn.classList.toggle("igfv-on", on);
        });
        toggle("Push: moving clips pushes the clips in their way along", Boolean(S.push), (on) => setPush(on));
        slider(body, {
          label: "Track height",
          min: 24,
          max: 120,
          step: 1,
          def: 46,
          format: (v) => `${Math.round(v)} px`,
          get: () => (S.timeline && S.timeline.trackH) || 46,
          set: (v) => {
            S.trackH = v;
            if (S.timeline) S.timeline.setTrackH(v);
            saveUiPrefs();
          },
        });
        const p = proj();
        const anyOn = p.tracks.some((t) => !t.muted);
        const row = el("div", "igfv-ed-buttons");
        row.append(
          button(anyOn ? "\u{1f507} Mute all tracks" : "\u{1f50a} Unmute all tracks", "", () => (muteAllTracks(), draw())),
          button("Show all tracks", "", () => (change((q) => q.tracks.forEach((t) => (t.hidden = false))), draw())),
          button("Fit the project", "", () => ((S.timeline.autoFit = true), S.timeline.draw())),
          button("Clear the track selection", "", () => selectTrack(null))
        );
        body.appendChild(row);
        note(body, "Per track: hide, mute and lock from its name on the left; drag the line under a track to change only its height.");
      };
      draw();
      const done = el("div", "igfv-ed-buttons");
      done.appendChild(button("Done", "igfv-ed-primary", closeModal));
      card.appendChild(done);
    });
  }

  function openSettings(tab = "io") {
    const set = S.settings || (S.settings = defaultSettings());
    modal((card) => {
      card.classList.add("igfv-ed-wide-card");
      card.appendChild(el("h3", "", { text: "Settings" }));
      const tabs = el("div");
      const body = el("div", "igfv-ed-settings");
      card.append(tabs, body);
      const save = () => saveEditorSettings();
      const pickRow = (parent, label, items, current, onPick) => {
        parent.appendChild(el("span", "igfv-ed-label", { text: label }));
        chips(parent, items, current, (v) => {
          onPick(v);
          save();
          draw();
        });
      };
      const draw = () => {
        tabs.textContent = "";
        chips(tabs, [{ id: "io", label: "Input / output" }, { id: "mouse", label: "Mouse" }, { id: "keys", label: "Keyboard" }], tab, (t) => {
          tab = t;
          draw();
        });
        body.textContent = "";
        if (tab === "io") {
          pickRow(body, "New photos, texts and stickers last", [{ id: 0, label: "Until the end" }, { id: 3, label: "3 s" }, { id: 5, label: "5 s" }, { id: 10, label: "10 s" }], set.io.overlayDur, (v) => (set.io.overlayDur = v));
          pickRow(body, "Added photos and videos", [{ id: false, label: "Fit the canvas" }, { id: true, label: "Fill the canvas" }], set.io.addFill, (v) => (set.io.addFill = v));
          body.appendChild(el("h4", "igfv-ed-stgroup", { text: "Export defaults" }));
          pickRow(body, "Photo format", [{ id: "auto", label: "Automatic" }, { id: "png", label: "PNG" }, { id: "jpeg", label: "JPEG" }, { id: "webp", label: "WebP" }], set.io.photoFormat, (v) => (set.io.photoFormat = v));
          slider(body, { label: "Quality", min: 60, max: 100, step: 1, def: 92, get: () => set.io.quality, set: (v) => ((set.io.quality = Math.round(v)), save()) });
          pickRow(body, "GIF frame rate", [10, 12, 15, 20].map((f) => ({ id: f, label: `${f} fps` })), set.io.gifFps, (v) => (set.io.gifFps = v));
          note(body, "The Export dialog starts with these; you can still change them for each export.");
        } else if (tab === "mouse") {
          pickRow(body, "Wheel over the canvas", [{ id: "zoom", label: "Zoom the view" }, { id: "none", label: "Nothing (Ctrl+wheel zooms)" }], set.mouse.canvasWheel, (v) => (set.mouse.canvasWheel = v));
          pickRow(body, "Wheel over a split-screen box", [{ id: true, label: "Zoom the picture inside" }, { id: false, label: "Like the rest of the canvas" }], set.mouse.splitWheel, (v) => (set.mouse.splitWheel = v));
          pickRow(body, "Wheel over the timeline", [{ id: "scroll", label: "Scroll the tracks up / down (Shift: in time; Ctrl: zoom)" }, { id: "zoom", label: "Zoom (Ctrl: scroll)" }], set.mouse.timelineWheel, (v) => (set.mouse.timelineWheel = v));
          note(body, "In a split-screen box: drag moves the picture inside it, Alt+drag moves the box.");
        } else {
          drawKeys(body, save, draw);
        }
      };
      draw();
      const done = el("div", "igfv-ed-buttons");
      done.appendChild(button("Done", "igfv-ed-primary", closeModal));
      card.appendChild(done);
    });
    S.modal.dataset.kind = "settings";
  }

  // Settings → Keyboard: every shortcut, with Change (press the new keys; Esc cancels) and Reset.
  function drawKeys(body, save, redraw) {
    const set = S.settings;
    let group = null;
    for (const sc of SHORTCUTS) {
      if (sc.group !== group) {
        group = sc.group;
        body.appendChild(el("h4", "igfv-ed-stgroup", { text: group }));
      }
      const row = el("div", "igfv-ed-keyrow");
      const keys = el("span", "igfv-ed-keys");
      for (const k of keysOf(sc.id)) keys.appendChild(el("kbd", "", { text: igfvKeyLabel(k) }));
      const chg = button("Change", "", () => {
        chg.textContent = "Press keys\u2026";
        chg.classList.add("igfv-on");
        S.capture = (e) => {
          if (["Control", "Alt", "Shift", "Meta", "OS", "AltGraph"].includes(e.key)) return; // wait for the key
          S.capture = null;
          if (e.key === "Escape") return redraw();
          const combo = eventCombos(e)[0];
          const before = keysOf(sc.id);
          const clash = SHORTCUTS.find((o) => o.id !== sc.id && keysOf(o.id).some((k) => igfvNormalizeKey(k) === combo));
          set.keys[sc.id] = [combo];
          if (clash) {
            // the other action takes this one's old keys
            set.keys[clash.id] = before.filter((k) => igfvNormalizeKey(k) !== combo);
            toast(`${igfvKeyLabel(combo)} was "${clash.label}": swapped`);
          }
          save();
          redraw();
        };
      });
      const reset = button("Reset", "igfv-ed-quiet", () => {
        delete set.keys[sc.id];
        save();
        redraw();
      });
      reset.disabled = !set.keys[sc.id];
      row.append(el("span", "igfv-ed-label", { text: sc.label }), keys, chg, reset);
      body.appendChild(row);
    }
    body.appendChild(el("h4", "igfv-ed-stgroup", { text: "Fixed" }));
    for (const [k, label] of FIXED_KEYS) {
      const row = el("div", "igfv-ed-keyrow");
      row.append(el("span", "igfv-ed-label", { text: label }), el("span", "igfv-ed-keys", { text: k }));
      body.appendChild(row);
    }
    const all = el("div", "igfv-ed-buttons");
    all.appendChild(button("Reset all shortcuts", "", () => {
      set.keys = {};
      save();
      redraw();
    }));
    body.appendChild(all);
  }

  // The side panel with nothing selected: what to do next.
  function inspectNothing(box) {
    box.appendChild(el("h3", "igfv-ed-h", { text: "Nothing selected" }));
    note(box, "Click something on the canvas or a clip on the timeline to change it. Ctrl+click clips to select several.");
    note(box, "Add media from the left, text and stickers from the tools, or ready-made banners, news, quotes and split screens from Templates.");
    const row = el("div", "igfv-ed-buttons");
    row.append(button("Project settings\u2026", "", openProjectSettings), button("Templates", "", () => setTool("templates")), button("Add text", "", () => addOverlay("text")));
    box.appendChild(row);
  }

  // ---- keys -------------------------------------------------------------------------------------------------
  // The editor's shortcuts (Settings → Keyboard changes them). Keys as in settings.js: "Ctrl+Shift+z",
  // " " (Space), "Delete"; Meta (⌘) counts as Ctrl.
  const SHORTCUTS = [
    { id: "undo", label: "Undo", group: "Edit", keys: ["Ctrl+z"] },
    { id: "redo", label: "Redo", group: "Edit", keys: ["Ctrl+Shift+z", "Ctrl+y"] },
    { id: "cut", label: "Cut clips", group: "Edit", keys: ["Ctrl+x"] },
    { id: "copy", label: "Copy clips", group: "Edit", keys: ["Ctrl+c"] },
    { id: "paste", label: "Paste clips at the playhead", group: "Edit", keys: ["Ctrl+v"] },
    { id: "duplicate", label: "Duplicate", group: "Edit", keys: ["Ctrl+d"] },
    { id: "delete", label: "Delete", group: "Edit", keys: ["Delete", "Backspace"] },
    { id: "selectAll", label: "Select all clips", group: "Edit", keys: ["Ctrl+a"] },
    { id: "save", label: "Save draft", group: "File", keys: ["Ctrl+s"] },
    { id: "export", label: "Export", group: "File", keys: ["Ctrl+e"] },
    { id: "play", label: "Play / pause", group: "Playback", keys: [" "] },
    { id: "previewMute", label: "Sound on / off (preview)", group: "Playback", keys: ["m"] },
    { id: "home", label: "Go to the start", group: "Playback", keys: ["Home"] },
    { id: "end", label: "Go to the end", group: "Playback", keys: ["End"] },
    { id: "prevFrame", label: "Previous frame", group: "Playback", keys: [","] },
    { id: "nextFrame", label: "Next frame", group: "Playback", keys: ["."] },
    { id: "split", label: "Split at the playhead", group: "Timeline", keys: ["Ctrl+b"] },
    { id: "merge", label: "Merge with the next piece", group: "Timeline", keys: ["Ctrl+j"] },
    { id: "blade", label: "Blade tool on / off", group: "Timeline", keys: ["c"] },
    { id: "bladeOff", label: "Back to selecting (from the Blade)", group: "Timeline", keys: ["v"] },
    { id: "muteAll", label: "Mute / unmute all tracks", group: "Timeline", keys: ["Shift+m"] },
    { id: "keyframe", label: "Keyframe at the playhead (add / remove)", group: "Timeline", keys: ["k"] },
    { id: "prevKey", label: "Previous keyframe", group: "Timeline", keys: ["Shift+k"] },
    { id: "nextKey", label: "Next keyframe", group: "Timeline", keys: ["Alt+k"] },
    { id: "zoomIn", label: "Zoom the canvas in", group: "View", keys: ["+", "="] },
    { id: "zoomOut", label: "Zoom the canvas out", group: "View", keys: ["-"] },
    { id: "zoomFit", label: "Fit the canvas", group: "View", keys: ["0"] },
    { id: "compare", label: "Compare (hold): without adjustments", group: "View", keys: ["`"] },
    { id: "toggleLeft", label: "Show / hide the media panel", group: "View", keys: ["\\"] },
    { id: "toggleSide", label: "Show / hide the side panel", group: "View", keys: ["|"] },
  ];
  const FIXED_KEYS = [
    ["Esc", "Leave a tool, clear the selection, close the editor"],
    ["\u2190 \u2192 \u2191 \u2193", "Move the selected item (Shift: 10 px); with clips or tracks selected on the timeline, move them in time"],
  ];

  function keysOf(id) {
    const own = S && S.settings && S.settings.keys && S.settings.keys[id];
    return own || (SHORTCUTS.find((x) => x.id === id) || {}).keys || [];
  }

  // A key press as combos: Meta as Ctrl; for a symbol typed with Shift ("|", "+") also without it.
  function eventCombos(e) {
    const c = igfvComboFromEvent(e);
    if (!c) return [];
    const out = [c.replace("Meta", "Ctrl").replace("Ctrl+Ctrl", "Ctrl")];
    if (e.shiftKey && e.key.length === 1 && e.key.toLowerCase() === e.key.toUpperCase()) out.push(out[0].replace("Shift+", ""));
    return out;
  }

  // A shortcut's first key, as shown in menus.
  function hk(id) {
    const k = keysOf(id)[0];
    return k ? igfvKeyLabel(k).replace(/ \+ /g, "+") : "";
  }

  function isKey(e, id) {
    const combos = eventCombos(e);
    return keysOf(id).some((k) => combos.includes(igfvNormalizeKey(k)));
  }

  IgfvEditor.keyUp = function keyUp(e) {
    if (S && S.before && isKey(e, "compare")) setCompare(false);
  };

  IgfvEditor.key = function key(e) {
    if (!S || !S.history) return false;
    e.igfvEditorHandled = true;
    const k = e.key;
    // Settings → Keyboard: waiting for a new key.
    if (S.capture) {
      S.capture(e);
      return true;
    }
    if (S.modal) {
      if (k === "Escape") closeModal();
      return true;
    }
    if (S.menu) {
      closeMenu();
      if (k === "Escape") return true;
    }
    if (isKey(e, "redo")) {
      redo();
      return true;
    }
    if (isKey(e, "undo")) {
      undo();
      return true;
    }
    if (isKey(e, "save")) {
      if (S.draftId) saveDraft();
      else openDrafts();
      return true;
    }
    if (isKey(e, "export")) {
      openExport();
      return true;
    }
    if (isKey(e, "toggleLeft")) {
      toggleLeft();
      return true;
    }
    if (isKey(e, "toggleSide")) {
      toggleSide();
      return true;
    }
    if (isKey(e, "split")) {
      splitAtPlayhead();
      return true;
    }
    if (isKey(e, "duplicate")) {
      duplicateSelected();
      return true;
    }
    if (isKey(e, "copy")) {
      copyClips();
      return true;
    }
    if (isKey(e, "cut")) {
      cutClips();
      return true;
    }
    if (isKey(e, "paste")) {
      pasteClips();
      return true;
    }
    if (isKey(e, "selectAll")) {
      selectAllClips();
      return true;
    }
    if (isKey(e, "compare")) {
      if (!e.repeat) setCompare(true);
      return true;
    }
    if (S.preview && (k === "Escape" || k === " ")) {
      const media = S.preview.media;
      if (k === "Escape") closePreview();
      else if (media && media.tagName !== "IMG") {
        if (media.paused) media.play().catch(() => {});
        else media.pause();
      }
      return true;
    }
    if (isKey(e, "merge")) {
      mergeSelected();
      return true;
    }
    if (isKey(e, "blade")) {
      setBlade(!S.blade);
      return true;
    }
    if (isKey(e, "bladeOff") && S.blade) {
      setBlade(false);
      return true;
    }
    if (isKey(e, "keyframe")) {
      toggleKeyAtPlayhead();
      return true;
    }
    if (isKey(e, "prevKey") || isKey(e, "nextKey")) {
      jumpKey(isKey(e, "nextKey") ? 1 : -1);
      return true;
    }
    if (isKey(e, "muteAll")) {
      muteAllTracks();
      return true;
    }
    if (isKey(e, "previewMute")) {
      togglePreviewMute();
      return true;
    }
    if (k === "Escape") {
      if (S.pickKey) return stopPickKey(), true;
      if (S.blade) return setBlade(false), true;
      if (S.transPick != null) return (S.transPick = null), S.timeline.draw(), true;
      if (S.trackSel.size) return selectTrack(null), true;
      if (S.tool !== "select") setTool("select");
      else if (S.selected != null) select(null);
      else IgfvEditor.requestClose();
      return true;
    }
    if (isKey(e, "delete") && S.kfPick) {
      deletePickedKey();
      return true;
    }
    if (isKey(e, "delete") && S.transPick != null) {
      removeTransition(S.transPick);
      return true;
    }
    if (isKey(e, "delete") && S.selected != null) {
      deleteSelected();
      return true;
    }
    if (isKey(e, "zoomIn")) {
      zoomBy(1.25);
      return true;
    }
    if (isKey(e, "zoomOut")) {
      zoomBy(1 / 1.25);
      return true;
    }
    if (isKey(e, "zoomFit")) {
      setZoom("fit");
      return true;
    }
    if (isKey(e, "play")) {
      togglePlay();
      return true;
    }
    if (isKey(e, "home") || isKey(e, "end")) {
      S.engine.seek(isKey(e, "home") ? 0 : M.duration(proj()));
      return true;
    }
    if (isKey(e, "prevFrame") || isKey(e, "nextFrame")) {
      S.engine.seek(now() + (isKey(e, "nextFrame") ? 1 : -1) / 30);
      return true;
    }
    // Several selected clips, with the timeline focused: ← / → move them in time (a frame; Shift: 1 s).
    if ((k === "ArrowLeft" || k === "ArrowRight") && S.clipSel.size > 1 && S.focus === "timeline") {
      shiftSelectedClips((k === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 1 : 1 / 30), "clips-key");
      return true;
    }
    // Selected tracks, with the timeline focused: ← / → move them in time (a frame; Shift: 1 s).
    if ((k === "ArrowLeft" || k === "ArrowRight") && S.trackSel.size && (S.focus === "timeline" || S.selected == null)) {
      shiftSelectedTracks((k === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 1 : 1 / 30), "tracks-key");
      return true;
    }
    if (k.startsWith("Arrow")) {
      // The selected canvas item moves (1 px, Shift: 10 px), in any tool but crop (stickers, text,
      // shapes, media); with nothing selected, ← / → step a frame.
      const clip = selectedClip();
      const tr = clip && M.trackOf(proj(), clip.track);
      if (clip && clip.cx != null && S.tool !== "crop" && !(tr && tr.locked)) {
        const px = e.shiftKey ? 10 : 1;
        const dx = k === "ArrowLeft" ? -px : k === "ArrowRight" ? px : 0;
        const dy = k === "ArrowUp" ? -px : k === "ArrowDown" ? px : 0;
        change((d) => {
          const c = M.clipOf(d, clip.id);
          const a = live(c);
          writeTransform(c, { cx: a.cx + dx / d.w, cy: a.cy + dy / d.h });
          if (c.region) c.region = { ...c.region, x: c.region.x + dx / d.w, y: c.region.y + dy / d.h };
        }, `nudge-${clip.id}`);
        return true;
      }
      if (k === "ArrowLeft" || k === "ArrowRight") {
        S.engine.seek(now() + (k === "ArrowRight" ? 1 : -1) / 30);
        return true;
      }
    }
    return false;
  };

  // ---- rendering ------------------------------------------------------------------------------------------
  function requestRender() {
    if (!S || S.raf) return;
    S.raf = requestAnimationFrame(() => {
      if (!S) return;
      S.raf = 0;
      renderNow();
    });
  }

  function cropTarget() {
    const clip = selectedClip();
    return S.tool === "crop" && clip && M.VISUAL_MEDIA.has(clip.type) ? clip : null;
  }

  function renderNow() {
    if (!S || !S.history) return;
    const p = proj();
    const rect = S.stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const stageW = Math.max(100, rect.width - 32);
    const stageH = Math.max(100, rect.height - 32);
    const crop = cropTarget();
    let fullW;
    let fullH;
    if (crop) {
      [fullW, fullH] = M.orientedSize(p.media[crop.media], crop.crop);
    } else {
      fullW = p.w;
      fullH = p.h;
    }
    const fit = Math.min(stageW / fullW, stageH / fullH);
    const displayScale = S.zoom === "fit" ? fit : S.zoom;
    const scale = Math.min(1, displayScale * dpr * 1.0001, 2400 / Math.max(fullW, fullH));
    S.fitScale = fit;
    S.displayScale = displayScale;
    S.scale = scale;
    if (crop) {
      // The clip's whole (turned, flipped) source, to crop on.
      const src = sourceOf(crop);
      if (src) {
        const whole = { ...crop, crop: { ...crop.crop, x: 0, y: 0, w: 1, h: 1, angle: 0 } };
        S.renderer.geometry(whole, p.media[crop.media], src.el, src.w, src.h, Math.max(1, Math.round(fullW * scale)), Math.max(1, Math.round(fullH * scale)), S.canvas);
      }
    } else {
      S.renderer.compose(p, now(), S.canvas, { scale, before: S.before, getSource: sourceOf, seed: S.engine && S.engine.playing ? ++S.frameSeed : 0 });
    }
    S.view.classList.toggle("igfv-ed-transparent", !crop && p.bg.alpha < 1);
    const shownW = fullW * displayScale;
    const shownH = fullH * displayScale;
    S.view.style.width = `${shownW}px`;
    S.view.style.height = `${shownH}px`;
    S.view.style.left = `${(rect.width - shownW) / 2 + S.pan[0]}px`;
    S.view.style.top = `${(rect.height - shownH) / 2 + S.pan[1]}px`;
    drawOverlay();
    updateTopBar();
    if (S.histCanvas && !(S.engine && S.engine.playing)) drawHistogram();
  }

  function setZoom(z) {
    S.zoom = z;
    if (z === "fit") S.pan = [0, 0];
    requestRender();
  }

  function zoomBy(k) {
    const cur = S.zoom === "fit" ? S.fitScale || 1 : S.zoom;
    setZoom(M.clamp(cur * k, 0.05, 8));
  }

  // ---- stage: selection, handles, crop box -------------------------------------------------------------------
  function toFrac(e) {
    const r = S.canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / Math.max(1, r.width), (e.clientY - r.top) / Math.max(1, r.height)];
  }

  // A clip's box in canvas pixels (W × H canvas), or null when it has none to grab.
  function boxOf(clip, W, H) {
    if (M.VISUAL_MEDIA.has(clip.type)) return M.mediaBox(proj(), clip, W, H);
    if (L.TRANSFORMABLE.has(clip.type)) return L.boxPx(clip, W, H);
    return null;
  }

  // ---- keyframes: the clip as it is now, and changes to it ----------------------------------------------
  // A clip with its keyframed values at the playhead.
  function live(clip) {
    return clip && clip.kf && clip.kf.length ? M.animated(clip, M.clamp(now() - clip.start, 0, clip.dur)) : clip;
  }

  // Sets transform values of a clip (inside a change): with keyframes, on the keyframe at the playhead
  // (made if there's none there); else on the clip.
  function writeTransform(c, patch) {
    if (c.kf && c.kf.length) {
      const props = new Set(M.kfProps(c.type));
      const keyed = {};
      for (const [k, v] of Object.entries(patch)) {
        if (props.has(k)) keyed[k] = v;
        else c[k] = v;
      }
      M.patchAt(c, M.clamp(now() - c.start, 0, c.dur), keyed);
    } else Object.assign(c, patch);
  }

  // Where a clip shows on the canvas: { at: { cx, cy, rotation }, box: { w, h } px }. A split-screen
  // box is its region (its picture may be zoomed out inside it).
  function shownBox(clip, W, H) {
    if (clip.split && clip.region) {
      const r = clip.region;
      return { at: { ...clip, cx: r.x + r.w / 2, cy: r.y + r.h / 2, rotation: 0 }, box: { w: r.w * W, h: r.h * H } };
    }
    const seen = live(clip);
    const box = boxOf(seen, W, H);
    return box ? { at: seen, box } : null;
  }

  function topHitAt(fx, fy) {
    const p = proj();
    const W = p.w;
    const H = p.h;
    const list = M.activeClips(p, now()).reverse();
    for (const clip of list) {
      const tr = M.trackOf(p, clip.track);
      if (tr && tr.locked) continue;
      const shown = shownBox(clip, W, H);
      if (shown && L.hitBox(shown.at, fx, fy, W, H, shown.box)) return clip;
    }
    return null;
  }

  function drawOverlay() {
    const o = S.overlay;
    o.textContent = "";
    const crop = cropTarget();
    if (crop) return drawCropBox(o, crop);
    const clip = selectedClip();
    if (!clip || clip.cx == null) return;
    const p = proj();
    if (!M.activeClips(p, now()).some((c) => c.id === clip.id)) return;
    const shown = shownBox(clip, p.w, p.h);
    if (!shown) return;
    const box = shown.box;
    const k = S.displayScale;
    const b = el("div", "igfv-ed-box");
    b.style.left = `${shown.at.cx * 100}%`;
    b.style.top = `${shown.at.cy * 100}%`;
    b.style.width = `${box.w * k}px`;
    b.style.height = `${Math.max(box.h * k, clip.shape === "line" || clip.shape === "arrow" ? 14 : 0)}px`;
    b.style.transform = `translate(-50%, -50%) rotate(${clip.rotation || 0}deg)`;
    // A split-screen box: its sides and corners resize it (width and height on their own).
    if (clip.split) {
      for (const hnd of ["nw", "n", "ne", "e", "se", "s", "sw", "w"]) {
        const h = el("div", `igfv-ed-handle igfv-ed-${hnd}`);
        h.dataset.handle = `r-${hnd}`;
        h.title = "Resize the box (Shift on a corner: keep its shape)";
        b.appendChild(h);
      }
      o.appendChild(b);
      return;
    }
    for (const corner of ["nw", "ne", "sw", "se"]) {
      const h = el("div", `igfv-ed-handle igfv-ed-${corner}`);
      h.dataset.handle = corner;
      b.appendChild(h);
    }
    const rot = el("div", "igfv-ed-handle igfv-ed-rot");
    rot.dataset.handle = "rotate";
    rot.title = "Rotate (Shift: 15° steps)";
    b.appendChild(rot);
    o.appendChild(b);
  }

  function drawCropBox(o, clip) {
    const c = clip.crop;
    const box = el("div", "igfv-ed-crop");
    box.style.left = `${c.x * 100}%`;
    box.style.top = `${c.y * 100}%`;
    box.style.width = `${c.w * 100}%`;
    box.style.height = `${c.h * 100}%`;
    box.style.transform = c.angle ? `rotate(${c.angle}deg)` : "";
    box.dataset.handle = "move";
    for (const hnd of ["nw", "n", "ne", "e", "se", "s", "sw", "w"]) {
      const h = el("div", `igfv-ed-handle igfv-ed-${hnd}`);
      h.dataset.handle = hnd;
      box.appendChild(h);
    }
    box.appendChild(el("div", "igfv-ed-thirds"));
    o.appendChild(box);
  }

  function onStageDown(e) {
    if (!S || !S.history) return;
    S.focus = "canvas";
    if (e.button === 1) {
      S.drag = { kind: "pan", x: e.clientX, y: e.clientY, pan: [...S.pan], id: e.pointerId };
      S.stage.setPointerCapture?.(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const [fx, fy] = toFrac(e);
    if (S.pickKey) return pickKeyAt(fx, fy);
    const handle = e.target instanceof Element && e.target.dataset ? e.target.dataset.handle : null;
    S.stage.setPointerCapture?.(e.pointerId);
    const crop = cropTarget();
    if (crop) {
      if (!handle) return;
      S.drag = { kind: "crop", handle, start: [fx, fy], crop: { ...crop.crop }, clipId: crop.id, id: e.pointerId };
      return;
    }
    const clip = selectedClip();
    if (handle && clip && handle.startsWith("r-")) {
      S.drag = { kind: "region", hnd: handle.slice(2), clipId: clip.id, start: [fx, fy], region: regionOf(proj(), clip), crop: { ...clip.crop }, id: e.pointerId };
      return;
    }
    if (handle && clip) {
      S.drag = { kind: handle === "rotate" ? "rotate" : "scale", clip: M.clone(live(clip)), start: [fx, fy], id: e.pointerId };
      return;
    }
    // Region (blur / pixelate) and shape tools: pressing on one of their boxes moves it; pressing
    // elsewhere draws a new one.
    const regionTool = S.tool === "retouch" && (S.retouch.mode === "blur" || S.retouch.mode === "pixelate");
    if (regionTool || S.tool === "shapes") {
      const hit = topHitAt(fx, fy);
      if (hit && (regionTool ? hit.type === "blur" || hit.type === "pixelate" : hit.type === "shape")) {
        pickOnCanvas(hit);
        S.drag = { kind: "move", clip: M.clone(live(hit)), start: [fx, fy], id: e.pointerId, members: groupMembers(hit) };
        afterChange(true);
        return;
      }
    }
    if (S.tool === "draw") return startStroke(fx, fy, e);
    if (S.tool === "retouch") return startRetouch(fx, fy, e);
    if (S.tool === "shapes") {
      S.drag = { kind: "newShape", start: [fx, fy], id: e.pointerId, created: null };
      return;
    }
    const hit = topHitAt(fx, fy);
    pickOnCanvas(hit);
    if (hit && hit.split && !e.altKey && !M.trackOf(proj(), hit.track).locked) {
      S.drag = { kind: "panin", clipId: hit.id, start: [fx, fy], crop: { ...hit.crop }, boxZoom: hit.boxZoom, boxPan: { ...(hit.boxPan || { x: 0, y: 0 }) }, id: e.pointerId };
      if (!S.splitHinted) {
        S.splitHinted = true;
        toast("Split-screen box: drag moves the picture inside it, the wheel zooms it, Alt+drag moves the box");
      }
    } else if (hit) S.drag = { kind: "move", clip: M.clone(live(hit)), start: [fx, fy], id: e.pointerId, members: groupMembers(hit) };
    afterChange(true);
  }

  // ---- groups (the pieces of a template move together) ------------------------------------------------
  function groupMembers(clip) {
    if (!clip || clip.group == null) return null;
    const list = proj().clips.filter((c) => c.group === clip.group && c.cx != null && !M.trackOf(proj(), c.track).locked);
    return list.length > 1 ? list.map((c) => ({ id: c.id, cx: live(c).cx, cy: live(c).cy })) : null;
  }

  function addGroupOf(id) {
    const clip = id != null ? M.clipOf(proj(), id) : null;
    if (!clip || clip.group == null) return;
    const list = proj().clips.filter((c) => c.group === clip.group);
    if (list.length > 1) list.forEach((c) => S.clipSel.add(c.id));
  }

  // A click on the canvas: that item (and its group) selected.
  function pickOnCanvas(hit) {
    S.clipSel.clear();
    S.transPick = null;
    S.selected = hit ? hit.id : null;
    if (hit) addGroupOf(hit.id);
  }

  function ungroup(clipId) {
    const clip = M.clipOf(proj(), clipId);
    if (!clip || clip.group == null) return;
    const g = clip.group;
    change((p) => p.clips.forEach((c) => c.group === g && delete c.group), null, { inspector: true });
    S.clipSel.clear();
    afterChange(true);
    toast("Ungrouped: each piece moves on its own");
  }

  function onStageMove(e) {
    const d = S && S.drag;
    if (!d || e.pointerId !== d.id) return;
    if (d.kind === "pan") {
      S.pan = [d.pan[0] + e.clientX - d.x, d.pan[1] + e.clientY - d.y];
      if (S.zoom === "fit") S.zoom = S.fitScale;
      requestRender();
      return;
    }
    const [fx, fy] = toFrac(e);
    const dx = d.start ? fx - d.start[0] : 0;
    const dy = d.start ? fy - d.start[1] : 0;
    if (d.kind === "crop") return dragCrop(d, dx, dy, e.shiftKey);
    if (d.kind === "panin") return panInBox(d, dx, dy);
    if (d.kind === "region") return dragRegion(d, dx, dy, e.shiftKey);
    if (d.kind === "move") {
      let cx = d.clip.cx + dx;
      let cy = d.clip.cy + dy;
      if (Math.abs(cx - 0.5) < 0.012) cx = 0.5;
      if (Math.abs(cy - 0.5) < 0.012) cy = 0.5;
      if (d.members) {
        // a group: every piece by the same amount
        const ox = cx - d.clip.cx;
        const oy = cy - d.clip.cy;
        change((p) => d.members.forEach((m) => M.clipOf(p, m.id) && writeTransform(M.clipOf(p, m.id), { cx: m.cx + ox, cy: m.cy + oy })), `move-${d.clip.id}`);
        return;
      }
      change((p) => {
        const c = M.clipOf(p, d.clip.id);
        writeTransform(c, { cx, cy });
        // a split-screen box: its region goes with it
        if (c.region) {
          const r0 = d.clip.region || regionOf(p, d.clip);
          c.region = { ...r0, x: r0.x + (cx - d.clip.cx), y: r0.y + (cy - d.clip.cy) };
        }
      }, `move-${d.clip.id}`);
      return;
    }
    if (d.kind === "scale") return dragScale(d, fx, fy, e.shiftKey);
    if (d.kind === "rotate") {
      const p = proj();
      let a = (Math.atan2((fy - d.clip.cy) * p.h, (fx - d.clip.cx) * p.w) * 180) / Math.PI + 90;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      else {
        const m = ((a % 90) + 90) % 90;
        if (m < 3 || m > 87) a = Math.round(a / 90) * 90;
      }
      change((q) => writeTransform(M.clipOf(q, d.clip.id), { rotation: ((a + 540) % 360) - 180 }), `rot-${d.clip.id}`);
      return;
    }
    if (d.kind === "stroke") return continueStroke(fx, fy);
    if (d.kind === "newShape") return dragNewShape(d, fx, fy, e.shiftKey);
    if (d.kind === "newRegion") return dragNewRegion(d, fx, fy);
  }

  function onStageUp(e) {
    const d = S && S.drag;
    if (!d || e.pointerId !== d.id) return;
    S.drag = null;
    S.history.endMerge();
    afterChange(true);
  }

  function onStageDblClick() {
    const clip = selectedClip();
    if (clip && clip.type === "text") {
      const area = S.inspector.querySelector("textarea");
      if (area) {
        area.focus();
        area.select();
      }
    }
  }

  function dragCrop(d, dx, dy, shift) {
    const p = proj();
    const clip = M.clipOf(p, d.clipId);
    const media = p.media[clip.media];
    const c0 = d.crop;
    let { x, y, w, h } = c0;
    const hnd = d.handle;
    const min = 0.05;
    if (hnd === "move") {
      x = M.clamp(c0.x + dx, 0, 1 - w);
      y = M.clamp(c0.y + dy, 0, 1 - h);
    } else {
      let x1 = c0.x;
      let y1 = c0.y;
      let x2 = c0.x + c0.w;
      let y2 = c0.y + c0.h;
      if (hnd.includes("w")) x1 = M.clamp(c0.x + dx, 0, x2 - min);
      if (hnd.includes("e")) x2 = M.clamp(c0.x + c0.w + dx, x1 + min, 1);
      if (hnd.includes("n")) y1 = M.clamp(c0.y + dy, 0, y2 - min);
      if (hnd.includes("s")) y2 = M.clamp(c0.y + c0.h + dy, y1 + min, 1);
      x = x1;
      y = y1;
      w = x2 - x1;
      h = y2 - y1;
      const [ow, oh] = M.orientedSize(media, c0);
      const ratio = M.aspectRatioOf(c0, media) || (shift ? (c0.w * ow) / (c0.h * oh) : null);
      if (ratio) {
        const fr = (ratio * oh) / ow;
        if (hnd === "n" || hnd === "s") w = h * fr;
        else if (hnd === "e" || hnd === "w") h = w / fr;
        else if (w / h > fr) w = h * fr;
        else h = w / fr;
        if (w > 1) {
          w = 1;
          h = w / fr;
        }
        if (h > 1) {
          h = 1;
          w = h * fr;
        }
        if (hnd.includes("w")) x = c0.x + c0.w - w;
        if (hnd.includes("n")) y = c0.y + c0.h - h;
        if (hnd === "n" || hnd === "s") x = c0.x + (c0.w - w) / 2;
        if (hnd === "e" || hnd === "w") y = c0.y + (c0.h - h) / 2;
        x = M.clamp(x, 0, 1 - w);
        y = M.clamp(y, 0, 1 - h);
      }
    }
    change((q) => Object.assign(M.clipOf(q, d.clipId).crop, { x, y, w, h }), "crop-drag");
  }

  function dragScale(d, fx, fy, shift) {
    const c0 = d.clip;
    const p = proj();
    const W = p.w;
    const H = p.h;
    const a = (-(c0.rotation || 0) * Math.PI) / 180;
    const local = (px, py) => {
      const dx = (px - c0.cx) * W;
      const dy = (py - c0.cy) * H;
      return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
    };
    const [sx, sy] = local(...d.start);
    const [nx, ny] = local(fx, fy);
    const k = Math.max(0.02, Math.hypot(nx, ny) / Math.max(1, Math.hypot(sx, sy)));
    change((q) => {
      const c = M.clipOf(q, c0.id);
      if (c.region && !c.split) delete c.region; // resized by hand: no longer laid out in its slot
      if (M.VISUAL_MEDIA.has(c.type)) writeTransform(c, { scale: M.clamp(c0.scale * k, 0.02, 20) });
      else if (c.type === "text" || c.type === "sticker" || c.type === "asticker") {
        writeTransform(c, { size: M.clamp(c0.size * k, 0.01, 2) });
        L.remeasure(c, W, H);
      } else if (shift || c.shape === "line" || c.shape === "arrow") {
        writeTransform(c, c.shape === "line" || c.shape === "arrow" ? { w: c0.w * k } : { w: c0.w * k, h: c0.h * k });
      } else {
        writeTransform(c, { w: Math.max(4, Math.abs(nx) * 2) / W, h: Math.max(4, Math.abs(ny) * 2) / H });
      }
    }, `scale-${c0.id}`);
  }

  // ---- adding clips -------------------------------------------------------------------------------------
  // A visual clip on the top video track when it's free there, else on a new track above everything.
  function placeOnTop(p, clip) {
    const vt = M.tracksOf(p, "video");
    const topTrack = vt[vt.length - 1];
    return M.placeClip(p, clip, { track: topTrack && !topTrack.locked ? topTrack.id : null, newTrack: true });
  }

  // Start / length for a new overlay or still at the playhead.
  function newClipTiming(p) {
    if (M.isStill(p)) return { start: 0, dur: M.STILL_DUR };
    const start = now();
    const rest = M.duration(p) - start;
    const own = S.settings && S.settings.io.overlayDur; // Settings: a fixed length, else to the end
    if (own > 0) return { start, dur: own };
    return { start, dur: rest >= 1 ? rest : M.STILL_DUR };
  }

  function addOverlay(type, props = {}) {
    let id = null;
    change((p) => {
      const clip = L.make(p, type, props);
      Object.assign(clip, newClipTiming(p));
      L.remeasure(clip, p.w, p.h);
      placeOnTop(p, clip);
      id = clip.id;
    });
    select(id);
    return id;
  }

  function addMediaClip(mediaId, { time = null, track = null } = {}) {
    let id = null;
    change((p) => {
      const kind = p.media[mediaId].kind;
      const start = M.isStill(p) && kind === "image" ? 0 : time ?? now();
      const clip = M.mediaClip(p, mediaId, { start });
      if (kind === "audio") M.placeClip(p, clip, { track });
      else if (track && M.trackOf(p, track) && M.trackOf(p, track).kind === "video") M.placeClip(p, clip, { track, newTrack: true });
      else placeOnTop(p, clip);
      if (S.settings && S.settings.io.addFill && M.VISUAL_MEDIA.has(clip.type)) clip.scale = M.fillScale(p, clip);
      id = clip.id;
    });
    select(id);
    S.timeline.autoFit = true;
    afterChange(true);
    return id;
  }

  function deleteSelected() {
    const id = S.selected;
    if (id == null) return;
    if (S.clipSel.size > 1) return deleteClips(selectedIds());
    const other = M.partner(proj(), M.clipOf(proj(), id));
    change((p) => M.deleteLinked(p, id));
    S.renderer.forget(id);
    if (other) S.renderer.forget(other.id);
    S.selected = null;
    afterChange(true);
  }

  // ---- several selected clips ------------------------------------------------------------------------
  // The selected clips' ids: the Ctrl+clicked ones, else the selected clip.
  function selectedIds() {
    const p = proj();
    const ids = S.clipSel.size ? [...S.clipSel] : S.selected != null ? [S.selected] : [];
    return ids.filter((id) => M.clipOf(p, id));
  }

  // Ctrl+click on a clip: adds it to the selected clips (the clip selected before comes along) or
  // takes it out.
  function toggleClip(id) {
    const sel = S.clipSel;
    if (!sel.size && S.selected != null && S.selected !== id) sel.add(S.selected);
    if (sel.has(id)) {
      sel.delete(id);
      if (S.selected === id) S.selected = sel.size ? [...sel].pop() : null;
    } else {
      sel.add(id);
      S.selected = id;
    }
    if (sel.size < 2) sel.clear();
    S.focus = "timeline";
    afterChange(true);
    const n = selectedIds().length;
    if (n > 1) toast(`${n} clips selected · drag one or press ← / → to move them`);
  }

  // Moves the selected clips (not on locked tracks) by dt seconds; they stop at 0:00 and at the
  // clips next to them, or with Push on push those along. Returns the dt applied.
  function shiftSelectedClips(dt, mergeKey = null, opts = { push: S.push }) {
    const p = proj();
    const ids = selectedIds().filter((id) => {
      const tr = M.trackOf(p, M.clipOf(p, id).track);
      return tr && !tr.locked;
    });
    if (!ids.length) {
      if (selectedIds().length) toast("Those clips are on locked tracks");
      return 0;
    }
    const test = M.shiftClips(M.clone(p), ids, dt, opts);
    if (!test) return 0;
    let applied = 0;
    change((q) => (applied = M.shiftClips(q, ids, dt, opts)), mergeKey);
    return applied;
  }

  // Moves the selected clips so the first starts at 0:00, or after everything else; their spacing
  // is kept.
  function sendClips(where) {
    const p = proj();
    const ids = new Set(selectedIds());
    const mine = p.clips.filter((c) => ids.has(c.id));
    if (!mine.length) return;
    mine.map((c) => M.partner(p, c)).filter(Boolean).forEach((c) => ids.add(c.id));
    const first = Math.min(...mine.map((c) => c.start));
    const last = Math.max(...mine.map((c) => c.start + c.dur));
    const others = p.clips.filter((c) => !ids.has(c.id));
    const end = others.length ? Math.max(...others.map((c) => c.start + c.dur)) : 0;
    if (where === "align-end" && !others.length) return toast("Nothing else on the timeline to line up with");
    const dt = where === "start" ? -first : where === "align-end" ? end - last : end - first;
    if (Math.abs(dt) < 1e-6) return toast("Already there");
    if (!shiftSelectedClips(dt, null, { stop: false })) return toast("Other clips are in the way");
    toast(where === "start" ? "Moved to the timeline start" : where === "align-end" ? "Adjusted to the timeline end" : "Moved to the timeline end");
  }

  // The selected clips' targets for a track move. how: +1 / -1 (one track up / down on the
  // timeline, each from its own track), "top", "bottom" or { track: id }. allowNew: past the outer
  // track (video: above the top; audio: below the bottom) a new track is added.
  function relevel(q, ids, how, allowNew = false) {
    const made = {};
    const targetOf = (c) => {
      const kind = M.trackKindFor(c.type);
      const list = M.tracksOf(q, kind); // bottom first (video); A1 first (audio)
      const up = kind === "video" ? 1 : -1; // the list direction that's up on the timeline
      if (how && how.track != null) return how.track;
      if (how === "top") return (up > 0 ? list[list.length - 1] : list[0]).id;
      if (how === "bottom") return (up > 0 ? list[0] : list[list.length - 1]).id;
      const step = how * up;
      const t = list[list.findIndex((x) => x.id === c.track) + step];
      if (t) return t.id;
      if (!allowNew || step < 0) return null;
      return (made[kind] = made[kind] || M.addTrack(q, kind)).id;
    };
    return M.moveClipsToTracks(q, ids, targetOf);
  }

  function relevelSelected(how) {
    const p = proj();
    const ids = selectedIds();
    if (!ids.length) return;
    if (ids.some((id) => M.trackOf(p, M.clipOf(p, id).track).locked)) return toast("Some of them are on locked tracks");
    if (!relevel(M.clone(p), ids, how, true)) return toast(typeof how === "number" ? `The track ${how > 0 ? "above" : "below"} isn't free there` : "The target track isn't free there");
    change((q) => relevel(q, ids, how, true));
    toast(ids.length > 1 ? `Moved ${ids.length} clips` : "Moved");
  }

  // A drag of the selected clips: dt seconds in time and `level` tracks up / down (rows of the
  // dragged clip's kind; no new tracks); push: the clips in their way are pushed along (after a
  // change of track, on the new track). ids: these clips instead of the selected ones. Returns
  // { applied, leveled }.
  function moveSelectedClips(dt, level, mergeKey, { push = S.push, ids: only = null } = {}) {
    const p = proj();
    const ids = (only || selectedIds()).filter((id) => M.clipOf(p, id) && !M.trackOf(p, M.clipOf(p, id).track).locked);
    if (!ids.length) return { applied: 0, leveled: false };
    const test = M.clone(p);
    // level counts rows in the dragged clip's list order; relevel() takes "up" steps.
    const kindOf = M.trackKindFor(M.clipOf(p, ids[0]).type);
    const up = kindOf === "video" ? level : -level;
    const leveled = Boolean(level) && relevel(test, ids, up);
    const applied = dt ? M.shiftClips(test, ids, dt, { push }) : 0;
    if (!leveled && !applied) return { applied: 0, leveled: false };
    change((q) => {
      if (leveled) relevel(q, ids, up);
      if (applied) M.shiftClips(q, ids, dt, { push });
    }, mergeKey);
    return { applied, leveled };
  }

  // The Push option (remembered with the layout).
  function setPush(on, save = true) {
    S.push = on;
    if (S.pushBtn) S.pushBtn.classList.toggle("igfv-on", on);
    if (save) {
      saveUiPrefs();
      toast(on ? "Push on: moving clips pushes the clips in their way along" : "Push off: moving clips stop at the clips next to them");
    }
  }

  // ---- transitions on the timeline ---------------------------------------------------------------------
  function showTransition(clipId) {
    select(clipId);
    S.transPick = clipId;
    setTool("transitions");
    if (S.timeline) S.timeline.draw();
  }

  function removeTransition(clipId) {
    const clip = M.clipOf(proj(), clipId);
    if (!clip || !clip.transIn) return;
    setClip(clipId, (c) => delete c.transIn, null, true);
    S.transPick = null;
    toast("Transition removed (Ctrl+Z brings it back)");
  }

  function setTransitionType(clipId, type) {
    setClip(clipId, (c) => c.transIn && (c.transIn.type = type), null, true);
  }

  function deleteClips(ids) {
    const p = proj();
    const gone = ids.filter((id) => {
      const tr = M.trackOf(p, M.clipOf(p, id).track);
      return tr && !tr.locked;
    });
    if (!gone.length) return toast("Those clips are on locked tracks");
    const forget = new Set(gone);
    gone.forEach((id) => {
      const o = M.partner(p, M.clipOf(p, id));
      if (o) forget.add(o.id);
    });
    change((q) => gone.forEach((id) => M.clipOf(q, id) && M.deleteLinked(q, id)));
    forget.forEach((id) => S.renderer.forget(id));
    S.clipSel.clear();
    S.selected = null;
    afterChange(true);
    toast(`Deleted ${gone.length} clips`);
  }

  function duplicateSelected() {
    const id = S.selected;
    if (id == null) return;
    let copy = null;
    change((p) => (copy = M.duplicateLinked(p, id)));
    if (copy) select(copy.id);
  }

  function splitAtPlayhead() {
    const t = now();
    const p = proj();
    const sel = selectedClip();
    const targets = sel && t > sel.start && t < sel.start + sel.dur ? [sel.id] : p.clips.filter((c) => !M.trackOf(p, c.track).locked && t > c.start && t < c.start + c.dur).map((c) => c.id);
    if (!targets.length) return toast("Move the playhead over a clip to split it");
    // A joined partner is cut with its clip (once).
    const p0 = proj();
    const once = targets.filter((id) => {
      const o = M.partner(p0, M.clipOf(p0, id));
      return !o || !targets.includes(o.id) || id < o.id;
    });
    change((q) => once.forEach((id) => M.splitLinked(q, id, t)));
    toast(targets.length > 1 ? `Split ${targets.length} clips` : "Split");
  }

  // ---- track rows: selection, moving them in time ---------------------------------------------------------
  // mode: "only" | "toggle" | "range" | "keep"; id null clears the selection.
  function selectTrack(id, mode = "only") {
    const sel = S.trackSel;
    if (id == null) sel.clear();
    else if (mode === "toggle") sel.has(id) ? sel.delete(id) : sel.add(id);
    else if (mode === "range" && sel.size) {
      const order = timelineOrder();
      const last = [...sel].pop();
      const [a, b] = [order.indexOf(last), order.indexOf(id)].sort((x, y) => x - y);
      for (const t of order.slice(a, b + 1)) sel.add(t);
    } else if (mode !== "keep" || !sel.has(id)) {
      sel.clear();
      sel.add(id);
    }
    if (id != null) S.focus = "timeline";
    if (S.timeline) S.timeline.draw();
  }

  // Track ids top to bottom, as the timeline lists them.
  function timelineOrder() {
    const p = proj();
    return [...M.tracksOf(p, "video")].reverse().concat(M.tracksOf(p, "audio")).map((t) => t.id);
  }

  // Moves the selected tracks' clips by dt seconds (one undo step per merge key); returns the dt
  // applied (none before 0:00; locked tracks stay).
  function shiftSelectedTracks(dt, mergeKey = null, sel = S.trackSel) {
    const p = proj();
    const ids = [...sel].filter((id) => {
      const tr = M.trackOf(p, id);
      return tr && !tr.locked;
    });
    if (!ids.length) {
      if (sel.size) toast("Those tracks are locked");
      return 0;
    }
    let applied = 0;
    const test = M.shiftTracks(M.clone(p), ids, dt);
    if (!test) return 0;
    change((q) => (applied = M.shiftTracks(q, ids, dt)), mergeKey);
    return applied;
  }

  // Send the selected tracks (or the given ones) to the start (their first clip at 0:00) or to the end (after
  // everything on the other tracks), keeping their spacing.
  function sendTracks(where, sel = S.trackSel) {
    const p = proj();
    const ids = new Set(sel);
    const mine = p.clips.filter((c) => ids.has(c.track));
    if (!mine.length) return toast("No clips on the selected tracks");
    const first = Math.min(...mine.map((c) => c.start));
    // Joined partners of these clips move with them, so they don't count as "everything else".
    const along = new Set(mine.map((c) => M.partner(p, c)).filter(Boolean).map((c) => c.id));
    const others = p.clips.filter((c) => !ids.has(c.track) && !along.has(c.id));
    const end = others.length ? Math.max(...others.map((c) => c.start + c.dur)) : 0;
    if (where === "align-end" && !others.length) return toast("Nothing else on the timeline to line up with");
    const last = Math.max(...mine.map((c) => c.start + c.dur));
    const dt = where === "start" ? -first : where === "align-end" ? end - last : end - first;
    if (Math.abs(dt) < 1e-6) return toast("Already there");
    shiftSelectedTracks(dt, null, ids);
    toast(where === "start" ? "Moved to the timeline start" : where === "align-end" ? "Adjusted to the timeline end" : "Moved to the timeline end");
  }

  // ---- the Blade ---------------------------------------------------------------------------------------------
  function setBlade(on) {
    S.blade = on;
    if (S.bladeBtn) S.bladeBtn.classList.toggle("igfv-on", on);
    S.root.dataset.blade = on ? "1" : "";
    if (S.timeline) {
      S.timeline.bladeAt = null;
      S.timeline.canvas.style.cursor = "";
      S.timeline.draw();
    }
    if (on) toast("Blade: click a clip on the timeline to cut it (Esc: back)");
  }

  function bladeCut(clipId, t) {
    const p = proj();
    const clip = M.clipOf(p, clipId);
    if (!clip) return;
    const tr = M.trackOf(p, clip.track);
    if (tr && tr.locked) return toast("That track is locked");
    if (t <= clip.start + 0.05 || t >= clip.start + clip.dur - 0.05) return;
    let pieces = [];
    change((q) => (pieces = M.splitLinked(q, clipId, t)));
    toast(pieces.length > 1 ? "Cut (with its joined audio / video)" : "Cut");
  }

  // ---- joined audio --------------------------------------------------------------------------------------------
  function detachAudio(id) {
    const clip = M.clipOf(proj(), id);
    if (!clip || clip.type !== "video") return;
    const m = proj().media[clip.media];
    if (m && m.hasAudio === false) return toast("This video has no sound");
    let audio = null;
    change((q) => (audio = M.detachAudio(q, id)), null, { inspector: true });
    if (audio) toast(`Its sound is now on ${M.trackOf(proj(), audio.track).name}, joined to the video`);
  }

  function reattachAudio(id) {
    change((q) => M.reattachAudio(q, id), null, { inspector: true });
    toast("The sound is back in the video");
  }

  // The audio / video clip of the same media that overlaps this one most (to join them).
  function joinCandidate(clip) {
    const p = proj();
    const want = clip.type === "video" ? "audio" : "video";
    let best = null;
    let most = 0;
    for (const c of p.clips) {
      if (c.type !== want || c.media !== clip.media || c.id === clip.id) continue;
      const overlap = Math.min(c.start + c.dur, clip.start + clip.dur) - Math.max(c.start, clip.start);
      if (overlap > most) {
        most = overlap;
        best = c;
      }
    }
    return best;
  }

  function joinSelected() {
    const clip = selectedClip();
    if (!clip || (clip.type !== "video" && clip.type !== "audio")) return toast("Select a video or its audio clip to join them");
    if (M.partner(proj(), clip)) return toast("Already joined");
    const other = joinCandidate(clip);
    if (!other) return toast(clip.type === "video" ? "Detach its audio first (right-click the clip)" : "No video of the same media to join");
    change((q) => M.linkClips(q, clip.id, other.id), null, { inspector: true });
    toast("Joined: they move, trim and cut together");
  }

  function unjoinSelected() {
    const clip = selectedClip();
    if (!clip || !M.partner(proj(), clip)) return toast("Select a joined clip to unjoin it");
    change((q) => M.unlink(q, clip.id), null, { inspector: true });
    toast("Unjoined: they move, trim and cut separately");
  }

  // ---- media properties ------------------------------------------------------------------------------------------
  function aspectOf(w, h) {
    if (!w || !h) return "";
    const g = (a, b) => (b ? g(b, a % b) : a);
    const k = g(w, h);
    const a = `${w / k}:${h / k}`;
    return a.length <= 7 ? a : (w / h).toFixed(2);
  }

  // [[label, value, link?]] for a media item (and a clip of it).
  function mediaFacts(mediaId, clipId = null) {
    const p = proj();
    const m = p.media[mediaId];
    if (!m) return [];
    const stored = S.media.get(mediaId) || {};
    const blob = stored.blob;
    const kinds = { video: "Video", image: "Photo", gif: "Animated GIF", audio: "Audio" };
    const rows = [["Name", m.name], ["Type", kinds[m.kind] || m.kind]];
    if (m.w && m.h) rows.push(["Resolution", `${m.w} \u00d7 ${m.h}${aspectOf(m.w, m.h) ? `  (${aspectOf(m.w, m.h)})` : ""}`]);
    if (m.duration) rows.push(["Duration", E.formatTime(m.duration)]);
    const size = m.size || (blob && blob.size);
    if (size) rows.push(["File size", formatSize(size)]);
    const type = m.type || (blob && blob.type);
    if (type) rows.push(["Format", type]);
    if (m.kind === "video") rows.push(["Sound", m.hasAudio === true ? "Yes" : m.hasAudio === false ? "No" : "Unknown"]);
    if (m.source && m.source.code) {
      const link = `https://www.instagram.com/p/${m.source.code}/`;
      rows.push(["Source", `Instagram post ${m.source.code}${m.source.index ? ` (item ${m.source.index + 1})` : ""}`, link]);
    } else rows.push(["Source", "File"]);
    const bin = m.bin != null ? (p.bins || []).find((b) => b.id === m.bin) : null;
    rows.push(["Bin", bin ? bin.name : "Master"]);
    const used = p.clips.filter((c) => c.media === mediaId).length;
    rows.push(["Used", used ? `${used} clip${used === 1 ? "" : "s"} on the timeline` : "Not on the timeline"]);
    const clip = clipId != null ? M.clipOf(p, clipId) : null;
    if (clip) {
      const tr = M.trackOf(p, clip.track);
      rows.push(["Clip", `${tr ? tr.name : ""} \u00b7 ${E.formatTime(clip.start)} \u2013 ${E.formatTime(clip.start + clip.dur)} (${E.formatTime(clip.dur)})`]);
      if (clip.in != null) rows.push(["From the media", `${E.formatTime(clip.in)}${clip.speed && clip.speed !== 1 ? ` \u00b7 speed ${clip.speed}\u00d7` : ""}`]);
      const other = M.partner(p, clip);
      if (other) rows.push(["Joined to", `${other.type === "audio" ? "its audio" : "its video"} on ${(M.trackOf(p, other.track) || {}).name || ""}`]);
      else if (clip.audioOut) rows.push(["Sound", "Detached (unjoined)"]);
    }
    return rows;
  }

  function factsTable(rows) {
    const table = el("table", "igfv-ed-props");
    for (const [k, v, link] of rows) {
      const tr = el("tr");
      const td = el("td");
      if (link) {
        const a = el("a", "", { href: link, target: "_blank", rel: "noopener", text: v });
        td.appendChild(a);
      } else td.textContent = v;
      tr.append(el("th", "", { text: k }), td);
      table.appendChild(tr);
    }
    return table;
  }

  function openProperties(mediaId, clipId = null) {
    const rows = mediaFacts(mediaId, clipId);
    if (!rows.length) return;
    modal((card) => {
      card.classList.add("igfv-ed-propcard");
      card.append(el("h3", "", { text: "Properties" }), factsTable(rows));
      const row = el("div", "igfv-ed-buttons");
      const src = rows.find((r) => r[2]);
      if (src) row.appendChild(button("Copy link", "", () => navigator.clipboard.writeText(src[2]).then(() => toast("Link copied"), () => toast("Couldn't copy the link"))));
      row.appendChild(button("Close", "igfv-ed-primary", closeModal));
      card.appendChild(row);
    });
  }

  function poolTooltip(id) {
    const m = proj().media[id];
    if (!m) return "";
    const parts = [m.name, { video: "Video", image: "Photo", gif: "GIF", audio: "Audio" }[m.kind] || m.kind];
    if (m.w && m.h) parts.push(`${m.w}\u00d7${m.h}`);
    if (m.duration) parts.push(E.formatTime(m.duration));
    const size = m.size || ((S.media.get(id) || {}).blob || {}).size;
    if (size) parts.push(formatSize(size));
    return `${parts.join(" \u00b7 ")}\nRight-click: preview, add, insert, move to a bin, properties\u2026 \u00b7 Drag: onto a track or a bin`;
  }

  // Joins the selected clip with the piece of the same media touching it (as after a split).
  function mergeSelected() {
    const clip = selectedClip();
    if (!clip) return toast("Select a clip to merge it with the one next to it");
    const tr = M.trackOf(proj(), clip.track);
    if (tr && tr.locked) return toast("That track is locked");
    const test = M.mergeLinked(M.clone(proj()), clip.id);
    if (test.error) return toast(test.error === "gap" ? "Nothing touches this clip on its track" : "Merge joins pieces of the same media that touch (e.g. split clips)");
    let res = null;
    change((q) => (res = M.mergeLinked(q, clip.id)));
    S.renderer.forget(res.removed);
    select(res.clip.id);
    toast("Merged");
  }

  // Inserts the media picked in the pool at the playhead (ripple: later clips on the track move right).
  function insertPicked() {
    const id = S.poolPick;
    if (id == null || !proj().media[id]) return toast("Pick media in the pool (or preview one) to insert it");
    insertMediaAt(id);
  }

  // At the playhead (or `time`), on the selected clip's track (or `track`) when it's the right kind.
  function insertMediaAt(mediaId, { time = null, track: trackId = null } = {}) {
    const p = proj();
    const kind = p.media[mediaId].kind;
    if (M.isStill(p) && kind === "image") return addMediaClip(mediaId);
    const tk = M.trackKindFor(kind);
    const sel = selectedClip();
    const want = trackId != null ? M.trackOf(p, trackId) : sel && M.trackOf(p, sel.track);
    let track = want && want.kind === tk ? want : null;
    if (!track) {
      const list = M.tracksOf(p, tk);
      track = (tk === "video" ? [...list].reverse() : list).find((t) => !t.locked) || null;
    }
    if (track && track.locked) return toast("That track is locked");
    const t = time ?? now();
    let id = null;
    change((q) => {
      const trackId = track ? track.id : M.addTrack(q, tk).id;
      id = M.insertMedia(q, mediaId, trackId, t).id;
    });
    select(id);
    S.timeline.autoFit = true;
    afterChange(true);
    toast("Inserted at the playhead");
    return id;
  }

  function startStroke(fx, fy, e) {
    let clip = selectedClip();
    if (!clip || clip.type !== "draw") {
      addOverlay("draw", { cx: 0.5, cy: 0.5, w: 1, h: 1 });
      clip = selectedClip();
    }
    const b = S.brush;
    change((p) => {
      M.clipOf(p, clip.id).strokes.push({ mode: b.mode, size: b.size, hardness: b.hardness, color: b.color, opacity: b.opacity, points: [[fx, fy]] });
    }, `stroke-${clip.id}-${Date.now()}`);
    S.drag = { kind: "stroke", clipId: clip.id, id: e.pointerId };
  }

  function continueStroke(fx, fy) {
    const id = S.drag.clipId;
    change((p) => {
      const c = M.clipOf(p, id);
      const stroke = c.strokes[c.strokes.length - 1];
      const last = stroke.points[stroke.points.length - 1];
      if (Math.hypot(fx - last[0], fy - last[1]) > 0.002) stroke.points.push([fx, fy]);
    }, S.history.mergeKey);
  }

  function startRetouch(fx, fy, e) {
    const r = S.retouch;
    if (r.mode === "blur" || r.mode === "pixelate") {
      S.drag = { kind: "newRegion", start: [fx, fy], id: e.pointerId, created: null };
      return;
    }
    if (r.mode === "clone" && (e.altKey || !r.cloneFrom)) {
      r.cloneFrom = [fx, fy];
      toast("Clone source set — now paint where it should go");
      return;
    }
    let clip = selectedClip();
    if (!clip || clip.type !== "retouch") {
      addOverlay("retouch", { cx: 0.5, cy: 0.5, w: 1, h: 1 });
      clip = selectedClip();
    }
    let dx;
    let dy;
    if (r.mode === "clone") {
      dx = r.cloneFrom[0] - fx;
      dy = r.cloneFrom[1] - fy;
    } else {
      const off = L.healOffset(S.canvas, fx, fy, r.size);
      dx = off.dx;
      dy = off.dy;
    }
    change((p) => {
      M.clipOf(p, clip.id).strokes.push({ mode: r.mode, size: r.size, dx, dy, points: [[fx, fy]] });
    }, `retouch-${clip.id}-${Date.now()}`);
    S.drag = { kind: "stroke", clipId: clip.id, id: e.pointerId };
  }

  function dragNewShape(d, fx, fy, shift) {
    const [x0, y0] = d.start;
    const p = proj();
    const W = p.w;
    const H = p.h;
    const sh = S.shape;
    let props;
    if (sh.shape === "line" || sh.shape === "arrow") {
      const dx = (fx - x0) * W;
      const dy = (fy - y0) * H;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (shift) angle = Math.round(angle / 15) * 15;
      props = { cx: (x0 + fx) / 2, cy: (y0 + fy) / 2, w: Math.hypot(dx, dy) / W, h: sh.strokeWidth * 3, rotation: angle };
    } else {
      let w = Math.abs(fx - x0);
      let h = Math.abs(fy - y0);
      if (shift) {
        const s = Math.max(w * W, h * H);
        w = s / W;
        h = s / H;
      }
      props = { cx: x0 + (Math.sign(fx - x0) * w) / 2, cy: y0 + (Math.sign(fy - y0) * h) / 2, w, h, rotation: 0 };
    }
    if (Math.max(props.w * W, (props.h || 0) * H) < 4) return;
    if (!d.created) {
      d.created = addOverlay("shape", { shape: sh.shape, fill: sh.fill, stroke: sh.stroke, strokeWidth: sh.strokeWidth, ...props });
      d.mergeKey = `shape-${d.created}`;
      S.history.mergeKey = d.mergeKey;
      return;
    }
    change((q) => Object.assign(M.clipOf(q, d.created), props), d.mergeKey);
  }

  function dragNewRegion(d, fx, fy) {
    const [x0, y0] = d.start;
    const w = Math.abs(fx - x0);
    const h = Math.abs(fy - y0);
    if (w < 0.01 || h < 0.01) return;
    const props = { cx: (x0 + fx) / 2, cy: (y0 + fy) / 2, w, h };
    if (!d.created) {
      d.created = addOverlay(S.retouch.mode, { shape: S.retouch.shape, strength: S.retouch.strength, ...props });
      d.mergeKey = `region-${d.created}`;
      S.history.mergeKey = d.mergeKey;
      return;
    }
    change((q) => Object.assign(M.clipOf(q, d.created), props), d.mergeKey);
  }

  // ---- left panel: sources over the media pool --------------------------------------------------------
  const UI_KEY = "lucymixer.editorUi";

  function loadUiPrefs() {
    store()
      .get(UI_KEY)
      .then((stored) => {
        const ui = stored[UI_KEY] || {};
        if (!S) return;
        if (ui.leftHidden) toggleLeft(true);
        if (ui.sourcesH) S.sourcesEl.style.height = `${ui.sourcesH}px`;
        if (ui.sideHidden) toggleSide(true);
        if (ui.sideW) setSideWidth(clampSideWidth(ui.sideW));
        if (ui.leftW) setLeftWidth(clampLeftWidth(ui.leftW));
        if (ui.timelineH) setTimelineHeight(clampTimelineHeight(ui.timelineH));
        if (ui.tileSize) setTileSize(ui.tileSize);
        if (ui.push) setPush(true, false);
        if (ui.previewVol != null) setPreviewVol(ui.previewVol, false);
        if (ui.trackH) {
          S.trackH = ui.trackH;
          if (S.timeline) S.timeline.setTrackH(ui.trackH);
        }
      })
      .catch(() => {});
  }

  function saveUiPrefs() {
    const ui = {
      leftHidden: S.root.classList.contains("igfv-ed-left-hidden"),
      sourcesH: parseInt(S.sourcesEl.style.height, 10) || null,
      leftW: S.leftW || null,
      sideHidden: S.root.classList.contains("igfv-ed-side-hidden"),
      sideW: S.sideW || null,
      timelineH: S.timelineH || null,
      tileSize: S.tileSize || null,
      trackH: S.trackH || null,
      push: S.push || false,
      previewVol: S.previewVol ?? 1,
    };
    store().set({ [UI_KEY]: ui }).catch(() => {});
  }

  function toggleLeft(hide) {
    const hidden = typeof hide === "boolean" ? hide : !S.root.classList.contains("igfv-ed-left-hidden");
    S.root.classList.toggle("igfv-ed-left-hidden", hidden);
    S.leftToggle.textContent = hidden ? "\u203a" : "\u2039";
    S.leftToggle.title = hidden ? "Show the media panel (\\)" : "Hide the media panel (\\)";
    if (typeof hide !== "boolean") saveUiPrefs();
    requestRender();
    if (S.timeline) S.timeline.draw();
  }

  function toggleSide(hide) {
    const hidden = typeof hide === "boolean" ? hide : !S.root.classList.contains("igfv-ed-side-hidden");
    S.root.classList.toggle("igfv-ed-side-hidden", hidden);
    S.sideToggle.textContent = hidden ? "\u2039" : "\u203a";
    S.sideToggle.title = hidden ? "Show the side panel (|)" : "Hide the side panel (|)";
    if (typeof hide !== "boolean") saveUiPrefs();
    relayout();
  }

  function relayout() {
    requestRender();
    if (S.timeline) S.timeline.draw();
  }

  // Panel sizes (null = the default), dragged at their inner edges. The stage keeps at least STAGE_MIN.
  const LEFT_MIN = 180;
  const SIDE_MIN = 220;
  const STAGE_MIN = 240;
  const RAIL_W = 72;
  function rootRect() {
    const r = S.root && S.root.getBoundingClientRect();
    return { w: (r && r.width) || 1600, h: (r && r.height) || 900 };
  }

  function panelWidth(cls, hiddenCls) {
    if (S.root.classList.contains(hiddenCls)) return 0;
    const node = S.root.querySelector(cls);
    return (node && node.getBoundingClientRect().width) || 0;
  }

  function clampLeftWidth(w) {
    const editorW = rootRect().w;
    const room = editorW - panelWidth(".igfv-ed-side", "igfv-ed-side-hidden") - RAIL_W - STAGE_MIN;
    return Math.round(M.clamp(w, LEFT_MIN, Math.max(LEFT_MIN, Math.min(720, editorW * 0.55, room))));
  }

  function clampSideWidth(w) {
    const editorW = rootRect().w;
    const room = editorW - panelWidth(".igfv-ed-left", "igfv-ed-left-hidden") - RAIL_W - STAGE_MIN;
    return Math.round(M.clamp(w, SIDE_MIN, Math.max(SIDE_MIN, Math.min(640, editorW * 0.45, room))));
  }

  function clampTimelineHeight(h) {
    return Math.round(M.clamp(h, 90, Math.max(90, Math.min(700, rootRect().h * 0.65))));
  }

  function setSize(key, prop, v) {
    S[key] = v || null;
    if (S[key]) S.root.style.setProperty(prop, `${S[key]}px`);
    else S.root.style.removeProperty(prop);
    relayout();
  }

  const setLeftWidth = (w) => setSize("leftW", "--igfv-ed-left-w", w);
  const TILE_DEFAULT = 72;
  function setTileSize(px) {
    S.tileSize = px ? Math.round(M.clamp(px, 48, 220)) : null;
    if (S.tileSize && S.tileSize !== TILE_DEFAULT) S.root.style.setProperty("--igfv-ed-tile", `${S.tileSize}px`);
    else S.root.style.removeProperty("--igfv-ed-tile");
  }
  const setSideWidth = (w) => setSize("sideW", "--igfv-ed-side-w", w);
  const setTimelineHeight = (h) => setSize("timelineH", "--igfv-ed-tl-h", h);

  // Drags a panel edge: o.size() is the size when the drag starts, o.set(size) applies a new one
  // (sign -1 when moving towards the panel's far side makes it bigger), o.reset() on double-click.
  function edgeDrag(handle, o) {
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      handle.setPointerCapture?.(e.pointerId);
      const pos = (ev) => (o.axis === "y" ? ev.clientY : ev.clientX);
      const start = pos(e);
      const startSize = o.size();
      S.root.classList.add("igfv-ed-resizing", o.axis === "y" ? "igfv-ed-resizing-y" : "igfv-ed-resizing-x");
      handle.classList.add("igfv-on");
      const move = (ev) => o.set(startSize + (pos(ev) - start) * (o.sign || 1));
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
        S.root.classList.remove("igfv-ed-resizing", "igfv-ed-resizing-x", "igfv-ed-resizing-y");
        handle.classList.remove("igfv-on");
        saveUiPrefs();
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
    handle.addEventListener("dblclick", () => {
      o.reset();
      saveUiPrefs();
    });
  }

  function buildLeft(left) {
    const sources = el("div", "igfv-ed-sources");
    S.sourcesEl = sources;
    const tabs = el("div", "igfv-ed-tabs");
    S.srcTabs = new Map();
    for (const [id, label] of [["favorites", "Favorites"], ["history", "History"], ["files", "Files"]]) {
      const b = button(label, "igfv-ed-tab", () => setSourceTab(id));
      tabs.appendChild(b);
      S.srcTabs.set(id, b);
    }
    S.search = el("input", "igfv-ed-search", { type: "search", placeholder: "Search\u2026" });
    S.search.addEventListener("input", () => {
      S.srcQuery = S.search.value;
      clearTimeout(S.searchTimer);
      S.searchTimer = setTimeout(() => {
        if (S.srcTab === "history") S.histRows = null;
        renderSources();
      }, S.srcTab === "history" ? 400 : 120);
    });
    S.search.igfvKey = (e) => {
      if (e.key === "Escape" && S.search.value) {
        S.search.value = "";
        S.srcQuery = "";
        if (S.srcTab === "history") S.histRows = null;
        renderSources();
      }
    };
    S.srcBody = el("div", "igfv-ed-src-body");
    sources.append(tabs, S.search, S.srcBody);
    // A splitter between the sources and the pool.
    const split = el("div", "igfv-ed-split", { title: "Drag to resize" });
    split.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      split.setPointerCapture?.(e.pointerId);
      const top = left.getBoundingClientRect().top;
      const max = left.getBoundingClientRect().height - 120;
      const move = (ev) => (sources.style.height = `${M.clamp(ev.clientY - top, 120, Math.max(120, max))}px`);
      const up = () => {
        split.removeEventListener("pointermove", move);
        split.removeEventListener("pointerup", up);
        saveUiPrefs();
      };
      split.addEventListener("pointermove", move);
      split.addEventListener("pointerup", up);
    });
    const pool = el("div", "igfv-ed-pool");
    const head = el("div", "igfv-ed-pool-head");
    head.append(el("strong", "", { text: "Media Pool" }), button("+ Bin", "", newBin, "A new bin to organise your media"));
    S.binsEl = el("div", "igfv-ed-bins");
    S.poolEl = el("div", "igfv-ed-pool-items");
    pool.append(head, S.binsEl, S.poolEl);
    // Drag the right edge to make the panel wider or narrower; double-click: the default width.
    const resize = el("div", "igfv-ed-left-resize", { title: "Drag to resize \u00b7 double-click: default width" });
    edgeDrag(resize, { axis: "x", size: () => S.leftW || left.getBoundingClientRect().width || 250, set: (w) => setLeftWidth(clampLeftWidth(w)), reset: () => setLeftWidth(null) });
    left.append(sources, split, pool, resize);
    // Ctrl + wheel: bigger / smaller thumbnails (a plain wheel scrolls).
    left.addEventListener("wheel", (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const d = e.deltaY || e.deltaX;
      if (!d) return;
      setTileSize((S.tileSize || TILE_DEFAULT) * (d < 0 ? 1.12 : 1 / 1.12));
      clearTimeout(S.tileSaveTimer);
      S.tileSaveTimer = setTimeout(() => S && saveUiPrefs(), 400);
    }, { passive: false });
  }

  function setSourceTab(id) {
    S.srcTab = id;
    S.favCat = null;
    S.search.value = "";
    S.srcQuery = "";
    if (id === "history") S.histRows = null;
    for (const [tid, b] of S.srcTabs) b.classList.toggle("igfv-on", tid === id);
    renderSources();
  }

  function renderSources() {
    if (!S) return;
    S.search.hidden = S.srcTab === "files";
    S.search.placeholder = S.srcTab === "favorites" ? "Search favorites: name, tag, hint, @user\u2026" : "Search history: @user or post code\u2026";
    const body = S.srcBody;
    body.textContent = "";
    if (S.srcTab === "files") return renderFiles(body);
    if (S.srcTab === "favorites") return renderFavorites(body);
    return renderHistory(body);
  }

  const fold = (text) =>
    String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function matchesQuery(text, query) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    const hay = fold(text);
    return words.every((w) => hay.includes(w.replace(/^@/, "")));
  }

  async function renderFavorites(body) {
    const src = S.opts.sources;
    if (!src || !src.favorites) return note(body, "Not available here.");
    const refresh = () => {
      S.favData = null;
      renderSources();
    };
    if (!S.favData) {
      note(body, "Loading your favorites\u2026");
      try {
        S.favData = await src.favorites();
      } catch (err) {
        if (!S || S.srcTab !== "favorites") return;
        body.textContent = "";
        note(body, `Couldn't load your favorites \u2014 ${(err && err.message) || "offline?"}`);
        body.appendChild(button("\u21bb Try again", "igfv-ed-wide", refresh));
        return;
      }
      if (!S || S.srcTab !== "favorites") return;
      body.textContent = "";
    }
    const data = S.favData;
    if (data.signedOut) return signInNote(body, "Sign in to see your favorites.");
    if (data.blocked) {
      note(body, data.blocked);
      body.appendChild(button("\u21bb Try again", "igfv-ed-wide", refresh));
      return;
    }
    const all = [];
    for (const cat of data.categories) for (const it of cat.items) all.push({ ...it, cat });
    if (!all.length) {
      note(body, `No favorite posts or reels${data.account ? ` for ${data.account}` : ""}. Add some with \u2606 in the viewer.`);
      body.appendChild(button("\u21bb Refresh", "igfv-ed-wide", refresh));
      return;
    }
    if (S.srcQuery.trim()) {
      const seen = new Set();
      const hits = all.filter((it) => !seen.has(it.code) && matchesQuery(`${it.label} ${it.code} ${it.hint} ${it.cat.name} ${it.cat.tags.join(" ")}`, S.srcQuery) && seen.add(it.code));
      if (!hits.length) return note(body, "No matches.");
      note(body, `${hits.length} match${hits.length === 1 ? "" : "es"}.${src.linksOnly ? "" : " Click to add to the pool, double-click to also put it on the timeline."}`);
      const grid = el("div", "igfv-ed-posts");
      for (const it of hits) grid.appendChild(postTile(it));
      body.appendChild(grid);
      return;
    }
    const cat = S.favCat != null && data.categories.find((c) => c.id === S.favCat);
    if (cat) {
      const head = el("div", "igfv-ed-cathead");
      head.append(
        button("\u2190", "igfv-ed-icon", () => {
          S.favCat = null;
          renderSources();
        }, "All categories"),
        el("strong", "", { text: cat.name }),
        el("small", "", { text: `${cat.items.length}` })
      );
      body.appendChild(head);
      if (!cat.items.length) return note(body, "No posts or reels in this category.");
      const grid = el("div", "igfv-ed-posts");
      for (const it of cat.items) grid.appendChild(postTile(it));
      body.appendChild(grid);
      return;
    }
    const cards = el("div", "igfv-ed-cats");
    for (const c of data.categories) {
      const card = button("", "igfv-ed-cat", () => {
        S.favCat = c.id;
        renderSources();
      });
      const cover = el("div", "igfv-ed-cat-cover");
      const first = c.items.find((i) => i.thumb) || c.items[0];
      const img = first && postThumb(first);
      if (img) cover.appendChild(img);
      else cover.textContent = "\u2605";
      card.append(cover, el("strong", "", { text: c.name }), el("small", "", { text: `${c.items.length} item${c.items.length === 1 ? "" : "s"}${c.tags.length ? ` \u00b7 ${c.tags.map((t) => `#${t}`).join(" ")}` : ""}` }));
      cards.appendChild(card);
    }
    body.appendChild(cards);
    body.appendChild(button("\u21bb Refresh", "igfv-ed-wide igfv-ed-quiet", refresh));
  }

  async function renderHistory(body) {
    const src = S.opts.sources;
    if (!src || !src.history) return note(body, "Not available here.");
    if (!S.histRows) {
      note(body, "Loading\u2026");
      try {
        S.histRows = await src.history(undefined, S.srcQuery.trim());
      } catch (err) {
        if (!S || S.srcTab !== "history") return;
        body.textContent = "";
        const code = String((err && err.message) || "");
        if (code === "signed_out") return signInNote(body, "Sign in to see your history.");
        return note(body, code === "no_instagram" ? "Log in to Instagram to see your history." : `Couldn't load the history \u2014 ${code || "offline?"}`);
      }
      if (!S || S.srcTab !== "history") return;
      body.textContent = "";
    }
    const rows = S.histRows;
    if (!rows.length) return note(body, S.srcQuery.trim() ? "No matches." : "No history yet.");
    const grid = el("div", "igfv-ed-posts");
    for (const it of rows) grid.appendChild(postTile(it));
    body.appendChild(grid);
    if (rows.hasMore) {
      body.appendChild(
        button("Load more", "igfv-ed-wide", async () => {
          const more = await src.history(rows[rows.length - 1].at, S.srcQuery.trim());
          S.histRows = Object.assign([...rows, ...more], { hasMore: more.hasMore });
          renderSources();
        })
      );
    }
  }

  // Signed out: a note and the page's sign-in button.
  function signInNote(body, text) {
    const src = S.opts.sources;
    note(body, text);
    if (src && src.signIn) body.appendChild(button("Sign in with Google", "igfv-ed-primary igfv-ed-wide", () => src.signIn()));
  }

  // A saved link (linksOnly sources): its media can't be loaded here, so it opens on Instagram.
  function linkTile(it) {
    const link = it.link || `https://www.instagram.com/p/${it.code}/`;
    const tile = el("button", "igfv-ed-btn igfv-ed-post igfv-ed-link", { type: "button", title: `${it.hint ? `${it.hint}\n` : ""}Open on Instagram, download it there, then drop the file into Files` });
    tile.appendChild(el("span", "igfv-ed-post-letter", { text: (it.label || it.code || "?").replace(/^@/, "").slice(0, 1).toUpperCase() }));
    if (it.kind === "reel") tile.appendChild(el("span", "igfv-ed-post-kind", { text: "\u25b6" }));
    tile.appendChild(el("small", "", { text: it.label || it.code }));
    tile.appendChild(el("span", "igfv-ed-post-prev", { text: "\u2197 Instagram" }));
    const open = () => window.open(link, "_blank", "noopener");
    tile.addEventListener("click", (e) => {
      e.stopPropagation();
      selectTile(tile);
      if (e.target instanceof Element && e.target.closest(".igfv-ed-post-prev")) open();
    });
    tile.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      open();
    });
    tile.addEventListener("contextmenu", (e) => {
      selectTile(tile);
      contextMenu(e, [
        { label: "Open on Instagram", hint: "Double-click", run: open },
        {
          label: "Copy link",
          run: () =>
            navigator.clipboard.writeText(link).then(
              () => toast("Link copied"),
              () => toast("Couldn't copy the link")
            ),
        },
      ]);
    });
    return tile;
  }

  // A post's picture: the cached thumbnail, else the source's lazy loader (it fills in once in view).
  function postThumb(it) {
    const loader = S.opts.sources && S.opts.sources.thumbImage;
    const node = it.thumb ? el("img", "", { src: it.thumb, alt: "" }) : loader && it.code ? loader(it.code) : null;
    if (!node || node.tagName !== "IMG") return null;
    node.draggable = false; // Firefox's own image drag would swallow our pointer drag's release
    return node;
  }

  // A post / reel to import: click = into the open bin; double-click = also onto the timeline;
  // drag = onto a bin, the pool or the timeline.
  function postTile(it) {
    if (S.opts.sources && S.opts.sources.linksOnly) return linkTile(it);
    const tile = el("button", "igfv-ed-btn igfv-ed-post", { type: "button" });
    const img = postThumb(it);
    tile.appendChild(img || el("span", "igfv-ed-post-letter", { text: (it.label || it.code || "?").replace(/^@/, "").slice(0, 1).toUpperCase() }));
    if (it.kind === "reel") tile.appendChild(el("span", "igfv-ed-post-kind", { text: "\u25b6" }));
    tile.appendChild(el("small", "", { text: it.label || it.code }));
    // Preview on the canvas first (a span: no button inside a button).
    const prev = el("span", "igfv-ed-post-prev", { text: "\u25b6 Preview" });
    tile.appendChild(prev);
    // A click only selects it: media are added with the right-click menu or by dragging.
    tile.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tile.dataset.dragged) {
        delete tile.dataset.dragged;
        return;
      }
      selectTile(tile);
      if (e.target instanceof Element && e.target.closest(".igfv-ed-post-prev")) previewPost(it, tile);
    });
    tile.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (e.target instanceof Element && e.target.closest(".igfv-ed-post-prev")) return;
      previewPost(it, tile);
    });
    tile.addEventListener("contextmenu", (e) => {
      selectTile(tile);
      const link = it.link || `https://www.instagram.com/p/${it.code}/`;
      contextMenu(e, [
        { label: "\u25b6 Preview", hint: "Double-click", run: () => previewPost(it, tile) },
        { sep: true },
        { label: "Add to media pool", sub: binItems((bin) => importPost(it, tile, { bin, explicitBin: true })) },
        { label: "Add at playhead", run: () => importPost(it, tile, { add: true }) },
        { label: "\u2935 Insert at playhead", run: () => importPost(it, tile, { insert: true }) },
        { sep: true },
        { label: "Open on Instagram", run: () => window.open(link, "_blank", "noopener") },
        {
          label: "Copy link",
          run: () =>
            navigator.clipboard.writeText(link).then(
              () => toast("Link copied"),
              () => toast("Couldn't copy the link")
            ),
        },
      ]);
    });
    dragItem(tile, it.label || it.code, (drop) => importPost(it, tile, drop));
    return tile;
  }

  function selectTile(tile) {
    for (const t of S.left.querySelectorAll(".igfv-ed-post.igfv-on")) t.classList.remove("igfv-on");
    tile.classList.add("igfv-on");
  }

  // Pointer-based dragging (works inside the viewer's full screen): a label follows the pointer;
  // onDrop({ add, time, track } | { bin }) where it lands.
  function dragItem(node, label, onDrop) {
    // No native drag-and-drop (of the image inside): it would hold back pointermove / pointerup.
    node.addEventListener("dragstart", (e) => e.preventDefault());
    node.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const inner = e.target.closest && e.target.closest("button");
      if (inner && inner !== node) return;
      const startX = e.clientX;
      const startY = e.clientY;
      let ghost = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
        if (!ghost) {
          ghost = el("div", "igfv-ed-drag-ghost", { text: label });
          S.root.appendChild(ghost);
        }
        const r = S.root.getBoundingClientRect();
        ghost.style.left = `${ev.clientX - r.left + 10}px`;
        ghost.style.top = `${ev.clientY - r.top + 10}px`;
        for (const b of S.binsEl.querySelectorAll("[data-bin]")) b.classList.remove("igfv-drop");
        const target = binAt(ev.clientX, ev.clientY);
        if (target) target.classList.add("igfv-drop");
      };
      const up = (ev) => {
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", up, true);
        window.removeEventListener("pointercancel", up, true);
        if (!ghost || !S) return;
        if (ev.type === "pointercancel") {
          ghost.remove();
          for (const b of S.binsEl.querySelectorAll("[data-bin]")) b.classList.remove("igfv-drop");
          return;
        }
        ghost.remove();
        for (const b of S.binsEl.querySelectorAll("[data-bin]")) b.classList.remove("igfv-drop");
        node.dataset.dragged = "1";
        setTimeout(() => delete node.dataset.dragged, 400);
        const drop = dropTarget(ev.clientX, ev.clientY);
        if (drop) onDrop(drop);
      };
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", up, true);
      window.addEventListener("pointercancel", up, true);
    });
  }

  function binAt(x, y) {
    const hit = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
    return hit && hit.closest ? hit.closest("[data-bin]") : null;
  }

  function dropTarget(x, y) {
    const at = S.timeline.pointAt(x, y);
    if (at) return { add: true, time: at.time, track: at.track };
    const bin = binAt(x, y);
    if (bin) return { bin: bin.dataset.bin === "" ? null : Number(bin.dataset.bin), explicitBin: true };
    const hit = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
    if (hit && hit.closest && hit.closest(".igfv-ed-pool")) return { bin: S.currentBin };
    return null;
  }

  async function importPost(it, tile, opts) {
    const src = S.opts.sources;
    if (tile.classList.contains("igfv-busy")) return;
    // Already in the pool (a single photo / video post): no new download.
    const known = M.mediaBySource(proj(), { code: it.code, index: 0 });
    if (known != null && !opts.pickAgain) return useExisting(known, opts);
    tile.classList.add("igfv-busy");
    try {
      const items = await src.loadPost(it.code);
      if (!S) return;
      if (!items || !items.length) throw new Error("Couldn't load this post");
      if (items.length === 1) await importItem(items[0], it, 0, opts);
      else showCarouselPicker(items, it, opts);
    } catch (err) {
      toast((err && err.message) || "Couldn't load this post");
    } finally {
      tile.classList.remove("igfv-busy");
    }
  }

  function useExisting(id, opts) {
    const moved = opts.explicitBin && proj().media[id].bin !== opts.bin;
    if (moved) change((p) => M.moveMedia(p, id, opts.bin));
    S.poolPick = id;
    if (opts.add) addMediaClip(id, { time: opts.time, track: opts.track });
    else if (opts.insert) insertMediaAt(id);
    else toast(moved ? "Moved to that bin" : "Already in the media pool");
    renderPool();
    return id;
  }

  function postName(post, index) {
    return `${post.label ? post.label.replace(/^@/, "") + "_" : ""}${post.code}${index ? `_${index + 1}` : ""}`;
  }

  // ---- preview: a post or pool item alone on the stage, before it's on the timeline ----------------
  async function previewPost(it, tile) {
    const src = S.opts.sources;
    if (!src || tile.classList.contains("igfv-busy")) return;
    tile.classList.add("igfv-busy");
    try {
      let items = S.previewItems.get(it.code);
      if (!items) {
        items = await src.loadPost(it.code);
        if (!S) return;
        if (!items || !items.length) throw new Error("Couldn't load this post");
        S.previewItems.set(it.code, items);
      }
      openPreview({ post: it, items, index: 0 });
    } catch (err) {
      toast((err && err.message) || "Couldn't load this post");
    } finally {
      tile.classList.remove("igfv-busy");
    }
  }

  // A post item's blob, downloaded once (kept until the editor closes).
  async function previewBlob(post, index, item) {
    const key = `${post.code}:${index}`;
    let c = S.previewCache.get(key);
    if (!c) {
      const blob = await S.opts.sources.fetchBlob(item.url);
      if (!S) throw new Error("closed");
      c = { blob, url: URL.createObjectURL(blob) };
      S.previewCache.set(key, c);
    }
    return c;
  }

  // entry: { mediaId } (in the pool) or { post, items, index } (a Favorites / History post).
  function openPreview(entry) {
    if (S.engine && S.engine.playing) S.engine.pause();
    closePreview();
    const panel = el("div", "igfv-ed-preview");
    // The stage's own pointer / wheel handling (select, pan, zoom) stays out of it.
    for (const t of ["pointerdown", "pointermove", "pointerup", "pointercancel", "dblclick", "wheel"]) panel.addEventListener(t, (e) => e.stopPropagation());
    S.preview = { entry, panel, media: null, token: null };
    S.stage.appendChild(panel);
    S.root.classList.add("igfv-ed-previewing");
    fillPreview();
    updateTransport();
  }

  function closePreview() {
    if (!S || !S.preview) return;
    const { panel, media } = S.preview;
    if (media && media.pause) media.pause();
    panel.remove();
    S.preview = null;
    S.root.classList.remove("igfv-ed-previewing");
    requestRender();
  }

  async function fillPreview() {
    const pv = S.preview;
    if (!pv) return;
    const token = (pv.token = {});
    const { entry, panel } = pv;
    const live = () => S && S.preview === pv && pv.token === token;
    if (pv.media && pv.media.pause) pv.media.pause();
    pv.media = null;
    panel.textContent = "";
    const box = el("div", "igfv-ed-preview-media");
    const bar = el("div", "igfv-ed-preview-bar");
    panel.append(box, bar);
    const p = proj();
    let mediaId = entry.mediaId ?? null;
    if (entry.post) {
      const known = M.mediaBySource(p, { code: entry.post.code, index: entry.index });
      if (known != null) mediaId = known;
    }
    let url;
    let kind;
    let name;
    let info;
    if (mediaId != null) {
      const m = p.media[mediaId];
      const stored = S.media.get(mediaId);
      if (!m || !stored) return closePreview();
      url = stored.url;
      kind = m.kind;
      name = m.name;
      info = kind === "image" || kind === "gif" ? `${kind === "gif" ? "GIF" : "Photo"} · ${m.w}×${m.h}` : `${kind === "audio" ? "Audio" : "Video"} · ${E.formatTime(m.duration)}`;
    } else {
      const item = entry.items[entry.index];
      name = postName(entry.post, entry.index);
      note(box, "Loading…");
      let c;
      try {
        c = await previewBlob(entry.post, entry.index, item);
      } catch (err) {
        if (!live()) return;
        box.textContent = "";
        return note(box, `Couldn't load it — ${(err && err.message) || "offline?"}`);
      }
      if (!live()) return;
      box.textContent = "";
      url = c.url;
      const type = c.blob.type || "";
      kind = type.startsWith("video/") || item.type === "video" ? "video" : type === "image/gif" ? "gif" : "image";
      info = kind === "video" ? "Video" : kind === "gif" ? "GIF" : "Photo";
    }
    if (entry.post && entry.items.length > 1) info += ` · ${entry.index + 1} of ${entry.items.length}`;
    let media;
    if (kind === "video" || kind === "audio") {
      media = el(kind, "", { controls: true, playsInline: true, preload: "auto" });
      media.muted = false;
      media.src = url;
      // Starts by itself; when Firefox refuses autoplay, ▶ does it.
      media.addEventListener("loadeddata", () => {
        if (S && S.preview === pv && pv.media === media) media.play().catch(() => toast("Press ▶ to play"));
      }, { once: true });
    } else {
      media = el("img", "", { src: url, alt: "" });
    }
    box.appendChild(media);
    pv.media = media;

    const title = el("div", "igfv-ed-preview-title");
    title.append(el("strong", "", { text: name }), el("small", "", { text: info }));
    bar.appendChild(title);
    if (entry.post && entry.items.length > 1) {
      const step = (d) => {
        entry.index = (entry.index + d + entry.items.length) % entry.items.length;
        fillPreview();
      };
      bar.append(button("‹", "igfv-ed-icon", () => step(-1), "Previous in this post"), button("›", "igfv-ed-icon", () => step(1), "Next in this post"));
    }
    bar.appendChild(el("span", "igfv-ed-flex"));
    if (mediaId == null) {
      const toPool = button("+ Media pool", "", async () => {
        if ((await previewMediaId()) != null && live()) {
          toPool.remove();
          toast("Added to the media pool");
        }
      }, "Add it to the media pool (the open bin)");
      bar.appendChild(toPool);
    }
    const use = (fn) => async () => {
      const id = await previewMediaId();
      if (id == null || !S) return;
      closePreview();
      fn(id);
    };
    bar.append(
      button("Add at playhead", "igfv-ed-primary", use((id) => addMediaClip(id)), "Add it to the timeline at the playhead"),
      button("⤵ Insert", "", use((id) => insertMediaAt(id)), "Insert it at the playhead, pushing later clips on the track to the right"),
      button("✕", "igfv-ed-icon", closePreview, "Close the preview (Esc)")
    );
  }

  // The previewed media in the pool (a post item is added to it first). Its id, or null.
  async function previewMediaId() {
    const e = S.preview && S.preview.entry;
    if (!e) return null;
    if (e.mediaId != null) return e.mediaId;
    const known = M.mediaBySource(proj(), { code: e.post.code, index: e.index });
    if (known != null) return known;
    try {
      return await importItem(e.items[e.index], e.post, e.index, {});
    } catch (err) {
      toast((err && err.message) || "Couldn't add it");
      return null;
    }
  }

  async function importItem(item, post, index = 0, opts = {}) {
    const known = M.mediaBySource(proj(), { code: post.code, index });
    if (known != null) return useExisting(known, opts);
    showStatus("Adding\u2026");
    try {
      // Already downloaded for a preview: not again.
      const cached = S.previewCache.get(`${post.code}:${index}`);
      const blob = cached ? cached.blob : await S.opts.sources.fetchBlob(item.url);
      if (!S) return null;
      return await importBlob(blob, postName(post, index), { ...opts, source: { code: post.code, index } });
    } finally {
      showStatus("");
    }
  }

  function showCarouselPicker(items, post, opts) {
    modal((card) => {
      card.append(el("h3", "", { text: "Which one?" }), el("p", "igfv-ed-note", { text: "This post has several photos / videos." }));
      const grid = el("div", "igfv-ed-posts");
      items.forEach((item, i) => {
        const b = button("", "igfv-ed-post", async () => {
          closeModal();
          try {
            await importItem(item, post, i, opts);
          } catch (err) {
            toast((err && err.message) || "Couldn't add it");
          }
        });
        const thumb = item.poster || (item.type === "image" ? item.url : "");
        if (thumb) b.appendChild(el("img", "", { src: thumb, alt: "" }));
        b.appendChild(el("small", "", { text: `${i + 1} \u00b7 ${item.type === "video" ? "Video" : "Photo"}${M.mediaBySource(proj(), { code: post.code, index: i }) != null ? " \u2713" : ""}` }));
        grid.appendChild(b);
      });
      card.appendChild(grid);
      card.appendChild(button("Cancel", "igfv-ed-wide", closeModal));
    });
  }

  function renderFiles(body) {
    note(body, "Add videos, photos or audio from your computer (for example, ones you've downloaded). They go into the open bin.");
    const input = el("input", "", { type: "file", multiple: true, accept: "video/*,image/*,audio/*" });
    input.hidden = true;
    input.addEventListener("change", () => importFiles([...input.files]));
    const pick = button("Choose files\u2026", "igfv-ed-primary igfv-ed-wide", () => input.click());
    const drop = el("div", "igfv-ed-drop", { text: "\u2026or drop files here" });
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("igfv-on");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("igfv-on"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("igfv-on");
      importFiles([...(e.dataTransfer ? e.dataTransfer.files : [])]);
    });
    body.append(input, pick, drop);
  }

  async function importFiles(files) {
    let added = 0;
    for (const file of files) {
      try {
        showStatus(`Adding ${file.name}\u2026`);
        await importBlob(file, file.name, {});
        added++;
      } catch (err) {
        if (err && err.tooLarge) tooLargeModal(file.name, err.tooLarge);
        else toast(`Couldn't add ${file.name}: ${(err && err.message) || "unsupported"}`);
      }
    }
    showStatus("");
    if (added) toast(`${added} file${added === 1 ? "" : "s"} added to the media pool \u2014 drag onto a track or press +`);
  }

  // Adds a blob to the pool (the open bin, or opts.bin), and with opts.add also to the timeline.
  async function importBlob(blob, name, opts = {}) {
    const url = URL.createObjectURL(blob);
    let info;
    try {
      info = await E.probe(blob, url, name);
      checkSize(info);
    } catch (err) {
      if (info && info.bitmap && info.bitmap.close) info.bitmap.close();
      URL.revokeObjectURL(url);
      throw err;
    }
    if (!S) return null;
    const bin = "bin" in opts ? opts.bin : S.currentBin;
    let id = null;
    change((p) => (id = M.addMedia(p, { kind: info.kind, name: displayName(name), w: info.w, h: info.h, duration: info.duration, bin, source: opts.source || null, size: blob.size, type: blob.type, hasAudio: info.hasAudio ?? null })));
    S.media.set(id, { blob, url, bitmap: info.bitmap || null, kind: info.kind, gif: info.gif || null });
    S.poolPick = id;
    makeThumbs(id);
    if (opts.add) addMediaClip(id, { time: opts.time, track: opts.track });
    else if (opts.insert) insertMediaAt(id);
    else if (opts.explicitBin) toast("Added to the media pool");
    return id;
  }

  // Media larger than opts.maxMedia (4K and up) is refused: that's for the desktop app.
  function checkSize(info) {
    const max = S.opts.maxMedia;
    if (!max || !info || !info.w || !info.h) return;
    const long = Math.max(info.w, info.h);
    const short = Math.min(info.w, info.h);
    if (long <= max.long && short <= max.short) return;
    const err = new Error(`${info.w}\u00d7${info.h} is larger than ${max.long}\u00d7${max.short}`);
    err.tooLarge = { w: info.w, h: info.h };
    throw err;
  }

  function tooLargeModal(name, size) {
    const max = S.opts.maxMedia;
    modal((card) => {
      card.append(
        el("h3", "", { text: "Too large for the web editor" }),
        el("p", "igfv-ed-note", { text: `${name} is ${size.w}\u00d7${size.h}. The web editor works with media up to ${max.long}\u00d7${max.short}. 4K and larger is for the desktop app.` })
      );
      const row = el("div", "igfv-ed-buttons");
      row.append(button("OK", "", closeModal));
      if (S.opts.desktopUrl) row.append(button("Get the desktop app", "igfv-ed-primary", () => window.open(S.opts.desktopUrl, "_blank", "noopener")));
      card.appendChild(row);
    });
  }

  async function makeThumbs(id) {
    const m = S.media.get(id);
    const info = proj().media[id];
    if (!m || !info) return;
    if ((info.kind === "image" || info.kind === "gif") && m.bitmap) {
      const c = document.createElement("canvas");
      const h = 40;
      c.width = Math.max(1, Math.round((h * m.bitmap.width) / Math.max(1, m.bitmap.height)));
      c.height = h;
      c.getContext("2d").drawImage(m.bitmap, 0, 0, c.width, h);
      m.thumbs = [{ time: 0, canvas: c }];
    } else if (info.kind === "video") {
      m.thumbs = await E.thumbnails(m.url, info.duration, 12, 40);
    }
    if (S) {
      renderPool();
      if (S.timeline) S.timeline.draw();
    }
  }

  function cloneCanvas(c) {
    const out = document.createElement("canvas");
    out.width = c.width;
    out.height = c.height;
    out.getContext("2d").drawImage(c, 0, 0);
    return out;
  }

  // ---- the media pool: bins (Master + named) and their media ------------------------------------------
  function newBin() {
    let bin = null;
    change((p) => (bin = M.addBin(p, `Bin ${(p.bins || []).length + 1}`)));
    S.currentBin = bin.id;
    renderPool();
    renameBinInline(bin.id);
  }

  function renameBinInline(id) {
    const chip = S.binsEl.querySelector(`[data-bin="${id}"]`);
    const bin = (proj().bins || []).find((b) => b.id === id);
    if (!chip || !bin) return;
    const input = el("input", "igfv-ed-binname", { type: "text", value: bin.name, maxLength: 60 });
    const done = (ok) => {
      if (ok && input.value.trim()) change((p) => M.renameBin(p, id, input.value));
      else renderPool();
    };
    input.igfvKey = (e) => {
      if (e.key === "Enter") done(true);
      if (e.key === "Escape") done(false);
    };
    input.addEventListener("blur", () => done(true), { once: true });
    chip.replaceWith(input);
    input.focus();
    input.select();
  }

  function renameMediaInline(id) {
    const name = S.poolEl.querySelector(`[data-media="${id}"] strong`);
    const m = proj().media[id];
    if (!name || !m) return;
    const input = el("input", "igfv-ed-binname", { type: "text", value: m.name, maxLength: 80 });
    const done = (ok) => {
      const v = input.value.trim();
      if (ok && v && v !== m.name) change((p) => (p.media[id].name = v));
      else renderPool();
    };
    input.igfvKey = (e) => {
      if (e.key === "Enter") done(true);
      if (e.key === "Escape") done(false);
    };
    for (const t of ["pointerdown", "click"]) input.addEventListener(t, (e) => e.stopPropagation());
    input.addEventListener("blur", () => done(true), { once: true });
    name.replaceWith(input);
    input.focus();
    input.select();
  }

  function renderPool() {
    if (!S || !S.history || !S.binsEl) return;
    const p = proj();
    const bins = p.bins || [];
    if (S.currentBin != null && !bins.some((b) => b.id === S.currentBin)) S.currentBin = null;
    S.binsEl.textContent = "";
    const chip = (id, name, count) => {
      const b = el("span", `igfv-ed-bin${S.currentBin === id ? " igfv-on" : ""}`);
      b.dataset.bin = id == null ? "" : String(id);
      b.append(el("span", "", { text: `${id == null ? "\u25a4 " : "\u{1f4c1} "}${name}` }), el("small", "", { text: String(count) }));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        S.currentBin = id;
        renderPool();
      });
      if (id != null) {
        b.title = "Double-click to rename";
        b.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          renameBinInline(id);
        });
        const x = button("\u2715", "igfv-ed-mini", () => {
          change((q) => M.removeBin(q, id));
          toast(`Bin "${name}" deleted; its media are in Master`);
        }, "Delete this bin (its media go back to Master)");
        b.appendChild(x);
      }
      S.binsEl.appendChild(b);
    };
    chip(null, "Master", Object.keys(p.media).length);
    for (const bin of bins) chip(bin.id, bin.name, M.mediaInBin(p, bin.id).length);
    const list = S.poolEl;
    list.textContent = "";
    const ids = M.mediaInBin(p, S.currentBin);
    if (!ids.length) {
      note(list, S.currentBin == null ? "Your media appear here. Add posts from the sources above, or files." : "Empty bin \u2014 drag media here, or click a source with this bin open.");
      return;
    }
    for (const id of ids) {
      const m = p.media[id];
      const item = el("div", `igfv-ed-bin-item${S.poolPick === id ? " igfv-on" : ""}`);
      const thumb = el("div", "igfv-ed-bin-thumb");
      const stored = S.media.get(id);
      if (stored && stored.thumbs && stored.thumbs.length) thumb.appendChild(cloneCanvas(stored.thumbs[Math.floor(stored.thumbs.length / 2)].canvas));
      else thumb.textContent = MEDIA_ICON[m.kind] || "?";
      const info = el("div", "igfv-ed-bin-info");
      const binName = S.currentBin == null && m.bin != null ? ` \u00b7 \u{1f4c1} ${(bins.find((b) => b.id === m.bin) || {}).name || ""}` : "";
      info.append(el("strong", "", { text: m.name }), el("small", "", { text: `${m.kind === "image" ? `Photo \u00b7 ${m.w}\u00d7${m.h}` : `${m.kind === "audio" ? "Audio" : "Video"} \u00b7 ${E.formatTime(m.duration)}`}${binName}` }));
      const look = button("▶", "igfv-ed-icon", () => {
        S.poolPick = id;
        renderPool();
        openPreview({ mediaId: id });
      }, "Preview it on the canvas");
      const add = button("+", "igfv-ed-icon", () => addMediaClip(id), "Add at the playhead");
      const del = button("\u2715", "igfv-ed-mini", () => {
        if (M.mediaUsed(proj(), id)) return toast("It's used on the timeline: delete its clips first");
        change((q) => M.removeMedia(q, id));
      }, "Remove from the project");
      item.append(thumb, info, look, add, del);
      item.addEventListener("click", () => {
        S.poolPick = id;
        renderPool();
      });
      dragItem(item, m.name, (drop) => {
        if (drop.add) addMediaClip(id, { time: drop.time, track: drop.track });
        else if ("bin" in drop) change((q) => M.moveMedia(q, id, drop.bin));
      });
      item.addEventListener("contextmenu", (e) => {
        S.poolPick = id;
        for (const x of list.querySelectorAll(".igfv-ed-bin-item.igfv-on")) x.classList.remove("igfv-on");
        item.classList.add("igfv-on");
        contextMenu(e, [
          { label: "▶ Preview", run: () => openPreview({ mediaId: id }) },
          { sep: true },
          { label: "Add at playhead", run: () => addMediaClip(id) },
          { label: "⤵ Insert at playhead", run: () => insertMediaAt(id) },
          { sep: true },
          { label: "Move to bin", sub: binItems((bin) => change((q) => M.moveMedia(q, id, bin))) },
          { label: "Rename\u2026", run: () => renameMediaInline(id) },
          { label: "Properties\u2026", run: () => openProperties(id) },
          { sep: true },
          {
            label: "Remove from project",
            danger: true,
            run: () => {
              if (M.mediaUsed(proj(), id)) return toast("It's used on the timeline: delete its clips first");
              change((q) => M.removeMedia(q, id));
            },
          },
        ]);
      });
      item.dataset.media = String(id);
      item.title = poolTooltip(id);
      list.appendChild(item);
    }
  }

  // ---- drafts (this computer only) ----------------------------------------------------------------------
  function defaultDraftName() {
    const when = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    return `${displayName(S.opts.name)} \u00b7 ${when}`;
  }

  function draftThumb() {
    try {
      const p = proj();
      const c = document.createElement("canvas");
      S.renderer.compose(p, now(), c, { scale: Math.min(1, 200 / Math.max(p.w, p.h)), opaque: true, getSource: sourceOf });
      return c.toDataURL("image/jpeg", 0.7);
    } catch (err) {
      return "";
    }
  }

  async function saveDraft({ asNew = false, name = "" } = {}) {
    const api = S.opts.drafts;
    if (!api) return toast("Drafts aren't available here");
    const p = M.clone(proj());
    const media = {};
    for (const id of Object.keys(p.media)) {
      const m = S.media.get(Number(id));
      if (m) media[id] = m.blob;
    }
    showStatus("Saving the draft\u2026");
    try {
      const meta = await api.save({
        id: asNew ? undefined : S.draftId || undefined,
        name: name || (asNew ? defaultDraftName() : S.draftName || defaultDraftName()),
        project: p,
        media,
        thumb: draftThumb(),
        duration: M.duration(p),
        still: M.isStill(p),
      });
      if (!S) return null;
      S.draftId = meta.id;
      S.draftName = meta.name;
      S.clean = true;
      toast(`Draft saved: ${meta.name}`);
      return meta;
    } catch (err) {
      if (S) toast(`Couldn't save the draft \u2014 ${(err && err.message) || "error"}`);
      return null;
    } finally {
      showStatus("");
    }
  }

  function formatSize(bytes) {
    return bytes > 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`;
  }

  function openDrafts() {
    const api = S.opts.drafts;
    if (!api) return toast("Drafts aren't available here");
    modal((card) => {
      card.classList.add("igfv-ed-drafts");
      card.append(el("h3", "", { text: "Drafts" }), el("p", "igfv-ed-note", { text: "Projects saved with their media, on this computer only." }));
      const saveRow = el("div", "igfv-ed-row igfv-ed-saverow");
      const name = el("input", "igfv-ed-search", { type: "text", value: S.draftName || defaultDraftName(), maxLength: 80 });
      name.igfvKey = (e) => {
        if (e.key === "Enter") doSave(false);
      };
      const doSave = async (asNew) => {
        const meta = await saveDraft({ asNew, name: name.value.trim() });
        if (meta) loadList();
      };
      const save = button(S.draftId ? "Save" : "Save draft", "igfv-ed-primary", () => doSave(false), S.draftId ? "Update this draft" : "Save as a new draft");
      saveRow.append(name, save);
      if (S.draftId) saveRow.appendChild(button("Save as new", "", () => doSave(true)));
      card.appendChild(saveRow);
      const list = el("div", "igfv-ed-draftlist");
      card.appendChild(list);
      card.appendChild(button("Close", "igfv-ed-wide", closeModal));
      const loadList = async () => {
        list.textContent = "";
        note(list, "Loading\u2026");
        let drafts;
        try {
          drafts = await api.list();
        } catch (err) {
          list.textContent = "";
          return note(list, `Couldn't read the drafts \u2014 ${(err && err.message) || "error"}`);
        }
        list.textContent = "";
        if (!drafts.length) return note(list, "No drafts yet.");
        for (const d of drafts) {
          const row = el("div", `igfv-ed-draft${d.id === S.draftId ? " igfv-on" : ""}`);
          const thumb = el("div", "igfv-ed-draft-thumb");
          if (d.thumb) thumb.appendChild(el("img", "", { src: d.thumb, alt: "" }));
          const info = el("div", "igfv-ed-bin-info");
          const title = el("strong", "", { text: d.name });
          info.append(title, el("small", "", { text: `${new Date(d.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} \u00b7 ${d.still ? "Photo" : E.formatTime(d.duration || 0)} \u00b7 ${formatSize(d.size || 0)}` }));
          const open = button("Open", "igfv-ed-primary", () => openDraft(d.id));
          const rename = button("Rename", "", () => {
            const input = el("input", "igfv-ed-search", { type: "text", value: d.name, maxLength: 80 });
            const done = async (ok) => {
              if (ok && input.value.trim()) {
                await api.rename(d.id, input.value.trim());
                if (d.id === S.draftId) S.draftName = input.value.trim();
              }
              loadList();
            };
            input.igfvKey = (e) => {
              if (e.key === "Enter") done(true);
              if (e.key === "Escape") done(false);
            };
            title.replaceWith(input);
            input.focus();
            input.select();
          });
          let armed = 0;
          const del = button("Delete", "", async () => {
            if (!armed) {
              del.textContent = "Sure?";
              del.classList.add("igfv-ed-danger");
              armed = setTimeout(() => {
                armed = 0;
                del.textContent = "Delete";
                del.classList.remove("igfv-ed-danger");
              }, 3000);
              return;
            }
            clearTimeout(armed);
            await api.remove(d.id);
            if (d.id === S.draftId) S.draftId = null;
            loadList();
          });
          row.append(thumb, info, open, rename, del);
          list.appendChild(row);
        }
      };
      loadList();
    });
  }

  function openDraft(id) {
    const go = async () => {
      closeModal();
      showStatus("Opening the draft\u2026");
      try {
        const d = await S.opts.drafts.load(id);
        if (!S) return;
        const media = new Map();
        for (const [mid, blob] of Object.entries(d.media || {})) {
          const info = d.project.media[mid];
          if (!info) continue;
          const gif = info.kind === "gif" ? await E.decodeGif(blob) : null;
          const bitmap = gif ? gif.frames[0].canvas : info.kind === "image" || info.kind === "gif" ? await createImageBitmap(blob) : null;
          media.set(Number(mid), { blob, url: URL.createObjectURL(blob), bitmap, kind: info.kind, gif });
        }
        if (!S) return;
        S.engine.destroy();
        for (const m of S.media.values()) {
          if (m.bitmap && m.bitmap.close) m.bitmap.close();
          URL.revokeObjectURL(m.url);
        }
        S.media = media;
        S.renderer.cache.clear();
        S.history = new M.History(M.normalizeProject(d.project));
        S.selected = null;
        S.currentBin = null;
        S.draftId = d.id;
        S.draftName = d.name;
        S.clean = true;
        S.engine = makeEngine();
        S.timeline.autoFit = true;
        for (const mid of media.keys()) makeThumbs(mid);
        await S.engine.seek(0);
        afterChange(true);
        toast(`Opened: ${d.name}`);
      } catch (err) {
        if (S) toast(`Couldn't open the draft \u2014 ${(err && err.message) || "error"}`);
      } finally {
        showStatus("");
      }
    };
    if (dirty()) confirmModal("Open this draft?", "Your current changes haven't been saved as a draft or exported.", "Open", go);
    else go();
  }

  // ---- tools / inspector ------------------------------------------------------------------------------------
  function setTool(id) {
    if (id === "crop") {
      const clip = selectedClip();
      if (!clip || !M.VISUAL_MEDIA.has(clip.type)) {
        toast("Select a video or photo clip to crop it");
        id = "select";
      }
    }
    if (id === "text") {
      addOverlay("text");
      id = "select";
    }
    S.tool = id;
    for (const [tid, b] of S.toolBtns) b.classList.toggle("igfv-on", tid === id);
    S.root.dataset.tool = id;
    S.pan = [0, 0];
    renderInspector();
    requestRender();
  }

  function section(parent, title, open = true) {
    const box = el("details", "igfv-ed-section");
    box.open = open;
    box.appendChild(el("summary", "", { text: title }));
    parent.appendChild(box);
    return box;
  }

  function slider(parent, { label, min, max, step = 1, get, set, def = 0, format = (v) => String(Math.round(v * 100) / 100), key, disabled = false }) {
    const row = el("div", "igfv-ed-row");
    const input = el("input", "", { type: "range" });
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = get();
    input.disabled = disabled;
    const value = el("span", "igfv-ed-value", { text: format(get()) });
    input.addEventListener("input", () => {
      const v = Number(input.value);
      value.textContent = format(v);
      row.classList.toggle("igfv-changed", v !== def);
      set(v, key);
    });
    input.addEventListener("change", () => S.history.endMerge());
    row.addEventListener("dblclick", () => {
      input.value = def;
      value.textContent = format(def);
      row.classList.remove("igfv-changed");
      set(def, null);
    });
    row.classList.toggle("igfv-changed", get() !== def);
    row.append(el("span", "igfv-ed-label", { text: label }), input, value);
    parent.appendChild(row);
    return input;
  }

  function colorInput(parent, label, get, set) {
    const row = el("label", "igfv-ed-row igfv-ed-color");
    const input = el("input", "", { type: "color" });
    input.value = toHex(get() || "#ffffff");
    input.addEventListener("input", () => set(input.value));
    input.addEventListener("change", () => S.history.endMerge());
    row.append(el("span", "igfv-ed-label", { text: label }), input);
    parent.appendChild(row);
    return input;
  }

  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || "");
    if (!m) return "#ffffff";
    return `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
  }

  function chips(parent, items, current, onPick) {
    const row = el("div", "igfv-ed-chips");
    for (const it of items) {
      const b = button(it.label, `igfv-ed-chip${it.id === current ? " igfv-on" : ""}`, () => onPick(it.id));
      if (it.title) b.title = it.title;
      row.appendChild(b);
    }
    parent.appendChild(row);
    return row;
  }

  function note(parent, text) {
    parent.appendChild(el("p", "igfv-ed-note", { text }));
  }

  function numberField(parent, label, value, onChange, { step = 0.1, min = 0, suffix = "" } = {}) {
    const row = el("label", "igfv-ed-row igfv-ed-numrow");
    const input = el("input", "igfv-ed-num", { type: "number", step, min, value: String(Math.round(value * 100) / 100) });
    input.addEventListener("change", () => onChange(Number(input.value)));
    row.append(el("span", "igfv-ed-label", { text: label }), input, el("span", "igfv-ed-value", { text: suffix }));
    parent.appendChild(row);
    return input;
  }

  // Changes the selected clip (one undo step per merge key).
  function setClip(id, fn, mk = null, inspector = false) {
    change((p) => fn(M.clipOf(p, id), p), mk, { inspector });
  }

  function renderInspector() {
    if (!S || !S.inspector || !S.history) return;
    refreshProjectModal();
    const box = S.inspector;
    box.textContent = "";
    S.histCanvas = null;
    if (S.tool === "stickers") return inspectStickers(box);
    if (S.tool === "effects") return inspectEffectsTool(box);
    if (S.tool === "transitions") return inspectTransitionsTool(box);
    if (S.tool === "templates") return inspectTemplates(box);
    if (S.tool === "draw") return inspectDraw(box);
    if (S.tool === "shapes") return inspectShapes(box);
    if (S.tool === "retouch") return inspectRetouch(box);
    if (S.tool === "crop") return inspectCrop(box);
    const clip = selectedClip();
    if (!clip) return inspectNothing(box);
    inspectClip(box, clip);
  }

  // ---- inspector: project (canvas, background) --------------------------------------------------------------
  function inspectProject(box) {
    const p = proj();
    box.appendChild(el("h3", "igfv-ed-h", { text: "Project" }));
    note(box, `Canvas ${p.w} × ${p.h} · ${M.isStill(p) ? "photo" : `video, ${E.formatTime(M.duration(p))}`}`);
    const presets = M.CANVAS_PRESETS.map((c) => ({ id: c.id, label: c.id === "original" ? `Original (${p.original.w}×${p.original.h})` : c.label }));
    const current = (M.CANVAS_PRESETS.find((c) => (c.id === "original" ? p.original.w === p.w && p.original.h === p.h : c.w === p.w && c.h === p.h)) || {}).id;
    chips(box, presets, current, (id) => change((q) => M.setCanvas(q, id), null, { inspector: true }));
    const custom = el("div", "igfv-ed-row igfv-ed-size");
    const maxSide = S.opts.maxMedia ? S.opts.maxMedia.long : 8192;
    const w = el("input", "igfv-ed-num", { type: "number", min: 16, max: maxSide, value: String(p.w) });
    const h = el("input", "igfv-ed-num", { type: "number", min: 16, max: maxSide, value: String(p.h) });
    const apply = button("Set", "", () => {
      let cw = Number(w.value);
      let ch = Number(h.value);
      const max = S.opts.maxMedia;
      if (max && (Math.max(cw, ch) > max.long || Math.min(cw, ch) > max.short)) {
        const k = Math.min(max.long / Math.max(cw, ch), max.short / Math.min(cw, ch));
        cw = Math.round(cw * k);
        ch = Math.round(ch * k);
        toast(`Canvas limited to ${cw}\u00d7${ch}: 4K and larger is for the desktop app`);
      }
      change((q) => M.setCanvas(q, null, cw, ch), null, { inspector: true });
    });
    custom.append(el("span", "igfv-ed-label", { text: "Size" }), w, el("span", "", { text: "×" }), h, apply);
    box.appendChild(custom);
    const bg = section(box, "Background");
    colorInput(bg, "Colour", () => proj().bg.color, (v) => change((q) => (q.bg.color = v), "bg-color"));
    slider(bg, {
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      def: 1,
      format: (v) => `${Math.round(v * 100)}%`,
      get: () => proj().bg.alpha,
      set: (v, mk) => change((q) => (q.bg.alpha = v), mk === null ? null : "bg-alpha"),
    });
    note(bg, "Transparency is kept in PNG and WebP photos. Videos and GIFs get an opaque background.");
    const tracks = section(box, "Tracks", false);
    const row = el("div", "igfv-ed-buttons");
    row.append(button("+ Video track", "", () => change((q) => M.addTrack(q, "video"))), button("+ Audio track", "", () => change((q) => M.addTrack(q, "audio"))));
    tracks.appendChild(row);
    note(tracks, "Higher video tracks are drawn on top. Hide, mute or lock a track from its header in the timeline.");
  }

  // ---- inspector: a clip --------------------------------------------------------------------------------------
  function inspectClip(box, clip) {
    const p = proj();
    const id = clip.id;
    const head = el("div", "igfv-ed-cliphead");
    head.append(el("h3", "igfv-ed-h", { text: clipLabel(clip) }), button("⧉", "igfv-ed-icon", duplicateSelected, "Duplicate (Ctrl+D)"), button("\u{1f5d1}", "igfv-ed-icon", deleteSelected, "Delete (Del)"));
    box.appendChild(head);
    if (clip.group != null) {
      const n = p.clips.filter((c) => c.group === clip.group).length;
      if (n > 1) {
        const g = el("div", "igfv-ed-buttons");
        g.append(el("span", "igfv-ed-label", { text: `Part of a group of ${n}: they move together` }), button("Ungroup", "", () => ungroup(id)));
        box.appendChild(g);
      }
    }
    if (M.kfProps(clip.type).length) inspectKeyframes(box, clip);
    // Timing.
    const timing = section(box, "Timing");
    numberField(timing, "Start", clip.start, (v) => change((q) => M.moveClip(q, id, Math.max(0, v), clip.track), null, { inspector: true }), { suffix: "s" });
    numberField(timing, "Duration", clip.dur, (v) => change((q) => M.trimClip(q, id, "right", clip.start + Math.max(0.1, v)), null, { inspector: true }), { suffix: "s" });
    if (clip.type === "gif") {
      const loop = el("label", "igfv-ed-row");
      const cb = el("input", "", { type: "checkbox", checked: clip.loop !== false });
      cb.addEventListener("change", () => setClip(id, (c) => (c.loop = cb.checked)));
      loop.append(cb, el("span", "igfv-ed-label", { text: "Loop the GIF" }));
      timing.appendChild(loop);
      const gs = el("select", "igfv-ed-select");
      for (const s of M.SPEEDS) gs.appendChild(el("option", "", { value: s, text: `Speed ${s}\u00d7` }));
      gs.value = String(clip.speed || 1);
      gs.addEventListener("change", () => setClip(id, (c) => (c.speed = Number(gs.value))));
      timing.appendChild(gs);
    }
    if (clip.type === "video" || clip.type === "audio") {
      const sp = el("select", "igfv-ed-select");
      for (const s of M.SPEEDS) sp.appendChild(el("option", "", { value: s, text: `Speed ${s}×` }));
      sp.value = String(clip.speed || 1);
      sp.addEventListener("change", () =>
        setClip(id, (c, q) => {
          const srcLen = c.dur * (c.speed || 1);
          c.speed = Number(sp.value);
          c.dur = Math.max(0.1, Math.min(srcLen / c.speed, M.maxDur(q, c)));
        }, null, true)
      );
      timing.appendChild(sp);
    }
    // Placement for visual clips.
    if (clip.cx != null) {
      const tf = section(box, "Transform");
      // With keyframes: the values at the playhead, and a change goes to the keyframe there.
      const seen = live(clip);
      const tset = (key, mk) => (v, m2) => setClip(id, (c) => writeTransform(c, { [key]: v }), m2 === null ? null : `${mk}-${id}`);
      if (clip.kf && clip.kf.length) note(tf, "Keyframed: changes go to the keyframe at the playhead (made if there's none).");
      slider(tf, { label: "X", min: -0.5, max: 1.5, step: 0.001, def: 0.5, format: (v) => `${Math.round(v * 100)}%`, get: () => seen.cx, set: tset("cx", "cx") });
      slider(tf, { label: "Y", min: -0.5, max: 1.5, step: 0.001, def: 0.5, format: (v) => `${Math.round(v * 100)}%`, get: () => seen.cy, set: tset("cy", "cy") });
      if (M.VISUAL_MEDIA.has(clip.type)) {
        slider(tf, { label: "Scale", min: 0.05, max: 4, step: 0.01, def: 1, format: (v) => `${Math.round(v * 100)}%`, get: () => seen.scale, set: tset("scale", "sc") });
      }
      slider(tf, { label: "Rotation", min: -180, max: 180, step: 0.5, def: 0, format: (v) => `${v}°`, get: () => seen.rotation || 0, set: tset("rotation", "ro") });
      slider(tf, { label: "Opacity", min: 0, max: 1, step: 0.01, def: 1, format: (v) => `${Math.round(v * 100)}%`, get: () => seen.opacity ?? 1, set: tset("opacity", "op") });
      if (!["blur", "pixelate", "retouch"].includes(clip.type)) {
        const blend = el("select", "igfv-ed-select");
        for (const b of L.BLENDS) blend.appendChild(el("option", "", { value: b.id, text: `Blend: ${b.label}` }));
        blend.value = clip.blend || "normal";
        blend.addEventListener("change", () => setClip(id, (c) => (c.blend = blend.value)));
        tf.appendChild(blend);
      }
      if (M.VISUAL_MEDIA.has(clip.type)) {
        const row = el("div", "igfv-ed-buttons");
        row.append(
          button("Fit", "", () => setClip(id, (c) => writeTransform(c, { scale: 1, cx: 0.5, cy: 0.5 }), null, true), "Fit inside the canvas"),
          button("Fill", "", () => setClip(id, (c, q) => writeTransform(c, { scale: M.fillScale(q, c), cx: 0.5, cy: 0.5 }), null, true), "Cover the whole canvas"),
          button("Reset", "", () => setClip(id, (c) => writeTransform(c, { scale: 1, cx: 0.5, cy: 0.5, rotation: 0, opacity: 1 }), null, true))
        );
        tf.appendChild(row);
      }
    }
    if (M.VISUAL_MEDIA.has(clip.type)) {
      const cropSec = section(box, "Crop", false);
      const row = el("div", "igfv-ed-buttons");
      row.append(
        button("Crop on canvas", "igfv-ed-primary", () => setTool("crop")),
        button("⇆", "", () => setClip(id, (c) => (c.crop.flipH = !c.crop.flipH)), "Flip horizontally"),
        button("⇅", "", () => setClip(id, (c) => (c.crop.flipV = !c.crop.flipV)), "Flip vertically"),
        button("↻", "", () => setClip(id, (c) => (c.crop = M.turnCrop(c.crop, 1)), null, true), "Rotate 90°")
      );
      cropSec.appendChild(row);
      inspectAdjust(box, clip);
      inspectFilters(box, clip);
      const fr = section(box, "Frame", false);
      slider(fr, { label: "Corners", min: 0, max: 0.5, step: 0.005, def: 0, format: (v) => `${Math.round(v * 100)}`, get: () => clip.frame.radius, set: (v, mk) => setClip(id, (c) => (c.frame.radius = v), mk === null ? null : `fr-${id}`) });
      slider(fr, { label: "Border", min: 0, max: 0.1, step: 0.001, def: 0, format: (v) => `${Math.round(v * 1000) / 10}`, get: () => clip.frame.border, set: (v, mk) => setClip(id, (c) => (c.frame.border = v), mk === null ? null : `fb-${id}`) });
      colorInput(fr, "Border colour", () => clip.frame.borderColor, (v) => setClip(id, (c) => (c.frame.borderColor = v), `fc-${id}`));
    }
    if (clip.type === "video" && clip.audioOut) {
      const au = section(box, "Audio");
      const other = M.partner(p, clip);
      note(au, other ? `Its sound is on ${(M.trackOf(p, other.track) || {}).name || "an audio track"} (detached, joined).` : "Its sound was detached (unjoined from its audio clip).");
      au.appendChild(button("Put the sound back in the video", "igfv-ed-wide", () => reattachAudio(id), "Deletes the joined audio clip"));
    } else if (clip.type === "video" || clip.type === "audio") {
      const au = section(box, "Audio");
      if (clip.type === "video" && (p.media[clip.media] || {}).hasAudio !== false) {
        au.appendChild(button("Detach audio", "igfv-ed-wide", () => detachAudio(id), "Move its sound to its own clip on an audio track, joined to the video"));
      }
      const mute = el("label", "igfv-ed-row");
      const cb = el("input", "", { type: "checkbox", checked: Boolean(clip.muted) });
      cb.addEventListener("change", () => setClip(id, (c) => (c.muted = cb.checked)));
      mute.append(cb, el("span", "igfv-ed-label", { text: "Mute this clip" }));
      au.appendChild(mute);
      slider(au, { label: "Volume", min: 0, max: 2, step: 0.05, def: 1, format: (v) => `${Math.round(v * 100)}%`, get: () => clip.volume ?? 1, set: (v, mk) => setClip(id, (c) => (c.volume = v), mk === null ? null : `vol-${id}`) });
      slider(au, { label: "Fade in", min: 0, max: 5, step: 0.1, def: 0, format: (v) => `${v.toFixed(1)} s`, get: () => clip.fadeIn || 0, set: (v, mk) => setClip(id, (c) => (c.fadeIn = v), mk === null ? null : `fi-${id}`) });
      slider(au, { label: "Fade out", min: 0, max: 5, step: 0.1, def: 0, format: (v) => `${v.toFixed(1)} s`, get: () => clip.fadeOut || 0, set: (v, mk) => setClip(id, (c) => (c.fadeOut = v), mk === null ? null : `fo-${id}`) });
    }
    if (clip.type === "text") inspectText(box, clip);
    if (clip.type === "sticker") {
      const st = section(box, "Sticker");
      slider(st, { label: "Size", min: 0.03, max: 1, step: 0.01, def: 0.18, get: () => clip.size, set: (v, mk) => setClip(id, (c, q) => { c.size = v; L.remeasure(c, q.w, q.h); }, mk === null ? null : `ss-${id}`) });
    }
    if (clip.type === "asticker") {
      const d = IgfvEditor.Stickers.design(clip.design);
      const st = section(box, `Sticker: ${d.label}`);
      slider(st, { label: "Size", min: 0.04, max: 0.8, step: 0.01, def: 0.16, get: () => clip.size, set: (v, mk) => setClip(id, (c, q) => { c.size = v; L.remeasure(c, q.w, q.h); }, mk === null ? null : `as-${id}`) });
      colorInput(st, "Colour", () => clip.color || d.color || "#ffffff", (v) => setClip(id, (c) => (c.color = v), `asc-${id}`));
      if (IgfvEditor.Stickers.TEXT_DESIGNS.has(d.id)) {
        const row = el("label", "igfv-ed-row");
        const input = el("input", "igfv-ed-search", { type: "text", maxLength: 24, value: clip.text || d.text, placeholder: d.text });
        input.addEventListener("input", () => setClip(id, (c) => (c.text = input.value), `ast-${id}`));
        row.append(el("span", "igfv-ed-label", { text: "Text" }), input);
        st.appendChild(row);
      }
      if (clip.color) st.appendChild(button("Default colour", "", () => setClip(id, (c) => (c.color = ""), null, true)));
    }
    if (L.ANIMATABLE.has(clip.type)) {
      const an = section(box, "Animation", Boolean(clip.anim && clip.anim !== "none"));
      chips(an, M.STICKER_ANIMS, clip.anim || "none", (a) => setClip(id, (c) => (c.anim = a), null, true));
    }
    if (canHaveEffects(clip)) inspectEffects(box, clip);
    if (canTransition(clip)) inspectTransition(box, clip);
    if (clip.type === "adjust") {
      const mix = section(box, "Adjustment clip");
      note(mix, "Its effects change everything on the tracks below it while it's on the timeline.");
      slider(mix, { label: "Mix", min: 0, max: 1, step: 0.01, def: 1, format: (v) => `${Math.round(v * 100)}%`, get: () => clip.opacity ?? 1, set: (v, mk) => setClip(id, (c) => (c.opacity = v), mk === null ? null : `mix-${id}`) });
    }
    if (clip.type === "shape") inspectShapeProps(box, clip);
    if (clip.type === "blur" || clip.type === "pixelate") {
      const rg = section(box, clip.type === "blur" ? "Blur" : "Pixelate");
      chips(rg, [{ id: "rect", label: "Rectangle" }, { id: "ellipse", label: "Ellipse" }], clip.shape, (s) => setClip(id, (c) => (c.shape = s), null, true));
      slider(rg, { label: "Strength", min: 5, max: 100, def: 50, get: () => clip.strength, set: (v, mk) => setClip(id, (c) => (c.strength = v), mk === null ? null : `str-${id}`) });
    }
  }

  // ---- inspector: adjust / filters (per clip) ------------------------------------------------------------------
  function adjustSlider(parent, clipId, label, key, min, max, def, opts = {}) {
    const clip = M.clipOf(proj(), clipId);
    const pathOf = (a) => (opts.path ? opts.path(a) : a);
    return slider(parent, {
      label,
      min,
      max,
      step: opts.step || 1,
      def,
      disabled: opts.advanced && !S.renderer.advanced,
      format: opts.format || ((v) => `${v > 0 && min < 0 ? "+" : ""}${Math.round(v * 100) / 100}${opts.unit || ""}`),
      get: () => pathOf(clip.adjust)[key] ?? def,
      set: (v, mk) => setClip(clipId, (c) => (pathOf(c.adjust)[key] = v), mk === null ? null : `adj-${clipId}-${opts.pathId || ""}${key}`),
    });
  }

  function inspectAdjust(box, clip) {
    const id = clip.id;
    const wrap = section(box, "Adjust", false);
    const tools = el("div", "igfv-ed-buttons");
    tools.append(button("Auto", "", () => autoAdjust(clip), "Fix levels and colour cast"), button("Reset", "", () => setClip(id, (c) => (c.adjust = M.defaultAdjust(null)), null, true)));
    wrap.appendChild(tools);
    const light = section(wrap, "Light");
    adjustSlider(light, id, "Exposure", "exposure", -2, 2, 0, { step: 0.05, unit: " EV" });
    adjustSlider(light, id, "Brightness", "brightness", 0, 200, 100, { unit: "%" });
    adjustSlider(light, id, "Contrast", "contrast", 0, 200, 100, { unit: "%" });
    adjustSlider(light, id, "Highlights", "highlights", -100, 100, 0);
    adjustSlider(light, id, "Shadows", "shadows", -100, 100, 0);
    adjustSlider(light, id, "Whites", "whites", -100, 100, 0);
    adjustSlider(light, id, "Blacks", "blacks", -100, 100, 0);
    const colour = section(wrap, "Colour", false);
    adjustSlider(colour, id, "Temperature", "temperature", -100, 100, 0);
    adjustSlider(colour, id, "Tint", "tint", -100, 100, 0);
    adjustSlider(colour, id, "Vibrance", "vibrance", -100, 100, 0, { advanced: true });
    adjustSlider(colour, id, "Saturation", "saturation", 0, 200, 100, { unit: "%" });
    adjustSlider(colour, id, "Hue", "hue", -180, 180, 0, { unit: "°" });
    adjustSlider(colour, id, "Sepia", "sepia", 0, 100, 0, { unit: "%" });
    adjustSlider(colour, id, "Grayscale", "grayscale", 0, 100, 0, { unit: "%" });
    adjustSlider(colour, id, "Invert", "invert", 0, 100, 0, { unit: "%" });
    const hsl = section(wrap, "HSL / Colour mixer", false);
    if (!S.renderer.advanced) note(hsl, "Needs WebGL.");
    chips(hsl, M.HSL_BANDS.map((b) => ({ id: b.id, label: b.label })), S.hslBand, (b) => {
      S.hslBand = b;
      renderInspector();
    });
    const band = S.hslBand;
    const bandPath = (a) => a.hsl[band];
    adjustSlider(hsl, id, "Hue", "h", -60, 60, 0, { path: bandPath, pathId: `hsl-${band}-`, advanced: true, unit: "°" });
    adjustSlider(hsl, id, "Saturation", "s", -100, 100, 0, { path: bandPath, pathId: `hsl-${band}-`, advanced: true });
    adjustSlider(hsl, id, "Luminance", "l", -100, 100, 0, { path: bandPath, pathId: `hsl-${band}-`, advanced: true });
    const levels = section(wrap, "Levels", false);
    S.histCanvas = el("canvas", "igfv-ed-hist");
    S.histCanvas.width = 256;
    S.histCanvas.height = 80;
    levels.appendChild(S.histCanvas);
    const lv = (a) => a.levels;
    adjustSlider(levels, id, "Input black", "inBlack", 0, 250, 0, { path: lv, pathId: "lv-" });
    adjustSlider(levels, id, "Input white", "inWhite", 5, 255, 255, { path: lv, pathId: "lv-" });
    adjustSlider(levels, id, "Gamma", "gamma", 0.2, 3, 1, { path: lv, pathId: "lv-", step: 0.01 });
    adjustSlider(levels, id, "Output black", "outBlack", 0, 250, 0, { path: lv, pathId: "lv-" });
    adjustSlider(levels, id, "Output white", "outWhite", 5, 255, 255, { path: lv, pathId: "lv-" });
    const curves = section(wrap, "Curves", false);
    buildCurves(curves, id);
    const detail = section(wrap, "Detail", false);
    adjustSlider(detail, id, "Clarity", "clarity", -100, 100, 0, { advanced: true });
    adjustSlider(detail, id, "Sharpen", "sharpen", 0, 100, 0);
    adjustSlider(detail, id, "Blur", "blur", 0, 20, 0, { step: 0.5 });
    adjustSlider(detail, id, "Grain", "grain", 0, 100, 0, { advanced: true });
    adjustSlider(detail, id, "Grain size", "grainSize", 1, 4, 1.5, { step: 0.1, advanced: true });
    adjustSlider(detail, id, "Vignette", "vignette", 0, 100, 0);
    adjustSlider(detail, id, "Vignette midpoint", "vignetteMid", 0, 100, 50, { advanced: true });
    adjustSlider(detail, id, "Vignette roundness", "vignetteRound", 0, 100, 0, { advanced: true });
    const split = section(wrap, "Split toning", false);
    const sp = (a) => a.split;
    adjustSlider(split, id, "Highlights hue", "hiHue", 0, 360, 40, { path: sp, pathId: "sp-", advanced: true, unit: "°" });
    adjustSlider(split, id, "Highlights amount", "hiSat", 0, 100, 0, { path: sp, pathId: "sp-", advanced: true });
    adjustSlider(split, id, "Shadows hue", "shHue", 0, 360, 210, { path: sp, pathId: "sp-", advanced: true, unit: "°" });
    adjustSlider(split, id, "Shadows amount", "shSat", 0, 100, 0, { path: sp, pathId: "sp-", advanced: true });
    adjustSlider(split, id, "Balance", "balance", -100, 100, 0, { path: sp, pathId: "sp-", advanced: true });
  }

  function autoAdjust(clip) {
    if (typeof igfvAutoLevels !== "function") return;
    const src = sourceOf(clip);
    if (!src) return;
    const small = document.createElement("canvas");
    const k = Math.min(1, 400 / Math.max(src.w, src.h));
    small.width = Math.max(1, Math.round(src.w * k));
    small.height = Math.max(1, Math.round(src.h * k));
    const ctx = small.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src.el, 0, 0, small.width, small.height);
    const auto = igfvAutoLevels(ctx.getImageData(0, 0, small.width, small.height));
    setClip(clip.id, (c) => (c.adjust.auto = auto), null, true);
  }

  function drawHistogram() {
    const c = S.histCanvas;
    if (!c || !c.isConnected) return;
    const h = IgfvEditor.Render.histogram(S.canvas);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    const max = Math.max(1, ...h.l.slice(2, 254));
    ctx.globalCompositeOperation = "lighter";
    for (const [ch, color] of [["r", "rgba(255,60,60,0.55)"], ["g", "rgba(60,220,60,0.55)"], ["b", "rgba(70,110,255,0.6)"]]) {
      ctx.fillStyle = color;
      for (let i = 0; i < 256; i++) {
        const v = Math.min(1, h[ch][i] / max);
        ctx.fillRect(i, c.height - v * c.height, 1, v * c.height);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function buildCurves(parent, clipId) {
    chips(parent, ["rgb", "r", "g", "b"].map((id) => ({ id, label: id.toUpperCase() })), S.curveChannel, (ch) => {
      S.curveChannel = ch;
      renderInspector();
    });
    const NS = "http://www.w3.org/2000/svg";
    const size = 220;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.classList.add("igfv-ed-curve");
    parent.appendChild(svg);
    note(parent, "Click to add a point, drag to move, double-click to remove.");
    const points = () => {
      const c = M.clipOf(proj(), clipId).adjust.curves;
      return (c && c[S.curveChannel]) || [[0, 0], [1, 1]];
    };
    const setPoints = (pts, mk) =>
      setClip(clipId, (c) => {
        const cv = c.adjust.curves || { rgb: [[0, 0], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] };
        cv[S.curveChannel] = pts;
        c.adjust.curves = cv;
      }, mk);
    const draw = () => {
      svg.textContent = "";
      for (let i = 1; i < 4; i++) {
        for (const [x1, y1, x2, y2] of [[(i * size) / 4, 0, (i * size) / 4, size], [0, (i * size) / 4, size, (i * size) / 4]]) {
          const line = document.createElementNS(NS, "line");
          Object.entries({ x1, y1, x2, y2, class: "igfv-ed-curve-grid" }).forEach(([k, v]) => line.setAttribute(k, v));
          svg.appendChild(line);
        }
      }
      const pts = points();
      const path = document.createElementNS(NS, "path");
      let dpath = "";
      for (let i = 0; i <= 64; i++) {
        const x = i / 64;
        const y = typeof igfvCurveEval === "function" ? igfvCurveEval(pts, x) : x;
        dpath += `${i ? "L" : "M"}${x * size},${(1 - y) * size}`;
      }
      path.setAttribute("d", dpath);
      path.setAttribute("class", `igfv-ed-curve-line igfv-ed-curve-${S.curveChannel}`);
      svg.appendChild(path);
      pts.forEach(([x, y], i) => {
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", x * size);
        dot.setAttribute("cy", (1 - y) * size);
        dot.setAttribute("r", 5);
        dot.setAttribute("class", "igfv-ed-curve-point");
        dot.dataset.index = i;
        svg.appendChild(dot);
      });
    };
    const pos = (e) => {
      const r = svg.getBoundingClientRect();
      return [M.clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1), M.clamp(1 - (e.clientY - r.top) / Math.max(1, r.height), 0, 1)];
    };
    let dragIndex = null;
    svg.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const [x, y] = pos(e);
      const pts = points().map((pt) => [...pt]);
      const idx = e.target.dataset && e.target.dataset.index != null ? Number(e.target.dataset.index) : null;
      if (idx != null) dragIndex = idx;
      else {
        pts.push([x, y]);
        pts.sort((a, b) => a[0] - b[0]);
        dragIndex = pts.findIndex((pt) => pt[0] === x && pt[1] === y);
        setPoints(pts, `curve-${Date.now()}`);
      }
      svg.setPointerCapture?.(e.pointerId);
      draw();
    });
    svg.addEventListener("pointermove", (e) => {
      if (dragIndex == null) return;
      const [x, y] = pos(e);
      const pts = points().map((pt) => [...pt]);
      const last = pts.length - 1;
      const lo = dragIndex === 0 ? 0 : pts[dragIndex - 1][0] + 0.01;
      const hi = dragIndex === last ? 1 : pts[dragIndex + 1][0] - 0.01;
      pts[dragIndex] = [dragIndex === 0 ? 0 : dragIndex === last ? 1 : M.clamp(x, lo, hi), y];
      setPoints(pts, S.history.mergeKey || `curve-${Date.now()}`);
      draw();
    });
    const end = () => {
      dragIndex = null;
      S.history.endMerge();
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const idx = e.target.dataset && e.target.dataset.index != null ? Number(e.target.dataset.index) : null;
      const pts = points();
      if (idx == null || idx === 0 || idx === pts.length - 1) return;
      setPoints(pts.filter((_, i) => i !== idx), null);
      draw();
    });
    draw();
    parent.appendChild(button("Reset curve", "", () => {
      setPoints([[0, 0], [1, 1]], null);
      draw();
    }));
  }

  function inspectFilters(box, clip) {
    const wrap = section(box, "Filters", false);
    const given = S.opts.presets || [];
    const presets = given.some((p) => p.name === "Original") ? given : [{ name: "Original", fx: {} }, ...given];
    const pick = S.presetPick && S.presetPick.clip === clip.id ? S.presetPick : null;
    chips(wrap, presets.map((p) => ({ id: p.name, label: p.name })), pick && pick.name, (name) => {
      const preset = presets.find((p) => p.name === name);
      S.presetPick = { clip: clip.id, name, base: pick ? pick.base : M.clone(clip.adjust) };
      S.presetAmount = 100;
      applyPreset(clip.id, preset);
      renderInspector();
    });
    if (pick) {
      const preset = presets.find((p) => p.name === pick.name);
      slider(wrap, { label: "Intensity", min: 0, max: 100, def: 100, format: (v) => `${Math.round(v)}%`, get: () => S.presetAmount, set: (v) => {
        S.presetAmount = v;
        applyPreset(clip.id, preset);
      } });
    }
  }

  function applyPreset(clipId, preset) {
    const pick = S.presetPick;
    const base = pick.base;
    setClip(clipId, (c) => {
      const mixed = M.mixPreset(preset.name === "Original" ? M.defaultAdjust(null) : base, preset.fx, S.presetAmount / 100);
      c.adjust = { ...mixed, hsl: base.hsl, levels: base.levels, split: base.split };
    }, `preset-${clipId}-${preset.name}`);
  }

  // ---- inspector: crop tool --------------------------------------------------------------------------------
  function inspectCrop(box) {
    const clip = selectedClip();
    if (!clip) return;
    const id = clip.id;
    const media = proj().media[clip.media];
    box.appendChild(el("h3", "igfv-ed-h", { text: `Crop · ${media.name}` }));
    note(box, "Drag the box or its handles. Shift keeps the shape.");
    chips(box, M.ASPECTS, clip.crop.aspect, (a) => setClip(id, (c, q) => Object.assign(c.crop, M.cropForAspect(c.crop, q.media[c.media], a)), null, true));
    slider(box, { label: "Straighten", min: -45, max: 45, step: 0.1, def: 0, format: (v) => `${v.toFixed(1)}°`, get: () => clip.crop.angle || 0, set: (v, mk) => setClip(id, (c) => (c.crop.angle = v), mk === null ? null : `st-${id}`) });
    const row = el("div", "igfv-ed-buttons");
    row.append(
      button("↺ 90°", "", () => setClip(id, (c) => (c.crop = M.turnCrop(c.crop, -1)), null, true), "Rotate left"),
      button("↻ 90°", "", () => setClip(id, (c) => (c.crop = M.turnCrop(c.crop, 1)), null, true), "Rotate right"),
      button("⇆", "", () => setClip(id, (c) => (c.crop.flipH = !c.crop.flipH)), "Flip horizontally"),
      button("⇅", "", () => setClip(id, (c) => (c.crop.flipV = !c.crop.flipV)), "Flip vertically")
    );
    box.appendChild(row);
    box.appendChild(button("Reset crop", "igfv-ed-wide", () => setClip(id, (c) => Object.assign(c.crop, { x: 0, y: 0, w: 1, h: 1, aspect: "free", angle: 0 }), null, true)));
    box.appendChild(button("Done", "igfv-ed-primary igfv-ed-wide", () => setTool("select")));
  }

  // ---- inspector: text / stickers / draw / shapes / retouch -------------------------------------------------
  function inspectText(box, clip) {
    const id = clip.id;
    const sec = section(box, "Text");
    const set = (key, mk = null) => (v) => setClip(id, (c, q) => {
      c[key] = v;
      L.remeasure(c, q.w, q.h);
    }, mk);
    const area = el("textarea", "igfv-ed-text", { rows: 3, value: clip.text });
    area.addEventListener("input", () => set("text", `text-${id}`)(area.value));
    area.igfvKey = (e) => {
      if (e.key === "Escape") area.blur();
    };
    sec.appendChild(area);
    const font = el("select", "igfv-ed-select");
    for (const f of L.FONTS) font.appendChild(el("option", "", { value: f.id, text: f.label }));
    font.value = clip.font;
    font.addEventListener("change", () => set("font")(font.value));
    sec.appendChild(font);
    slider(sec, { label: "Size", min: 0.02, max: 0.4, step: 0.005, def: 0.08, get: () => clip.size, set: (v, mk) => set("size", mk === null ? null : `tsize-${id}`)(v), format: (v) => `${Math.round(v * 100)}` });
    const style = el("div", "igfv-ed-buttons");
    for (const [w, label] of [[400, "Regular"], [700, "Bold"], [900, "Black"]]) style.appendChild(button(label, clip.weight === w ? "igfv-on" : "", () => set("weight")(w)));
    style.appendChild(button("Italic", clip.italic ? "igfv-on" : "", () => set("italic")(!clip.italic)));
    sec.appendChild(style);
    chips(sec, [{ id: "left", label: "Left" }, { id: "center", label: "Centre" }, { id: "right", label: "Right" }], clip.align, (a) => {
      set("align")(a);
      renderInspector();
    });
    slider(sec, { label: "Line height", min: 0.8, max: 2.5, step: 0.05, def: 1.2, get: () => clip.lineHeight, set: (v, mk) => set("lineHeight", mk === null ? null : `lh-${id}`)(v) });
    slider(sec, { label: "Spacing", min: -0.1, max: 0.5, step: 0.01, def: 0, get: () => clip.spacing, set: (v, mk) => set("spacing", mk === null ? null : `ls-${id}`)(v) });
    colorInput(sec, "Colour", () => clip.color, (v) => set("color", `tc-${id}`)(v));
    styleGrid(section(box, "Styles", false));
    const opt = (label, key, defColor, extra) => {
      const s2 = section(box, label, Boolean(clip[key]));
      const toggle = el("label", "igfv-ed-row");
      const cb = el("input", "", { type: "checkbox", checked: Boolean(clip[key]) });
      cb.addEventListener("change", () => {
        set(key)(cb.checked ? clip[key] || defColor : "");
        renderInspector();
      });
      toggle.append(cb, el("span", "igfv-ed-label", { text: "On" }));
      s2.appendChild(toggle);
      if (clip[key]) {
        colorInput(s2, "Colour", () => clip[key], (v) => set(key, `${key}-${id}`)(v));
        extra(s2);
      }
    };
    opt("Background box", "bg", "#000000", (s2) => {
      chips(s2, L.BG_STYLES, clip.bgStyle || "box", (v) => {
        setClip(id, (c, q) => {
          c.bgStyle = v;
          if (v === "brush" && !c.bgSeed) c.bgSeed = 1 + Math.floor(Math.random() * 9999);
          L.remeasure(c, q.w, q.h);
        }, null, true);
      });
      if (clip.bgStyle === "brush") s2.appendChild(button("New brush stroke", "igfv-ed-wide igfv-ed-quiet", () => setClip(id, (c) => (c.bgSeed = 1 + Math.floor(Math.random() * 9999)), null, true)));
      slider(s2, { label: "Padding", min: 0, max: 1, step: 0.05, def: 0.3, get: () => clip.bgPad, set: (v, mk) => set("bgPad", mk === null ? null : `bp-${id}`)(v) });
      slider(s2, { label: "Corners", min: 0, max: 1, step: 0.05, def: 0.25, get: () => clip.bgRadius, set: (v, mk) => set("bgRadius", mk === null ? null : `br-${id}`)(v) });
    });
    opt("Outline", "outline", "#000000", (s2) => {
      slider(s2, { label: "Width", min: 0.01, max: 0.3, step: 0.01, def: 0.08, get: () => clip.outlineWidth, set: (v, mk) => set("outlineWidth", mk === null ? null : `ow-${id}`)(v) });
    });
    opt("Shadow", "shadow", "rgba(0,0,0,0.6)", (s2) => {
      slider(s2, { label: "Blur", min: 0, max: 1, step: 0.05, def: 0.15, get: () => clip.shadowBlur, set: (v, mk) => set("shadowBlur", mk === null ? null : `sb-${id}`)(v) });
      slider(s2, { label: "Offset", min: -0.3, max: 0.3, step: 0.01, def: 0.05, get: () => clip.shadowY, set: (v, mk) => set("shadowY", mk === null ? null : `sy-${id}`)(v) });
    });
    opt("Gradient", "fill2", "#9b0000", (s2) => note(s2, "From the colour above (top) to this one (bottom)."));
    opt("Glow", "glow", "#00e5ff", (s2) => {
      slider(s2, { label: "Size", min: 0.05, max: 1.5, step: 0.05, def: 0.35, get: () => clip.glowBlur ?? 0.35, set: (v, mk) => set("glowBlur", mk === null ? null : `gb-${id}`)(v) });
    });
    // 3D: depth (extruded sides), gloss and bevel.
    const d3 = section(box, "3D", clip.depth > 0);
    const d3on = el("label", "igfv-ed-row");
    const d3cb = el("input", "", { type: "checkbox", checked: clip.depth > 0 });
    d3cb.addEventListener("change", () => {
      setClip(id, (c) => (c.depth = d3cb.checked ? 0.1 : 0), null, true);
    });
    d3on.append(d3cb, el("span", "igfv-ed-label", { text: "On" }));
    d3.appendChild(d3on);
    if (clip.depth > 0) {
      slider(d3, { label: "Depth", min: 0.02, max: 0.35, step: 0.01, def: 0.1, get: () => clip.depth, set: (v, mk) => set("depth", mk === null ? null : `dp-${id}`)(v) });
      slider(d3, { label: "Angle", min: 0, max: 359, step: 1, def: 45, format: (v) => `${Math.round(v)}\u00b0`, get: () => clip.depthAngle ?? 45, set: (v, mk) => set("depthAngle", mk === null ? null : `da-${id}`)(v) });
      colorInput(d3, "Side colour", () => clip.depthColor || "#3d0000", (v) => set("depthColor", `dc-${id}`)(v));
    }
    slider(d3, { label: "Gloss", min: 0, max: 1, step: 0.05, def: 0, get: () => clip.gloss || 0, set: (v, mk) => set("gloss", mk === null ? null : `gl-${id}`)(v) });
    const bev = el("label", "igfv-ed-row");
    const bevCb = el("input", "", { type: "checkbox", checked: Boolean(clip.bevel) });
    bevCb.addEventListener("change", () => setClip(id, (c) => (c.bevel = bevCb.checked), null, true));
    bev.append(bevCb, el("span", "igfv-ed-label", { text: "Bevel edge" }));
    d3.appendChild(bev);
  }

  // ---- text style presets -------------------------------------------------------------------------------
  // A small picture of a style: "Aa" in it.
  function stylePreview(styleId, w = 84, h = 52) {
    const c = el("canvas", "igfv-ed-trprev");
    c.width = w;
    c.height = h;
    const ctx = c.getContext && c.getContext("2d");
    if (!ctx) return c;
    try {
      ctx.fillStyle = "#3a3a46";
      ctx.fillRect(0, 0, w, h);
      const layer = L.make({ nextId: 1 }, "text", { ...TP.styleProps(styleId), text: "Aa", size: 0.5, cx: 0.5, cy: 0.5 });
      L.remeasure(layer, w, h);
      L.draw(ctx, layer, w, h, 2);
    } catch (err) {
      // a preview only
    }
    return c;
  }

  // Applies a style to the selected text, or adds a text in it.
  function applyTextStyle(styleId) {
    const props = TP.styleProps(styleId);
    if (!props) return;
    const clip = selectedClip();
    if (clip && clip.type === "text") {
      setClip(clip.id, (c, q) => {
        Object.assign(c, props);
        if (c.bgStyle === "brush" && !c.bgSeed) c.bgSeed = 1 + Math.floor(Math.random() * 9999);
        L.remeasure(c, q.w, q.h);
      }, null, true);
      toast(`${TP.STYLES.find((x) => x.id === styleId).label} style`);
    } else {
      addOverlay("text", { ...props, text: "YOUR TEXT", size: 0.09, bgSeed: 1 + Math.floor(Math.random() * 9999) });
    }
  }

  function styleGrid(parent) {
    const grid = el("div", "igfv-ed-trgrid");
    for (const st of TP.STYLES) {
      const tile = button("", "igfv-ed-trtile", () => applyTextStyle(st.id), st.label);
      tile.append(stylePreview(st.id), el("small", "", { text: st.label }));
      grid.appendChild(tile);
    }
    parent.appendChild(grid);
  }


  // ---- effects ------------------------------------------------------------------------------------------------
  const FX = () => IgfvEditor.Effects;
  const canHaveEffects = (c) => Boolean(c) && (M.VISUAL_MEDIA.has(c.type) || c.type === "adjust");
  const canTransition = (c) => Boolean(c) && M.trackKindFor(c.type) === "video" && c.type !== "adjust";

  // Selects a clip and brings its effects into view in the side panel.
  function showEffectsOf(clipId) {
    if (S.selected !== clipId) select(clipId);
    const sec = S.inspector && S.inspector.querySelector(".igfv-ed-fxsec");
    if (sec) {
      sec.open = true;
      if (sec.scrollIntoView) sec.scrollIntoView({ block: "nearest" });
    }
  }

  // Picking a green screen's colour: the next click on the canvas samples the clip's own picture
  // (before keying) under the pointer.
  function startPickKey(clipId, fxId) {
    S.pickKey = { clipId, fxId };
    S.root.classList.add("igfv-ed-picking");
    toast("Click the screen colour on the canvas (Esc cancels)");
    renderInspector();
  }

  function stopPickKey() {
    S.pickKey = null;
    S.root.classList.remove("igfv-ed-picking");
    renderInspector();
  }

  function pickKeyAt(fx, fy) {
    const { clipId, fxId } = S.pickKey;
    const p = proj();
    const clip = M.clipOf(p, clipId);
    const entry = S.renderer.cache.get(clipId);
    let hex = null;
    if (clip && entry && entry.geo && entry.geo.width) {
      // The point in the clip's picture: undo its placement (centre, rotation) on the canvas.
      const W = S.canvas.width;
      const H = S.canvas.height;
      const box = M.mediaBox(p, clip, W, H);
      const a = (-(clip.rotation || 0) * Math.PI) / 180;
      const dx = fx * W - clip.cx * W;
      const dy = fy * H - clip.cy * H;
      const u = (dx * Math.cos(a) - dy * Math.sin(a)) / box.w + 0.5;
      const v = (dx * Math.sin(a) + dy * Math.cos(a)) / box.h + 0.5;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const x = Math.min(entry.geo.width - 1, Math.floor(u * entry.geo.width));
        const y = Math.min(entry.geo.height - 1, Math.floor(v * entry.geo.height));
        const d = entry.geo.getContext("2d").getImageData(x, y, 1, 1).data;
        if (d[3] > 0) hex = `#${[d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
      }
    }
    if (!hex) {
      toast("Click inside that clip's picture");
      return;
    }
    S.pickKey = null;
    S.root.classList.remove("igfv-ed-picking");
    setFx(clipId, fxId, (x) => (x.color = hex), null, true);
    toast(`Key colour ${hex}`);
  }

  // Adds an effect to the selected clip; with none selected, an adjustment clip at the playhead.
  function addEffect(type) {
    const clip = selectedClip();
    if (M.effectDef(type).kind === "key" && !(clip && M.VISUAL_MEDIA.has(clip.type))) {
      toast("Select the video or photo with the green screen first");
      return;
    }
    if (canHaveEffects(clip)) {
      setClip(clip.id, (c, q) => {
        c.effects = c.effects || [];
        c.effects.push(M.makeEffect(q, type));
      }, null, true);
      toast(`${M.effectDef(type).label} added`);
      return;
    }
    let id = null;
    change((p) => {
      const c = M.adjustClip(p, newClipTiming(p));
      c.effects.push(M.makeEffect(p, type));
      placeOnTop(p, c);
      id = c.id;
    });
    select(id);
    toast(`Adjustment clip with ${M.effectDef(type).label}: it changes everything below it`);
  }

  function setFx(clipId, fxId, fn, mk = null, inspector = false) {
    setClip(clipId, (c) => {
      const e = (c.effects || []).find((x) => x.id === fxId);
      if (e) fn(e, c);
    }, mk, inspector);
  }

  function inspectEffectsTool(box) {
    box.appendChild(el("h3", "igfv-ed-h", { text: "Effects" }));
    const clip = selectedClip();
    const target = canHaveEffects(clip) ? clip : null;
    note(box, target ? `Click an effect to add it to \u201c${clipLabel(target)}\u201d.` : "Select a video, photo or GIF clip to add effects to it \u2014 or click one now to add an adjustment clip at the playhead, which changes everything below it.");
    // What's on the clip first (remove, switch off, reorder), then the library.
    if (target && (target.effects || []).length) inspectEffects(box, target, true);
    const search = el("input", "igfv-ed-search", { type: "search", placeholder: "Search effects\u2026", value: S.fxQuery || "" });
    box.appendChild(search);
    const list = el("div", "");
    box.appendChild(list);
    const draw = () => {
      list.textContent = "";
      const q = (S.fxQuery || "").trim().toLowerCase();
      for (const group of M.EFFECT_GROUPS) {
        const defs = M.EFFECTS.filter((d) => d.group === group && (!q || d.label.toLowerCase().includes(q) || d.id.includes(q)));
        if (!defs.length) continue;
        const sec = section(list, group, true);
        const grid = el("div", "igfv-ed-fxgrid");
        for (const d of defs) {
          const ok = FX().supported(d.id);
          const b = button(d.label, "igfv-ed-fxbtn", () => addEffect(d.id), ok ? `Add ${d.label}` : `${d.label} needs WebGL, which isn't available here`);
          if (!ok) b.disabled = true;
          if (M.effectAnimated({ type: d.id, ...Object.fromEntries(d.params.map((x) => [x.k, x.def])) })) b.appendChild(el("span", "igfv-ed-fx-anim", { text: "\u25cf", title: "Animated" }));
          grid.appendChild(b);
        }
        sec.appendChild(grid);
      }
      if (!list.childElementCount) note(list, "No effects match.");
    };
    search.addEventListener("input", () => {
      S.fxQuery = search.value;
      draw();
    });
    draw();
  }

  // The clip's effects in order, each with its controls.
  function inspectEffects(box, clip, open = false) {
    const id = clip.id;
    const list = clip.effects || [];
    const sec = section(box, list.length ? `Effects on this clip (${list.length})` : "Effects", open || clip.type === "adjust" || list.length > 0);
    sec.classList.add("igfv-ed-fxsec");
    if (!list.length) note(sec, "No effects yet.");
    if (M.VISUAL_MEDIA.has(clip.type) && !list.some((e) => e.type === "chromakey")) {
      sec.appendChild(button("Remove green screen", "igfv-ed-wide", () => addEffect("chromakey"), "Key out a green (or blue) background so the tracks below show through"));
    }
    list.forEach((e, i) => {
      const def = M.effectDef(e.type);
      if (!def) return;
      const card = el("div", `igfv-ed-fx${e.on === false ? " igfv-off" : ""}`);
      const head = el("div", "igfv-ed-fx-head");
      head.append(
        button(e.on === false ? "\u25cb" : "\u25c9", "igfv-ed-mini", () => setFx(id, e.id, (x) => (x.on = x.on === false), null, true), e.on === false ? "Switch on" : "Switch off"),
        el("strong", "", { text: def.label }),
        button("\u2191", "igfv-ed-mini", () => setClip(id, (c) => c.effects.splice(i - 1, 0, c.effects.splice(i, 1)[0]), null, true), "Earlier (applied before the one above)"),
        button("\u2193", "igfv-ed-mini", () => setClip(id, (c) => c.effects.splice(i + 1, 0, c.effects.splice(i, 1)[0]), null, true), "Later"),
        button("\u2715", "igfv-ed-mini", () => setClip(id, (c) => c.effects.splice(i, 1), null, true), "Remove")
      );
      head.children[2].disabled = i === 0;
      head.children[3].disabled = i === list.length - 1;
      card.appendChild(head);
      if (!FX().supported(e.type)) note(card, "Needs WebGL, which isn't available here: skipped.");
      if (e.type === "chromakey") {
        note(card, "Removes this colour so the tracks below (or the background) show through.");
        const row = el("div", "igfv-ed-buttons");
        row.append(
          button("Green", "", () => setFx(id, e.id, (x) => (x.color = "#00d000"), null, true), "A green screen"),
          button("Blue", "", () => setFx(id, e.id, (x) => (x.color = "#1030e0"), null, true), "A blue screen"),
          button(S.pickKey && S.pickKey.fxId === e.id ? "Click the canvas\u2026" : "Pick colour", S.pickKey && S.pickKey.fxId === e.id ? "igfv-on" : "", () => startPickKey(id, e.id), "Click the screen colour on the canvas (Esc cancels)")
        );
        card.appendChild(row);
      }
      if (!def.noAmount) {
        slider(card, { label: "Amount", min: 0, max: 100, def: def.amount, format: (v) => `${Math.round(v)}`, get: () => e.amount ?? def.amount, set: (v, mk) => setFx(id, e.id, (x) => (x.amount = v), mk === null ? null : `fx-${e.id}-amount`) });
      }
      for (const prm of def.params) {
        if (prm.type === "color") {
          colorInput(card, prm.label, () => e[prm.k] || prm.def, (v) => setFx(id, e.id, (x) => (x[prm.k] = v), `fx-${e.id}-${prm.k}`));
        } else if (prm.type === "choice") {
          const sel = el("select", "igfv-ed-select");
          for (const [v, label] of prm.choices) sel.appendChild(el("option", "", { value: v, text: `${prm.label}: ${label}` }));
          sel.value = e[prm.k] ?? prm.def;
          sel.addEventListener("change", () => setFx(id, e.id, (x) => (x[prm.k] = sel.value)));
          card.appendChild(sel);
        } else {
          slider(card, { label: prm.label, min: prm.min, max: prm.max, step: prm.step || 1, def: prm.def, get: () => e[prm.k] ?? prm.def, set: (v, mk) => setFx(id, e.id, (x) => (x[prm.k] = v), mk === null ? null : `fx-${e.id}-${prm.k}`) });
        }
      }
      sec.appendChild(card);
    });
    if (S.tool !== "effects") sec.appendChild(button("+ Add effect\u2026", "igfv-ed-wide", () => setTool("effects")));
  }

  // ---- transitions ----------------------------------------------------------------------------------------------
  function applyTransition(type) {
    const clip = selectedClip();
    if (!canTransition(clip)) return toast("Select a clip on a video track first");
    // A clip that has one keeps its length, easing, alignment and colour; only the type changes.
    setClip(clip.id, (c) => (c.transIn = c.transIn ? { ...c.transIn, type } : { type, dur: S.transDur || M.TRANSITION_DEFAULT_DUR }), null, true);
    const info = M.transInfo(proj(), M.clipOf(proj(), clip.id));
    if (info && S.engine && !M.isStill(proj())) S.engine.seek(Math.max(0, info.from - 0.3));
    toast(`${M.TRANSITIONS.find((x) => x.id === type).label} added`);
  }

  // Small animated previews of the transitions (two colour cards), while the inspector shows them.
  function previewCards(w, h) {
    const card = (c1, c2, text) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(255,255,255,0.9)";
      x.font = `bold ${Math.round(h * 0.45)}px system-ui, sans-serif`;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(text, w / 2, h / 2);
      return c;
    };
    return [card("#e1306c", "#f77737", "A"), card("#405de6", "#5ac8fa", "B")];
  }

  function animatePreviews(canvases, drawOne) {
    const t0 = performance.now();
    const tick = () => {
      if (!S || !canvases.length || !canvases[0].isConnected) return;
      const t = (performance.now() - t0) / 1000;
      for (const c of canvases) drawOne(c, t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function inspectTransitionsTool(box) {
    box.appendChild(el("h3", "igfv-ed-h", { text: "Transitions" }));
    const clip = selectedClip();
    const ok = canTransition(clip);
    const prev = ok ? M.prevOnTrack(proj(), clip) : null;
    note(
      box,
      !ok
        ? "Select a clip on a video track: the transition plays at its start, from the clip right before it on the same track (or from what's below)."
        : prev
          ? `Click a transition for the cut into \u201c${clipLabel(clip)}\u201d.`
          : `Click one: \u201c${clipLabel(clip)}\u201d comes in with it (no clip ends right where it starts on its track, so it comes in over what's below).`
    );
    // This clip's transition first: its settings, Remove.
    if (ok && clip.transIn) inspectTransition(box, clip, true);
    slider(box, { label: ok && clip.transIn ? "New ones: length" : "Length", min: 0.2, max: 3, step: 0.05, def: M.TRANSITION_DEFAULT_DUR, format: (v) => `${v.toFixed(2)} s`, get: () => S.transDur || M.TRANSITION_DEFAULT_DUR, set: (v) => (S.transDur = v) });
    const [ca, cb] = previewCards(84, 52);
    const canvases = [];
    for (const group of M.TRANSITION_GROUPS) {
      const sec = section(box, group, true);
      const grid = el("div", "igfv-ed-trgrid");
      for (const tr of M.TRANSITIONS.filter((x) => x.group === group)) {
        const tile = button("", "igfv-ed-trtile", () => applyTransition(tr.id), tr.label);
        const c = el("canvas", "igfv-ed-trprev");
        c.width = 84;
        c.height = 52;
        c.dataset.type = tr.id;
        canvases.push(c);
        if (ok && clip.transIn && clip.transIn.type === tr.id) tile.classList.add("igfv-on");
        tile.append(c, el("small", "", { text: tr.label }));
        grid.appendChild(tile);
      }
      sec.appendChild(grid);
    }
    animatePreviews(canvases, (c, t) => {
      const ctx = c.getContext("2d");
      const p = M.clamp(((t % 2) - 0.3) / 1.2, 0, 1);
      ctx.clearRect(0, 0, c.width, c.height);
      FX().transition(c.dataset.type, ctx, ca, cb, p, c.width, c.height);
    });
  }

  // A clip's transition: its type, length, remove.
  function inspectTransition(box, clip, open = false) {
    const id = clip.id;
    const sec = section(box, "Transition in", open || Boolean(clip.transIn));
    if (!clip.transIn) {
      note(sec, "None.");
      sec.appendChild(button("+ Add transition\u2026", "igfv-ed-wide", () => setTool("transitions")));
      return;
    }
    const sel = el("select", "igfv-ed-select");
    for (const tr of M.TRANSITIONS) sel.appendChild(el("option", "", { value: tr.id, text: tr.label }));
    sel.value = clip.transIn.type;
    sel.addEventListener("change", () => setClip(id, (c) => (c.transIn.type = sel.value), null, true));
    sec.appendChild(sel);
    const tin = clip.transIn;
    const info = M.transInfo(proj(), clip);
    const set = (fn) => setClip(id, (c) => fn(c.transIn), null, true);
    // Direction: Wipe / Slide / Push come in four.
    const fam = /^(wipe|slide|push)(left|right|up|down)$/.exec(tin.type);
    if (fam) {
      sec.appendChild(el("span", "igfv-ed-label", { text: "Direction" }));
      chips(sec, [["left", "\u2190"], ["right", "\u2192"], ["up", "\u2191"], ["down", "\u2193"]].map(([d, label]) => ({ id: d, label, title: M.TRANSITIONS.find((x) => x.id === fam[1] + d).label })), fam[2], (d) => set((t) => (t.type = fam[1] + d)));
    }
    slider(sec, { label: "Length", min: 0.1, max: 3, step: 0.05, def: M.TRANSITION_DEFAULT_DUR, format: (v) => `${v.toFixed(2)} s`, get: () => tin.dur, set: (v, mk) => setClip(id, (c) => (c.transIn.dur = v), mk === null ? null : `tr-${id}`) });
    if (info && info.d + 1e-6 < tin.dur) note(sec, `Plays for ${info.d.toFixed(2)} s: it can't be longer than the clips it covers.`);
    sec.appendChild(el("span", "igfv-ed-label", { text: "Easing" }));
    chips(sec, [
      { id: "smooth", label: "Smooth", title: "Slow at both ends" },
      { id: "linear", label: "Linear", title: "Even speed" },
      { id: "in", label: "Ease in", title: "Starts slowly" },
      { id: "out", label: "Ease out", title: "Ends slowly" },
    ], tin.ease || "smooth", (v) => set((t) => (v === "smooth" ? delete t.ease : (t.ease = v))));
    if (info && info.prev) {
      sec.appendChild(el("span", "igfv-ed-label", { text: "Alignment" }));
      chips(sec, [
        { id: "end", label: "Ends at cut", title: "Over the end of the clip before" },
        { id: "center", label: "Centred", title: "Half before the cut, half after" },
        { id: "start", label: "Starts at cut", title: "Over the start of this clip" },
      ], tin.align || "center", (v) => set((t) => (v === "center" ? delete t.align : (t.align = v))));
    }
    if (tin.type === "dipblack" || tin.type === "dipwhite" || tin.type === "flash") {
      const def = tin.type === "dipblack" ? "#000000" : "#ffffff";
      colorInput(sec, "Colour", () => tin.color || def, (v) => setClip(id, (c) => (c.transIn.color = v), `trc-${id}`));
      if (tin.color && tin.color !== def) sec.appendChild(button("Default colour", "igfv-ed-wide igfv-ed-quiet", () => set((t) => delete t.color)));
    }
    note(sec, info && info.prev ? `From \u201c${clipLabel(info.prev)}\u201d.` : "From what's below (no clip ends right where this one starts on its track).");
    sec.appendChild(button("Remove transition", "igfv-ed-wide", () => removeTransition(id)));
  }

  // ---- keyframes: add, remove, pick, ease; Animate presets --------------------------------------------------
  const keyable = (c) => Boolean(c) && M.kfProps(c.type).length > 0;

  // Adds a keyframe at the playhead to the selected clip(s), or removes the one there.
  function toggleKeyAtPlayhead() {
    const p = proj();
    const t = now();
    const ids = selectedIds().filter((id) => {
      const c = M.clipOf(p, id);
      return keyable(c) && t >= c.start - 1e-6 && t <= c.start + c.dur + 1e-6;
    });
    if (!ids.length) return toast(selectedIds().length ? "Move the playhead over the clip first" : "Select a clip first");
    const c0 = M.clipOf(p, ids[0]);
    const removing = Boolean(M.kfAt(c0, t - c0.start));
    change((q) => {
      for (const id of ids) {
        const c = M.clipOf(q, id);
        const lt = M.clamp(t - c.start, 0, c.dur);
        const k = M.kfAt(c, lt);
        if (removing) {
          if (k) M.removeKey(c, c.kf.indexOf(k));
        } else if (!k) M.addKey(c, lt);
      }
    }, null, { inspector: true });
    S.kfPick = null;
    toast(removing ? "Keyframe removed" : "Keyframe added: move the playhead, then move / resize / rotate the clip to animate it");
  }

  // The playhead to the previous / next keyframe of the selected clip(s).
  function jumpKey(dir) {
    const p = proj();
    const t = now();
    const times = [];
    for (const id of selectedIds()) {
      const c = M.clipOf(p, id);
      for (const k of (c && c.kf) || []) times.push(c.start + k.t);
    }
    if (!times.length) return toast("No keyframes on the selected clip");
    times.sort((a, b) => a - b);
    const to = dir > 0 ? times.find((x) => x > t + 1e-3) : [...times].reverse().find((x) => x < t - 1e-3);
    if (to == null) return toast(dir > 0 ? "No keyframe after the playhead" : "No keyframe before the playhead");
    S.engine.seek(to);
  }

  function pickKey(clipId, index) {
    const c = M.clipOf(proj(), clipId);
    if (!c || !c.kf || !c.kf[index]) return;
    if (S.selected !== clipId) select(clipId);
    S.kfPick = { clip: clipId, index };
    S.engine.seek(c.start + c.kf[index].t);
    afterChange(true);
  }

  function deletePickedKey() {
    const pk = S.kfPick;
    if (!pk) return;
    change((q) => {
      const c = M.clipOf(q, pk.clip);
      if (c && c.kf && c.kf[pk.index]) M.removeKey(c, pk.index);
    }, null, { inspector: true });
    S.kfPick = null;
    toast("Keyframe deleted (Ctrl+Z brings it back)");
  }

  function clearKeys(clipId) {
    change((q) => {
      const c = M.clipOf(q, clipId);
      if (!c || !c.kf) return;
      // the clip stays as it looks at the playhead
      Object.assign(c, M.keyValues(M.animated(c, M.clamp(now() - c.start, 0, c.dur))));
      delete c.kf;
    }, null, { inspector: true });
    S.kfPick = null;
    toast("Keyframes cleared");
  }

  function setKeyEase(clipId, index, ease) {
    change((q) => {
      const c = M.clipOf(q, clipId);
      if (c && c.kf && c.kf[index]) c.kf[index].ease = ease;
    }, null, { inspector: true });
  }

  // Animate presets: two keyframes, at the playhead (as it is) and S.animDur later.
  const ANIMATIONS = [
    { id: "shrink-ne", label: "Shrink to \u2197" },
    { id: "shrink-nw", label: "Shrink to \u2196" },
    { id: "shrink-se", label: "Shrink to \u2198" },
    { id: "shrink-sw", label: "Shrink to \u2199" },
    { id: "grow", label: "Grow in" },
    { id: "zoomin", label: "Zoom in" },
    { id: "zoomout", label: "Zoom out" },
    { id: "centre", label: "Move to the centre" },
    { id: "out-l", label: "Slide out \u2190" },
    { id: "out-r", label: "Slide out \u2192" },
    { id: "out-u", label: "Slide out \u2191" },
    { id: "out-d", label: "Slide out \u2193" },
    { id: "spin", label: "Spin 360\u00b0" },
    { id: "fadein", label: "Fade in" },
    { id: "fadeout", label: "Fade out" },
  ];

  function animateMenu() {
    return ANIMATIONS.map((a) => ({ label: a.label, run: () => applyAnimation(a.id) }));
  }

  // The values that change a clip's size by k.
  function sizedBy(c, v, k) {
    if (M.VISUAL_MEDIA.has(c.type)) return { scale: v.scale * k };
    if ("size" in v) return { size: v.size * k };
    return { w: v.w * k, h: v.h * k };
  }

  // A clip's box (canvas fractions) with these values.
  function boxWith(q, c, v) {
    const x = { ...c, ...v };
    if (M.VISUAL_MEDIA.has(c.type)) {
      const b = M.mediaBox(q, x, q.w, q.h);
      return { w: b.w / q.w, h: b.h / q.h };
    }
    if (L.TRANSFORMABLE.has(c.type)) {
      const b = L.boxPx(x, q.w, q.h);
      return { w: b.w / q.w, h: b.h / q.h };
    }
    return { w: x.w || 0.2, h: x.h || 0.2 };
  }

  function animTargets(q, c, a, id) {
    let from = a;
    let to = { ...a };
    if (id.startsWith("shrink-")) {
      const corner = id.slice(7);
      to = { ...a, ...sizedBy(c, a, 0.35) };
      const b = boxWith(q, c, to);
      const m = 0.04;
      to.cx = corner.includes("e") ? 1 - m - b.w / 2 : m + b.w / 2;
      to.cy = corner.includes("n") ? m * (q.w / q.h) + b.h / 2 : 1 - m * (q.w / q.h) - b.h / 2;
    } else if (id === "grow") from = { ...a, ...sizedBy(c, a, 0.05), opacity: 0 };
    else if (id === "zoomin") to = { ...a, ...sizedBy(c, a, 1.4) };
    else if (id === "zoomout") to = { ...a, ...sizedBy(c, a, 0.7) };
    else if (id === "centre") to = { ...a, cx: 0.5, cy: 0.5 };
    else if (id === "out-l") to = { ...a, cx: -0.6 };
    else if (id === "out-r") to = { ...a, cx: 1.6 };
    else if (id === "out-u") to = { ...a, cy: -0.6 };
    else if (id === "out-d") to = { ...a, cy: 1.6 };
    else if (id === "spin") to = { ...a, rotation: (a.rotation || 0) + 360 };
    else if (id === "fadein") from = { ...a, opacity: 0 };
    else if (id === "fadeout") to = { ...a, opacity: 0 };
    return { from, to };
  }

  function applyAnimation(id) {
    const p = proj();
    const t = now();
    const len = S.animDur || 0.5;
    const ids = selectedIds().filter((x) => keyable(M.clipOf(p, x)));
    if (!ids.length) return toast("Select a clip first");
    const short = ids.some((x) => {
      const c = M.clipOf(p, x);
      return t < c.start - 1e-6 || t > c.start + c.dur - 0.1;
    });
    if (short) return toast("Put the playhead on the clip, where the animation should start (before its end)");
    change((q) => {
      for (const x of ids) {
        const c = M.clipOf(q, x);
        const lt0 = M.clamp(t - c.start, 0, c.dur);
        const lt1 = Math.min(c.dur, lt0 + len);
        const a = M.keyValues(M.animated(c, lt0));
        const { from, to } = animTargets(q, c, a, id);
        M.addKey(c, lt0, from, "inout");
        M.addKey(c, lt1, to);
      }
    }, null, { inspector: true });
    toast(`${ANIMATIONS.find((a) => a.id === id).label}: ${len} s from the playhead (two keyframes)`);
  }

  // The side panel's Keyframes section.
  function inspectKeyframes(box, clip) {
    const id = clip.id;
    const kf = clip.kf || [];
    const sec = section(box, "Keyframes \u25c6", kf.length > 0);
    if (!kf.length) note(sec, "Animate position, size, rotation and opacity: add a keyframe (\u25c6, K), move the playhead, then move / resize / rotate the clip. Or pick an animation below.");
    const nav = el("div", "igfv-ed-buttons");
    const here = M.kfAt(clip, now() - clip.start);
    nav.append(button("\u25c2\u25c6", "", () => jumpKey(-1), "Previous keyframe"), button(here ? "\u25c6 Remove at the playhead" : "\u25c6 Add at the playhead", "", toggleKeyAtPlayhead), button("\u25c6\u25b8", "", () => jumpKey(1), "Next keyframe"));
    sec.appendChild(nav);
    kf.forEach((k, i) => {
      const picked = S.kfPick && S.kfPick.clip === id && S.kfPick.index === i;
      const row = el("div", `igfv-ed-kfrow${picked ? " igfv-on" : ""}`);
      const go = button(`\u25c6 ${E.formatTime(clip.start + k.t)}`, "", () => pickKey(id, i), "Go to this keyframe");
      const ease = el("select", "igfv-ed-select");
      for (const x of M.KF_EASES) ease.appendChild(el("option", "", { value: x.id, text: x.label }));
      ease.appendChild(el("option", "", { value: "custom", text: "Custom curve" }));
      ease.value = typeof k.ease === "object" ? "custom" : k.ease || "linear";
      ease.title = "How it moves to the next keyframe";
      ease.disabled = i === kf.length - 1;
      ease.addEventListener("change", () => setKeyEase(id, i, ease.value === "custom" ? { bezier: [0.25, 0.1, 0.25, 1] } : ease.value));
      const del = button("\u2715", "igfv-ed-icon", () => {
        S.kfPick = { clip: id, index: i };
        deletePickedKey();
      }, "Delete this keyframe");
      row.append(go, ease, del);
      sec.appendChild(row);
      if (typeof k.ease === "object" && i < kf.length - 1) curveEditor(sec, id, i, k.ease.bezier);
    });
    if (kf.length) sec.appendChild(button("Clear all keyframes", "igfv-ed-wide igfv-ed-quiet", () => clearKeys(id)));
    sec.appendChild(el("h4", "igfv-ed-stgroup", { text: "Animate from the playhead" }));
    chips(sec, [0.3, 0.5, 1, 2].map((d) => ({ id: d, label: `${d} s` })), S.animDur || 0.5, (d) => {
      S.animDur = d;
      renderInspector();
    });
    const grid = el("div", "igfv-ed-buttons igfv-ed-animgrid");
    for (const a of ANIMATIONS) grid.appendChild(button(a.label, "", () => applyAnimation(a.id)));
    sec.appendChild(grid);
  }

  // A custom ease: x1 y1 x2 y2 and a little picture of the curve.
  function curveEditor(parent, clipId, index, pts) {
    const wrap = el("div", "igfv-ed-curve");
    const c = el("canvas", "igfv-ed-curveprev");
    c.width = 72;
    c.height = 72;
    const ctx = c.getContext && c.getContext("2d");
    if (ctx) {
      const f = M.cubicBezier(...pts);
      ctx.fillStyle = "#16161c";
      ctx.fillRect(0, 0, 72, 72);
      ctx.strokeStyle = "#555";
      ctx.strokeRect(8.5, 8.5, 55, 55);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        const x = 8 + u * 55;
        const y = 64 - f(u) * 55;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const fields = el("div", "igfv-ed-curvefields");
    ["x1", "y1", "x2", "y2"].forEach((name, j) => {
      const input = el("input", "igfv-ed-num", { type: "number", step: 0.05, min: j % 2 ? -2 : 0, max: j % 2 ? 3 : 1, value: String(pts[j]), title: name });
      input.addEventListener("change", () => {
        const next = [...pts];
        next[j] = M.clamp(Number(input.value) || 0, j % 2 ? -2 : 0, j % 2 ? 3 : 1);
        setKeyEase(clipId, index, { bezier: next });
      });
      fields.append(el("span", "igfv-ed-label", { text: name }), input);
    });
    wrap.append(c, fields);
    parent.appendChild(wrap);
  }

  // ---- split-screen boxes: the picture inside ---------------------------------------------------------------
  // The box of a media clip, in canvas fractions.
  function boxFrac(p, c) {
    const b = M.mediaBox(p, c, p.w, p.h);
    return { w: b.w / p.w, h: b.h / p.h };
  }

  // A split box's region (canvas fractions); boxes made before regions were kept: from the box.
  function regionOf(p, c) {
    if (c.region) return { ...c.region };
    const b = boxFrac(p, c);
    return { x: c.cx - b.w / 2, y: c.cy - b.h / 2, w: b.w, h: b.h };
  }

  // Dragging a side or corner of a split box: that side moves (Shift on a corner keeps the shape);
  // the picture fills the new box, keeping its zoom and centre.
  function dragRegion(d, dx, dy, shift) {
    const r0 = d.region;
    const min = 0.05;
    const hn = d.hnd;
    let { x, y, w, h } = r0;
    if (hn.includes("e")) w = r0.w + dx;
    if (hn.includes("w")) w = r0.w - dx;
    if (hn.includes("s")) h = r0.h + dy;
    if (hn.includes("n")) h = r0.h - dy;
    if (shift && hn.length === 2) {
      const k = Math.max(w / r0.w, h / r0.h);
      w = r0.w * k;
      h = r0.h * k;
    }
    w = M.clamp(w, min, 1);
    h = M.clamp(h, min, 1);
    if (hn.includes("w")) x = r0.x + r0.w - w;
    if (hn.includes("n")) y = r0.y + r0.h - h;
    // kept on the canvas
    if (x < 0) {
      w += x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      y = 0;
    }
    w = Math.max(min, Math.min(w, 1 - x));
    h = Math.max(min, Math.min(h, 1 - y));
    change((q) => {
      const c = M.clipOf(q, d.clipId);
      c.region = { x, y, w, h };
      c.crop = { ...d.crop };
      M.refitRegion(q, c);
    }, `region-${d.clipId}`);
  }

  // A drag inside a split box moves the picture (its crop), not the box.
  function panInBox(d, dx, dy) {
    const p = proj();
    const c = M.clipOf(p, d.clipId);
    if (!c) return;
    // Zoomed out: the smaller picture moves about in its box (its centre stays inside).
    if (d.boxZoom != null && d.boxZoom < 1) {
      const r = regionOf(p, c);
      const pan = { x: M.clamp(d.boxPan.x + dx / r.w, -0.5, 0.5), y: M.clamp(d.boxPan.y + dy / r.h, -0.5, 0.5) };
      change((q) => {
        const cq = M.clipOf(q, d.clipId);
        cq.boxPan = pan;
        M.refitRegion(q, cq);
      }, `panin-${d.clipId}`);
      return;
    }
    const b = boxFrac(p, c);
    const sx = d.crop.flipH ? -1 : 1;
    const sy = d.crop.flipV ? -1 : 1;
    const x = M.clamp(d.crop.x - (sx * dx * d.crop.w) / Math.max(1e-6, b.w), 0, 1 - d.crop.w);
    const y = M.clamp(d.crop.y - (sy * dy * d.crop.h) / Math.max(1e-6, b.h), 0, 1 - d.crop.h);
    change((q) => Object.assign(M.clipOf(q, d.clipId).crop, { x, y }), `panin-${d.clipId}`);
  }

  // The wheel over a split box zooms the picture in it around the pointer; the box stays. Past
  // "fills the box" it zooms out: more of the picture, then smaller, down to 25 % (the rest of the
  // box shows what's under it).
  function zoomInBox(clip, fx, fy, f) {
    const p = proj();
    const m = p.media[clip.media];
    if (!m) return;
    const r = regionOf(p, clip);
    const boxRatio = (r.w * p.w) / (r.h * p.h);
    const out = clip.boxZoom != null && clip.boxZoom < 1;
    const cr = clip.crop;
    const [ow, oh] = M.orientedSize(m, cr);
    const ratio = out ? boxRatio : (cr.w * ow) / (cr.h * oh);
    const full = M.cropForRatio({ ...cr, x: 0, y: 0, w: 1, h: 1 }, m, ratio);
    const atFull = !out && cr.w >= full.w - 1e-6 && cr.h >= full.h - 1e-6;
    if (out || (atFull && f < 1)) {
      const z = (out ? clip.boxZoom : 1) * f;
      if (z >= 1) {
        // back to filling the box
        change((q) => {
          const c = M.clipOf(q, clip.id);
          delete c.boxZoom;
          delete c.boxPan;
          c.region = r;
          c.crop = M.cropForRatio({ ...c.crop, x: 0, y: 0, w: 1, h: 1 }, m, boxRatio);
          M.refitRegion(q, c);
        }, `zoomin-${clip.id}`);
        return;
      }
      if (out && z <= M.BOX_ZOOM_MIN && clip.boxZoom <= M.BOX_ZOOM_MIN + 1e-9) return toast("That's as small as it gets (25 %)");
      change((q) => {
        const c = M.clipOf(q, clip.id);
        c.region = r;
        if (!out) c.boxPan = { x: 0, y: 0 };
        c.boxZoom = Math.max(M.BOX_ZOOM_MIN, z);
        M.refitRegion(q, c);
      }, `zoomin-${clip.id}`);
      return;
    }
    const w = M.clamp(cr.w / f, full.w * 0.1, full.w);
    const h = (cr.h * w) / cr.w;
    const b = boxFrac(p, clip);
    const u = M.clamp((fx - (clip.cx - b.w / 2)) / b.w, 0, 1);
    const v = M.clamp((fy - (clip.cy - b.h / 2)) / b.h, 0, 1);
    const x = M.clamp(cr.x + u * cr.w - u * w, 0, 1 - w);
    const y = M.clamp(cr.y + v * cr.h - v * h, 0, 1 - h);
    change((q) => Object.assign(M.clipOf(q, clip.id).crop, { w, h, x, y }), `zoomin-${clip.id}`);
  }

  // Right-click on a split box.
  function splitBoxItems(clip) {
    if (!clip || !clip.split) return [];
    const id = clip.id;
    const leave = (c) => {
      delete c.split;
      delete c.region;
      delete c.boxZoom;
      delete c.boxPan;
      c.frame = { ...c.frame, radius: 0, border: 0 };
    };
    const fill = (q, c) => {
      M.fitInRegion(q, c, { x: 0, y: 0, w: 1, h: 1 });
      leave(c);
    };
    const others = () => {
      const p = proj();
      return p.clips.filter((o) => o.id !== id && o.split && o.start < clip.start + clip.dur - 1e-6 && clip.start < o.start + o.dur - 1e-6);
    };
    return [
      { label: "Fill the canvas with this one", run: () => change((q) => fill(q, M.clipOf(q, id)), null, { inspector: true }) },
      {
        label: "Keep only this one (fill the canvas)",
        disabled: !others().length,
        run: () => {
          const gone = others().map((o) => o.id);
          change((q) => {
            for (const o of gone) if (M.clipOf(q, o)) M.deleteLinked(q, o);
            fill(q, M.clipOf(q, id));
          }, null, { inspector: true });
          gone.forEach((o) => S.renderer.forget(o));
          toast(`Removed ${gone.length} other box${gone.length > 1 ? "es" : ""}: this one fills the canvas`);
        },
      },
      {
        label: "Fit the whole picture",
        run: () =>
          change((q) => {
            const c = M.clipOf(q, id);
            Object.assign(c, { crop: { ...c.crop, x: 0, y: 0, w: 1, h: 1, aspect: "free" }, scale: 1, cx: 0.5, cy: 0.5 });
            leave(c);
          }, null, { inspector: true }),
      },
      {
        label: "Reset the picture in its box",
        run: () =>
          change((q) => {
            const c = M.clipOf(q, id);
            const m = q.media[c.media];
            const [ow, oh] = M.orientedSize ? M.orientedSize(m, c.crop) : [m.w, m.h];
            const r = regionOf(q, c);
            delete c.boxZoom;
            delete c.boxPan;
            c.region = r;
            c.crop = M.cropForRatio({ ...c.crop, x: 0, y: 0, w: 1, h: 1 }, m, (r.w * q.w) / (r.h * q.h));
            M.refitRegion(q, c);
          }, null, { inspector: true }),
      },
      { label: "Remove from split screen", danger: true, run: () => deleteClips([id]) },
      { sep: true },
    ];
  }

  // ---- templates: banners, news, quotes; split screens --------------------------------------------------------
  const isVisualMedia = (c) => Boolean(c) && M.VISUAL_MEDIA.has(c.type);

  // A template's picture: its pieces drawn small (the photo slot as a grey box).
  function templatePreview(tpl, w, h) {
    const c = el("canvas", "igfv-ed-trprev igfv-ed-tplprev");
    c.width = w;
    c.height = h;
    const ctx = c.getContext && c.getContext("2d");
    if (!ctx) return c;
    try {
      ctx.fillStyle = "#3a3a46";
      ctx.fillRect(0, 0, w, h);
      for (const spec of tpl.layers()) {
        if (spec.slot) {
          if (!tpl.photo) continue;
          ctx.fillStyle = "#6b6b7a";
          ctx.fillRect(tpl.photo.x * w, tpl.photo.y * h, tpl.photo.w * w, tpl.photo.h * h);
          continue;
        }
        const { type, noslot, ...props } = spec;
        const layer = L.make({ nextId: 1 }, type, props);
        L.remeasure(layer, w, h);
        L.draw(ctx, layer, w, h, layer.anim === "ticker" ? 1 : 2);
      }
    } catch (err) {
      // a preview only
    }
    return c;
  }

  // A layout's picture: its regions, A (the selected clip), B, C.
  function layoutPreview(lay, w, h) {
    const c = el("canvas", "igfv-ed-trprev igfv-ed-tplprev");
    c.width = w;
    c.height = h;
    const ctx = c.getContext && c.getContext("2d");
    if (!ctx) return c;
    const p = proj();
    ctx.fillStyle = "#16161c";
    ctx.fillRect(0, 0, w, h);
    const colours = ["#e1306c", "#405de6", "#2fbf71"];
    lay.regions(p, 0.02, S.pipSize || 0.32).forEach((r, i) => {
      ctx.fillStyle = colours[i];
      ctx.fillRect(r.x * w, r.y * h, r.w * w, r.h * h);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.round(h * 0.16)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ABC"[i], (r.x + r.w / 2) * w, (r.y + r.h / 2) * h);
    });
    return c;
  }

  function inspectTemplates(box) {
    box.appendChild(el("h3", "igfv-ed-h", { text: "Templates" }));
    const p = proj();
    // previews in the project's shape
    const ph = 96;
    const pw = Math.max(40, Math.round((ph * p.w) / p.h));
    // Split screen / reaction.
    const sp = section(box, "Split screen / reaction", true);
    const main = selectedClip();
    note(
      sp,
      isVisualMedia(main)
        ? `A = \u201c${clipLabel(main)}\u201d. B (and C) = the videos / photos over it on other tracks, or the media you picked in the media pool.`
        : "Select the reel (a video or photo clip) first: it becomes A. B (and C) are the videos / photos over it on other tracks, or the one you pick in the media pool."
    );
    slider(sp, { label: "Gap", min: 0, max: 0.04, step: 0.002, def: 0, format: (v) => `${Math.round(v * 1000) / 10} %`, get: () => S.layoutGap || 0, set: (v) => (S.layoutGap = v) });
    slider(sp, { label: "Small box", min: 0.2, max: 0.45, step: 0.01, def: 0.32, format: (v) => `${Math.round(v * 100)} %`, get: () => S.pipSize || 0.32, set: (v) => (S.pipSize = v) });
    const swapRow = el("label", "igfv-ed-row");
    const swapCb = el("input", "", { type: "checkbox", checked: Boolean(S.layoutSwap) });
    swapCb.addEventListener("change", () => (S.layoutSwap = swapCb.checked));
    swapRow.append(swapCb, el("span", "igfv-ed-label", { text: "Swap A and B" }));
    sp.appendChild(swapRow);
    const lg = el("div", "igfv-ed-trgrid");
    for (const lay of TP.LAYOUTS) {
      const tile = button("", "igfv-ed-trtile", () => applyLayout(lay.id), lay.label);
      tile.append(layoutPreview(lay, pw, ph), el("small", "", { text: lay.label }));
      lg.appendChild(tile);
    }
    sp.appendChild(lg);
    // Banners, news, quotes.
    for (const group of TP.GROUPS) {
      const sec = section(box, group, true);
      const grid = el("div", "igfv-ed-trgrid");
      for (const tpl of TP.TEMPLATES.filter((t) => t.group === group)) {
        const tile = button("", "igfv-ed-trtile", () => insertTemplate(tpl.id), tpl.label);
        tile.append(templatePreview(tpl, pw, ph), el("small", "", { text: tpl.label }));
        grid.appendChild(tile);
      }
      sec.appendChild(grid);
      if (group === "News") note(sec, "With a video or photo selected, Breaking news and News article put it in their picture area.");
    }
    // Text styles.
    const ts = section(box, "Text styles", true);
    note(ts, "Click one: the selected text takes it, or a new text is added in it.");
    styleGrid(ts);
  }

  // Adds a template at the playhead (or over the selected photo / video for those with a picture
  // area): its pieces stacked on new tracks, grouped and selected; the first text in the panel.
  function insertTemplate(tplId) {
    const tpl = TP.template(tplId);
    if (!tpl) return;
    const sel = selectedClip();
    const photo = tpl.photo && isVisualMedia(sel) ? sel : null;
    const ids = [];
    let firstText = null;
    change((p) => {
      const gid = p.nextId++;
      const timing = photo ? { start: photo.start, dur: photo.dur } : newClipTiming(p);
      for (const spec of tpl.layers()) {
        if (spec.slot) {
          if (!photo) continue;
          // the picture goes above what's under it in the template, on a track of its own
          const c = M.clipOf(p, photo.id);
          c.track = M.addTrack(p, "video").id;
          M.fitInRegion(p, c, tpl.photo);
          continue;
        }
        const { type, noslot, ...props } = spec;
        if (noslot && photo) continue;
        const clip = L.make(p, type, props);
        Object.assign(clip, timing, { group: gid });
        if (clip.bgStyle === "brush" && !clip.bgSeed) clip.bgSeed = 1 + (clip.id % 997);
        L.remeasure(clip, p.w, p.h);
        placeOnTop(p, clip);
        ids.push(clip.id);
        if (type === "text" && firstText == null) firstText = clip.id;
      }
    }, null, { inspector: true });
    if (!ids.length) return;
    S.clipSel.clear();
    if (ids.length > 1) ids.forEach((i) => S.clipSel.add(i));
    S.transPick = null;
    S.selected = firstText ?? ids[0];
    setTool("select");
    afterChange(true);
    toast(`${tpl.label} added: click a text to change its words \u00b7 drag a piece to move them all`);
  }

  // Split screen: the selected visual clip (A) and the others over it (B, C) fill the layout's
  // regions. Missing ones: the media picked in the pool is added over A.
  function applyLayout(layoutId) {
    const lay = TP.layout(layoutId);
    const main = selectedClip();
    if (!lay) return;
    if (!isVisualMedia(main)) return toast("Select the reel (a video or photo clip) first");
    const p0 = proj();
    const overlaps = (c) => c.start < main.start + main.dur - 1e-6 && main.start < c.start + c.dur - 1e-6;
    const others = p0.clips
      .filter((c) => c.id !== main.id && isVisualMedia(c) && c.track !== main.track && overlaps(c))
      .sort((a, b) => Math.abs(a.start - main.start) - Math.abs(b.start - main.start));
    const need = lay.needs - 1;
    const pick = S.poolPick != null && p0.media[S.poolPick] && M.VISUAL_MEDIA.has(p0.media[S.poolPick].kind) ? S.poolPick : null;
    const missing = Math.max(0, need - others.length);
    if (missing && pick == null) return toast(need > 1 ? "Pick your other videos in the media pool, or put them on tracks over this clip" : "Pick your reaction video in the media pool, or put it on a track over this clip");
    change((p) => {
      const list = [M.clipOf(p, main.id), ...others.slice(0, need).map((c) => M.clipOf(p, c.id))];
      for (let i = 0; i < missing; i++) {
        const c = M.mediaClip(p, pick, { start: main.start });
        if (c.type !== "video") c.dur = main.dur;
        M.placeClip(p, c, { newTrack: true });
        list.push(c);
      }
      if (S.layoutSwap && list.length > 1) [list[0], list[1]] = [list[1], list[0]];
      const regions = lay.regions(p, S.layoutGap || 0, S.pipSize || 0.32);
      list.forEach((c, i) => {
        M.fitInRegion(p, c, regions[i]);
        c.split = true; // drag / wheel adjust the picture inside its box
        if (lay.pip) c.frame = i === 0 ? { ...c.frame, radius: 0, border: 0 } : { ...c.frame, radius: 0.08, border: 0.006, borderColor: "#ffffff" };
      });
      // The small box must be above the big one.
      if (lay.pip) {
        const order = new Map(p.tracks.map((t, i) => [t.id, i]));
        if (order.get(list[1].track) < order.get(list[0].track)) list[1].track = M.addTrack(p, "video").id;
      }
    }, null, { inspector: true });
    toast(`${lay.label}${missing ? " (with the media you picked)" : ""} \u00b7 mute one of them if both have sound`);
  }

  // ---- stickers: animated (built in), emoji GIFs (Noto), emoji, your GIFs ----------------------------------------
  // A GIF from the pool as a sticker: small, on top, at the playhead.
  function addGifSticker(mediaId) {
    let id = null;
    change((p) => {
      const timing = newClipTiming(p);
      const clip = M.mediaClip(p, mediaId, { start: timing.start, dur: timing.dur });
      clip.scale = 0.35;
      placeOnTop(p, clip);
      id = clip.id;
    });
    select(id);
    S.timeline.autoFit = true;
    afterChange(true);
    return id;
  }

  async function addNotoSticker(cp, name) {
    const src = S.opts.sources;
    if (!src || !src.stickerGif) return toast("Not available here");
    const existing = M.mediaBySource(proj(), { code: `noto:${cp}` });
    if (existing != null) return addGifSticker(existing);
    showStatus("Adding the sticker\u2026");
    try {
      const blob = await src.stickerGif(cp);
      if (!S) return;
      const id = await importBlob(blob, `${name}.gif`, { source: { code: `noto:${cp}` } });
      if (id != null) addGifSticker(id);
    } catch (err) {
      if (S) toast(`Couldn't load the sticker \u2014 ${(err && err.message) || "offline?"}`);
    } finally {
      if (S) showStatus("");
    }
  }

  async function addGifFiles(files) {
    for (const file of files) {
      try {
        showStatus(`Adding ${file.name}\u2026`);
        const id = await importBlob(file, file.name, {});
        if (id == null) continue;
        if (proj().media[id].kind === "gif") addGifSticker(id);
        else addMediaClip(id);
      } catch (err) {
        toast(`Couldn't add ${file.name}: ${(err && err.message) || "unsupported"}`);
      }
    }
    if (S) showStatus("");
  }

  function inspectStickers(box) {
    box.appendChild(el("h3", "igfv-ed-h", { text: "Stickers" }));
    const tabs = [
      { id: "animated", label: "Animated" },
      { id: "noto", label: "Emoji GIFs" },
      { id: "emoji", label: "Emoji" },
      { id: "gif", label: "Your GIF" },
    ];
    S.stickerTab = S.stickerTab || "animated";
    chips(box, tabs, S.stickerTab, (id) => {
      S.stickerTab = id;
      renderInspector();
    });
    if (S.stickerTab === "animated") return inspectAnimatedStickers(box);
    if (S.stickerTab === "noto") return inspectNotoStickers(box);
    if (S.stickerTab === "gif") return inspectGifUpload(box);
    inspectEmoji(box);
  }

  function inspectAnimatedStickers(box) {
    const St = IgfvEditor.Stickers;
    note(box, "Click a sticker to add it at the playhead. They're animated and work offline.");
    const search = el("input", "igfv-ed-search", { type: "search", placeholder: "Search stickers (rofl, cat, party, burn\u2026)", value: S.astickerQuery || "" });
    box.appendChild(search);
    const list = el("div", "");
    box.appendChild(list);
    let canvases = [];
    const draw = () => {
      list.textContent = "";
      canvases = [];
      const q = (S.astickerQuery || "").trim().toLowerCase();
      const match = (d) => !q || `${d.label} ${d.id} ${d.group} ${d.text || ""}`.toLowerCase().includes(q);
      for (const group of St.GROUPS) {
        const designs = St.DESIGNS.filter((d) => d.group === group && match(d));
        if (!designs.length) continue;
        list.appendChild(el("div", "igfv-ed-stgroup", { text: group }));
        const grid = el("div", "igfv-ed-astickers");
        for (const d of designs) {
          const tile = button("", "igfv-ed-asticker", () => addOverlay("asticker", { design: d.id }), d.label);
          const c = el("canvas", "");
          c.width = 96;
          c.height = 64;
          c.dataset.design = d.id;
          canvases.push(c);
          tile.append(c, el("small", "", { text: d.label }));
          grid.appendChild(tile);
        }
        list.appendChild(grid);
      }
      if (!canvases.length) note(list, "No matches.");
      startPreviews();
    };
    // One animation loop for the tiles on show (a new search starts a new one; the old one stops
    // once its canvases are gone).
    const startPreviews = () =>
      animatePreviews(canvases, (c, t) => {
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        const d = St.design(c.dataset.design);
        const h = Math.min(c.height * 0.8, (c.width * 0.86) / d.aspect);
        ctx.save();
        ctx.translate(c.width / 2, c.height / 2);
        St.draw(ctx, { design: d.id }, h * d.aspect, h, t);
        ctx.restore();
      });
    search.addEventListener("input", () => {
      S.astickerQuery = search.value;
      draw();
    });
    draw();
  }

  // Quick reaction sets over the animated emoji (names from notoemoji.js; missing ones are skipped).
  const NOTO_REACTIONS = [
    ["Laughing", "rofl joy laughing grin-sweat joy-cat holding-back-tears grinning grin happy-cry wink upside-down-face"],
    ["Cats", "joy-cat smiley-cat smile-cat heart-eyes-cat smirk-cat kissing-cat scream-cat crying-cat-face pouting-cat"],
    ["Celebration", "partying-face party-popper confetti-ball fireworks sparkles balloon birthday-cake trophy clap fire clapper"],
    ["Sass", "rolling-eyes unamused clown middle-finger thumbs-down rage angry cursing skull poop vomit weary"],
    ["Love", "heart-eyes heart-face kissing-heart red-heart beating-heart sparkling-heart revolving-hearts two-hearts fire-heart heart-hands love-you-gesture rose"],
    ["Sad", "loudly-crying cry sad pensive pleading worried frown broken-heart crying-cat-face"],
    ["Shock", "mind-blown screaming scream-cat astonished surprised gasp flushed"],
  ];

  function inspectNotoStickers(box) {
    const N = IgfvEditor.NotoEmoji;
    if (!N) return note(box, "Not available.");
    note(box, "Animated emoji: click one to add it at the playhead (it's downloaded once, then kept with your project).");
    const search = el("input", "igfv-ed-search", { type: "search", placeholder: "Search animated emoji (rofl, cat, party\u2026)", value: S.notoQuery || "" });
    box.appendChild(search);
    const all = N.categories.flatMap(([cat, list]) => list.split(" ").map((x) => [cat, ...x.split(":")]));
    const byName = new Map();
    for (const it of all) if (!byName.has(it[2])) byName.set(it[2], it);
    const reactions = NOTO_REACTIONS.map(([name, names]) => [name, names.split(" ").map((n) => byName.get(n)).filter(Boolean)]);
    S.notoCat = S.notoCat || "r:Laughing";
    box.appendChild(el("div", "igfv-ed-stgroup", { text: "Reactions" }));
    chips(box, reactions.map(([name]) => ({ id: `r:${name}`, label: name })), S.notoCat, (id) => {
      S.notoCat = id;
      S.notoQuery = "";
      renderInspector();
    });
    box.appendChild(el("div", "igfv-ed-stgroup", { text: "All emoji" }));
    chips(box, N.categories.map(([id]) => ({ id, label: id.split(" ")[0] })), S.notoCat, (id) => {
      S.notoCat = id;
      S.notoQuery = "";
      renderInspector();
    });
    const grid = el("div", "igfv-ed-emoji");
    box.appendChild(grid);
    const drawGrid = () => {
      grid.textContent = "";
      const q = (S.notoQuery || "").trim().toLowerCase().replace(/\s+/g, "-");
      let items;
      if (q) {
        // A reaction set's name finds its emoji too ("cats", "celebration").
        const set = reactions.find(([name]) => name.toLowerCase().startsWith(q));
        items = [...(set ? set[1] : []), ...all.filter(([, cp, name]) => name.includes(q) || cp === q)];
        items = items.filter((it, i) => items.findIndex((x) => x[1] === it[1]) === i);
      } else if (S.notoCat.startsWith("r:")) {
        items = (reactions.find(([name]) => `r:${name}` === S.notoCat) || [null, []])[1];
      } else {
        items = all.filter(([cat]) => cat === S.notoCat);
      }
      for (const [, cp, name] of items.slice(0, 400)) {
        grid.appendChild(button(N.glyph(cp), "igfv-ed-emoji-btn", () => addNotoSticker(cp, name), name.replace(/-/g, " ")));
      }
      if (!items.length) note(grid, "No matches.");
    };
    search.addEventListener("input", () => {
      S.notoQuery = search.value;
      drawGrid();
    });
    drawGrid();
    box.appendChild(el("p", "igfv-ed-note igfv-ed-credit", { text: N.credit }));
  }

  function inspectGifUpload(box) {
    note(box, "Add an animated GIF from your computer as a sticker (it loops; resize and move it on the canvas).");
    const input = el("input", "", { type: "file", multiple: true, accept: "image/gif" });
    input.hidden = true;
    input.addEventListener("change", () => addGifFiles([...input.files]));
    box.append(input, button("Choose GIF\u2026", "igfv-ed-primary igfv-ed-wide", () => input.click()));
    const gifs = Object.entries(proj().media).filter(([, m]) => m.kind === "gif");
    if (gifs.length) {
      const sec = section(box, "In this project", true);
      for (const [mid, m] of gifs) sec.appendChild(button(`\u002b ${m.name}`, "igfv-ed-wide", () => addGifSticker(Number(mid)), "Add again at the playhead"));
    }
  }

  function inspectEmoji(box) {
    note(box, "Click a sticker to add it at the playhead.");
    chips(box, M.STICKER_ANIMS.map((a) => ({ id: a.id, label: a.id === "none" ? "Still" : a.label })), S.stickerAnim || "none", (id) => {
      S.stickerAnim = id;
      renderInspector();
    });
    const props = (text) => ({ text, anim: S.stickerAnim || "none" });
    const search = el("input", "igfv-ed-search", { type: "search", placeholder: "Search or type any emoji…", value: S.emojiQuery });
    search.addEventListener("input", () => {
      S.emojiQuery = search.value;
      drawGrid();
    });
    search.igfvKey = (e) => {
      if (e.key === "Enter" && search.value.trim()) addOverlay("sticker", props([...search.value.trim()].slice(0, 4).join("")));
    };
    box.appendChild(search);
    chips(box, Object.keys(EMOJI).map((id) => ({ id, label: id })), S.emojiCat, (id) => {
      S.emojiCat = id;
      S.emojiQuery = "";
      renderInspector();
    });
    const grid = el("div", "igfv-ed-emoji");
    box.appendChild(grid);
    const drawGrid = () => {
      grid.textContent = "";
      const q = S.emojiQuery.trim();
      const list = q ? Object.values(EMOJI).join(" ").split(" ").filter((e) => e.includes(q)) : EMOJI[S.emojiCat].split(" ");
      for (const em of list) grid.appendChild(button(em, "igfv-ed-emoji-btn", () => addOverlay("sticker", props(em))));
      if (q && !list.length) note(grid, "Press Enter to add what you typed.");
    };
    drawGrid();
  }

  function inspectDraw(box) {
    const b = S.brush;
    box.appendChild(el("h3", "igfv-ed-h", { text: "Draw" }));
    note(box, "Draw on the canvas. Each drawing is a clip on a track, shown from the playhead.");
    chips(box, [{ id: "pen", label: "Brush" }, { id: "highlight", label: "Highlighter" }, { id: "erase", label: "Eraser" }], b.mode, (id) => {
      b.mode = id;
      renderInspector();
    });
    slider(box, { label: "Size", min: 0.002, max: 0.1, step: 0.001, def: 0.012, get: () => b.size, set: (v) => (b.size = v), format: (v) => `${Math.round(v * 1000) / 10}` });
    slider(box, { label: "Hardness", min: 0, max: 1, step: 0.05, def: 1, get: () => b.hardness, set: (v) => (b.hardness = v) });
    slider(box, { label: "Opacity", min: 0.05, max: 1, step: 0.05, def: 1, get: () => b.opacity, set: (v) => (b.opacity = v) });
    colorInput(box, "Colour", () => b.color, (v) => (b.color = v));
    const sw = el("div", "igfv-ed-swatches");
    for (const c of ["#ffffff", "#000000", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#af52de", "#ff2d55"]) {
      const s = button("", "igfv-ed-swatch", () => {
        b.color = c;
        renderInspector();
      });
      s.style.background = c;
      sw.appendChild(s);
    }
    box.appendChild(sw);
    box.appendChild(button("+ New drawing", "igfv-ed-wide", () => addOverlay("draw", { cx: 0.5, cy: 0.5, w: 1, h: 1 })));
  }

  function inspectShapes(box) {
    const sh = S.shape;
    box.appendChild(el("h3", "igfv-ed-h", { text: "Shapes" }));
    note(box, "Drag on the canvas to draw a shape. Shift: square / circle, or 15° steps for lines.");
    chips(box, [{ id: "rect", label: "▭ Rectangle" }, { id: "ellipse", label: "◯ Ellipse" }, { id: "line", label: "— Line" }, { id: "arrow", label: "→ Arrow" }, { id: "brush", label: "\u3030 Brush" }], sh.shape, (id) => {
      sh.shape = id;
      renderInspector();
    });
    const clip = selectedClip();
    if (clip && clip.type === "shape") inspectShapeProps(box, clip);
    else {
      const fillRow = el("label", "igfv-ed-row");
      const fillOn = el("input", "", { type: "checkbox", checked: Boolean(sh.fill) });
      fillOn.addEventListener("change", () => {
        sh.fill = fillOn.checked ? "#ffffff" : "";
        renderInspector();
      });
      fillRow.append(fillOn, el("span", "igfv-ed-label", { text: "Fill" }));
      box.appendChild(fillRow);
      if (sh.fill) colorInput(box, "Fill colour", () => sh.fill, (v) => (sh.fill = v));
      colorInput(box, "Stroke colour", () => sh.stroke, (v) => (sh.stroke = v));
      slider(box, { label: "Stroke width", min: 0, max: 0.05, step: 0.001, def: 0.008, get: () => sh.strokeWidth, set: (v) => (sh.strokeWidth = v), format: (v) => `${Math.round(v * 1000) / 10}` });
    }
  }

  function inspectShapeProps(box, clip) {
    const id = clip.id;
    const sec = section(box, "Shape");
    const set = (key) => (v) => {
      S.shape[key] = v;
      setClip(id, (c) => (c[key] = v), `sh-${key}-${id}`);
    };
    const fillRow = el("label", "igfv-ed-row");
    const fillOn = el("input", "", { type: "checkbox", checked: Boolean(clip.fill) });
    fillOn.addEventListener("change", () => {
      set("fill")(fillOn.checked ? "#ffffff" : "");
      renderInspector();
    });
    fillRow.append(fillOn, el("span", "igfv-ed-label", { text: "Fill" }));
    sec.appendChild(fillRow);
    if (clip.fill) colorInput(sec, "Fill colour", () => clip.fill, set("fill"));
    colorInput(sec, "Stroke colour", () => clip.stroke, set("stroke"));
    slider(sec, { label: "Stroke width", min: 0, max: 0.05, step: 0.001, def: 0.008, get: () => clip.strokeWidth, set: (v) => set("strokeWidth")(v), format: (v) => `${Math.round(v * 1000) / 10}` });
    if (clip.shape === "rect") slider(sec, { label: "Corners", min: 0, max: 0.2, step: 0.002, def: 0, get: () => clip.radius || 0, set: (v) => set("radius")(v), format: (v) => `${Math.round(v * 1000) / 10}` });
    if (clip.fill) {
      const gRow = el("label", "igfv-ed-row");
      const gOn = el("input", "", { type: "checkbox", checked: Boolean(clip.fill2) });
      gOn.addEventListener("change", () => {
        set("fill2")(gOn.checked ? "#000000" : "");
        renderInspector();
      });
      gRow.append(gOn, el("span", "igfv-ed-label", { text: "Gradient" }));
      sec.appendChild(gRow);
      if (clip.fill2) {
        colorInput(sec, "Second colour", () => clip.fill2, set("fill2"));
        slider(sec, { label: "Direction", min: 0, max: 359, step: 1, def: 90, format: (v) => `${Math.round(v)}\u00b0`, get: () => clip.gradAngle ?? 90, set: (v) => set("gradAngle")(v) });
      }
    }
    if (clip.shape === "brush") sec.appendChild(button("New brush stroke", "igfv-ed-wide igfv-ed-quiet", () => setClip(id, (c) => (c.seed = 1 + Math.floor(Math.random() * 9999)), null, true)));
  }

  function inspectRetouch(box) {
    const r = S.retouch;
    box.appendChild(el("h3", "igfv-ed-h", { text: "Retouch" }));
    chips(box, [{ id: "blur", label: "Blur" }, { id: "pixelate", label: "Pixelate" }, { id: "heal", label: "Spot heal" }, { id: "clone", label: "Clone" }], r.mode, (id) => {
      r.mode = id;
      renderInspector();
    });
    if (r.mode === "blur" || r.mode === "pixelate") {
      note(box, "Drag over the area to hide (faces, number plates…).");
      chips(box, [{ id: "rect", label: "Rectangle" }, { id: "ellipse", label: "Ellipse" }], r.shape, (id) => {
        r.shape = id;
        renderInspector();
      });
      slider(box, { label: "Strength", min: 5, max: 100, def: 50, get: () => r.strength, set: (v) => (r.strength = v) });
    } else {
      note(box, r.mode === "clone" ? "Alt+click where to copy from, then paint where it should go." : "Click or paint over a spot: it's filled from the area around it. Best on photos (on video it copies the frame at the playhead's place).");
      slider(box, { label: "Brush size", min: 0.01, max: 0.25, step: 0.005, def: 0.05, get: () => r.size, set: (v) => (r.size = v), format: (v) => `${Math.round(v * 100)}` });
      if (r.mode === "clone" && r.cloneFrom) box.appendChild(button("Pick a new source", "igfv-ed-wide", () => (r.cloneFrom = null)));
    }
  }

  // ---- bottom: transport and timeline ---------------------------------------------------------------------
  function buildTimeline() {
    const b = S.bottom;
    b.textContent = "";
    const bar = el("div", "igfv-ed-transport");
    S.playBtn = button("▶", "igfv-ed-icon", togglePlay, "Play / pause (Space)");
    S.timeLabel = el("span", "igfv-ed-time");
    const split = button("✂ Split", "", splitAtPlayhead, "Split at the playhead (Ctrl+B)");
    const del = button("Delete", "", deleteSelected, "Delete the selected clip (Del)");
    const dup = button("Duplicate", "", duplicateSelected, "Duplicate the selected clip (Ctrl+D)");
    const merge = button("⧉ Merge", "", mergeSelected, "Join the selected clip with the piece touching it, e.g. after a split (Ctrl+J)");
    const insert = button("\u2935 Insert", "", insertPicked, "Insert the media picked in the pool at the playhead, pushing later clips on the track to the right");
    S.bladeBtn = button("\u{1f52a} Blade", "", () => setBlade(!S.blade), "Blade: click a clip on the timeline to cut it there (C; Esc or V: back)");
    const join = button("\u{1f517} Join", "", joinSelected, "Join a video with its detached audio: they move, trim and cut together");
    const unjoin = button("Unjoin", "", unjoinSelected, "Unjoin a video and its audio: they move, trim and cut separately");
    const addV = button("+ Video track", "", () => change((p) => M.addTrack(p, "video")));
    const addA = button("+ Audio track", "", () => change((p) => M.addTrack(p, "audio")));
    S.snapBtn = button("Snap", "igfv-on", () => {
      S.snap = !S.snap;
      S.snapBtn.classList.toggle("igfv-on", S.snap);
    }, "Snap clips to edges and the playhead");
    S.pushBtn = button("\u21e5 Push", S.push ? "igfv-on" : "",() => setPush(!S.push), "Push: moving clips pushes the clips in their way along their track (hold Alt while dragging to flip it)");
    const zo = button("−", "igfv-ed-icon", () => S.timeline.zoomBy(1 / 1.4), "Zoom the timeline out (Ctrl+wheel; Ctrl+Shift+wheel: track height)");
    const zf = button("Fit", "", () => {
      S.timeline.autoFit = true;
      S.timeline.draw();
    }, "Fit the project in the timeline");
    const zi = button("+", "igfv-ed-icon", () => S.timeline.zoomBy(1.4), "Zoom the timeline in (Ctrl+wheel; Ctrl+Shift+wheel: track height)");
    // The preview's sound (not the export's): a click mutes it, the slider sets how loud.
    S.soundBtn = button("\u{1f50a}", "igfv-ed-icon", togglePreviewMute, "Sound on / off while editing (M); exports keep their sound");
    S.soundSlider = el("input", "igfv-ed-vol", { type: "range", min: 0, max: 100, value: String(Math.round((S.previewVol ?? 1) * 100)), title: "Preview volume" });
    S.soundSlider.addEventListener("input", () => setPreviewVol(Number(S.soundSlider.value) / 100, false));
    S.soundSlider.addEventListener("change", () => saveUiPrefs());
    const muteAll = button("\u{1f507} All", "", muteAllTracks, "Mute / unmute all tracks (Shift+M)");
    const kfPrev = button("\u25c2\u25c6", "igfv-ed-icon", () => jumpKey(-1), "Previous keyframe (Shift+K)");
    const kfBtn = button("\u25c6", "igfv-ed-icon igfv-ed-kfbtn", toggleKeyAtPlayhead, "Keyframe at the playhead: add / remove (K). Keyframes animate position, size, rotation and opacity");
    const kfNext = button("\u25c6\u25b8", "igfv-ed-icon", () => jumpKey(1), "Next keyframe (Alt+K)");
    bar.append(S.playBtn, S.soundBtn, S.soundSlider, S.timeLabel, el("span", "igfv-ed-sep"), kfPrev, kfBtn, kfNext, el("span", "igfv-ed-sep"), split, S.bladeBtn, merge, insert, del, dup, el("span", "igfv-ed-sep"), join, unjoin, el("span", "igfv-ed-sep"), muteAll, addV, addA, el("span", "igfv-ed-flex"), S.pushBtn, S.snapBtn, zo, zf, zi);
    const host = el("div", "igfv-ed-timeline");
    host.addEventListener("contextmenu", timelineMenu);
    host.addEventListener("pointerdown", () => (S.focus = "timeline"), true);
    S.timelineHost = host;
    b.append(bar, host);
    S.timeline = new T.Timeline(host, {
      project: proj,
      time: now,
      selected: () => S.selected,
      select: (id, keep = false) => select(id, keep),
      clipSelected: (id) => S.clipSel.has(id),
      toggleClip: (id) => toggleClip(id),
      shiftClips: (dt, level = 0, { alt = false } = {}) => moveSelectedClips(dt, level, "clips-drag", { push: S.push !== alt }),
      showTransition: (clipId) => showTransition(clipId),
      transPicked: () => S.transPick,
      kfPicked: () => S.kfPick,
      pickKey: (clipId, i) => pickKey(clipId, i),
      moveKey: (clipId, i, t) => {
        let at = i;
        change((q) => {
          const c = M.clipOf(q, clipId);
          if (c && c.kf) at = M.moveKey(c, i, t);
        }, `kfmove-${clipId}`);
        if (S.kfPick && S.kfPick.clip === clipId) S.kfPick.index = at;
        return at;
      },
      addKeyAt: (clipId, t) => {
        const c = M.clipOf(proj(), clipId);
        if (!keyable(c)) return;
        change((q) => M.addKey(M.clipOf(q, clipId), t), null, { inspector: true });
        pickKey(clipId, M.clipOf(proj(), clipId).kf.findIndex((k) => Math.abs(k.t - M.clamp(t, 0, c.dur)) < 1e-6));
        toast("Keyframe added: move the playhead elsewhere and change the clip to animate it");
      },
      seek: (t) => {
        if (M.isStill(proj())) return;
        S.engine.seek(t);
      },
      move: (id, start, track, { alt = false } = {}) => {
        const p = proj();
        const clip = M.clipOf(p, id);
        const tr = M.trackOf(p, track);
        if (!clip || !tr || tr.locked || tr.kind !== M.trackKindFor(clip.type)) return false;
        // Push: along its own track it pushes the clips in its way.
        if (S.push !== alt && track === clip.track) {
          const res = moveSelectedClips(Math.max(0, start) - clip.start, 0, `tmove-${id}`, { push: true, ids: [id] });
          return Boolean(res.applied) || Math.abs(Math.max(0, start) - clip.start) < 1e-6;
        }
        if (!M.fits(p, track, Math.max(0, start), clip.dur, id)) return false;
        // A joined clip moves with its partner: both must fit.
        if (M.partner(p, clip) && !M.moveLinked(M.clone(p), id, start, track)) return false;
        change((q) => M.moveLinked(q, id, start, track), `tmove-${id}`);
        return true;
      },
      trim: (id, edge, t) => change((q) => M.trimLinked(q, id, edge, t), `ttrim-${id}`),
      trackSelected: (id) => S.trackSel.has(id),
      selectTrack: (id, mode = "only") => selectTrack(id, mode),
      shiftTracks: (dt) => shiftSelectedTracks(dt, "tracks-drag"),
      blade: () => S.blade,
      cut: (clipId, t) => bladeCut(clipId, t),
      setTrackHeight: (id, h) =>
        change((q) => {
          const tr = M.trackOf(q, id);
          if (!tr) return;
          if (h == null) delete tr.h;
          else tr.h = Math.round(h);
        }, `trackh-${id}`),
      toggleTrack: (id, key) => change((p) => {
        const tr = M.trackOf(p, id);
        tr[key] = !tr[key];
      }),
      removeTrack: (id) => {
        const p = proj();
        if (p.clips.some((c) => c.track === id)) return toast("Only empty tracks can be removed");
        const tr = M.trackOf(p, id);
        if (M.tracksOf(p, tr.kind).length < 2) return toast(`Keep at least one ${tr.kind} track`);
        change((q) => M.removeTrack(q, id));
      },
      endDrag: () => {
        S.history.endMerge();
        afterChange(true);
      },
      snapOn: () => S.snap,
      wheelZooms: () => Boolean(S.settings && S.settings.mouse.timelineWheel === "zoom"),
      thumbs: (mediaId) => (S.media.get(mediaId) || {}).thumbs,
      label: clipLabel,
      removeEffect: (clipId, fxId) => {
        const clip = M.clipOf(proj(), clipId);
        const e = clip && (clip.effects || []).find((x) => x.id === fxId);
        if (!e) return;
        change((p) => {
          const c = M.clipOf(p, clipId);
          c.effects = c.effects.filter((x) => x.id !== fxId);
        });
        toast(`Removed ${M.effectDef(e.type).label} (Ctrl+Z brings it back)`);
      },
      showEffects: (clipId) => showEffectsOf(clipId),
      trackHeight: (h) => {
        S.trackH = h;
        clearTimeout(S.trackSaveTimer);
        S.trackSaveTimer = setTimeout(() => S && saveUiPrefs(), 400);
      },
    });
    if (S.trackH) S.timeline.setTrackH(S.trackH);
    // Ctrl + wheel anywhere on the panel (the canvas handles its own, at the pointer).
    if (!b.igfvWheel) {
      b.igfvWheel = true;
      b.addEventListener("wheel", (e) => {
        if (e.defaultPrevented || !S.timeline || (!e.ctrlKey && !e.metaKey && !e.altKey)) return;
        S.timeline.wheel(e);
      }, { passive: false });
    }
    updateTransport();
  }

  function togglePlay() {
    if (!S.engine) return;
    if (M.isStill(proj())) return toast("Add a video or audio clip to play the project");
    closePreview(); // the timeline plays on the stage
    if (S.engine.playing) S.engine.pause();
    else S.engine.play().catch(() => toast("Couldn't play"));
    setTimeout(updateTransport, 0);
  }

  function updateTransport() {
    if (!S || !S.timeLabel || !S.history) return;
    const p = proj();
    const still = M.isStill(p);
    S.timeLabel.textContent = still ? "Photo project" : `${E.timecode(now())} / ${E.timecode(M.duration(p))}`;
    S.playBtn.textContent = S.engine && S.engine.playing ? "❚❚" : "▶";
    S.playBtn.disabled = still;
    if (S.timeline) S.timeline.draw();
  }

  // ---- right-click menus ----------------------------------------------------------------------------------
  // items: [{ label, hint, run, disabled, danger, sub: [items] } | { sep: true }], at the pointer.
  function contextMenu(e, items) {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    // No separators at the ends or twice in a row.
    const list = [];
    for (const it of items.filter(Boolean)) if (!it.sep || (list.length && !list[list.length - 1].sep)) list.push(it);
    while (list.length && list[list.length - 1].sep) list.pop();
    if (!list.length) return;
    const root = S.root.getBoundingClientRect();
    const open = (entries, x, y, parent = null) => {
      const menu = el("div", "igfv-ed-menu");
      menu.addEventListener("contextmenu", (ev) => ev.preventDefault());
      menu.addEventListener("pointerdown", (ev) => ev.stopPropagation());
      menu.addEventListener("wheel", (ev) => ev.stopPropagation());
      for (const it of entries) {
        if (!it) continue;
        if (it.sep) {
          menu.appendChild(el("div", "igfv-ed-menu-sep"));
          continue;
        }
        const row = el("button", `igfv-ed-menu-item${it.danger ? " igfv-ed-menu-danger" : ""}${it.sub ? " igfv-ed-menu-parent" : ""}`, { type: "button" });
        row.disabled = Boolean(it.disabled);
        row.append(el("span", "", { text: it.label }), el("small", "", { text: it.sub ? "›" : it.hint || "" }));
        const showSub = () => {
          for (const m of S.menu.subs.splice(S.menu.subs.indexOf(menu) + 1)) m.remove();
          if (!it.sub || it.disabled) return;
          const r = row.getBoundingClientRect();
          S.menu.subs.push(open(it.sub, r.right - root.left - 2, r.top - root.top - 4, menu));
        };
        row.addEventListener("pointerenter", showSub);
        row.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (it.disabled) return;
          if (it.sub) return showSub();
          closeMenu();
          it.run();
        });
        menu.appendChild(row);
      }
      S.root.appendChild(menu);
      // Kept inside the editor; a submenu that would overflow opens to the left of its parent.
      const w = menu.offsetWidth || 200;
      const h = menu.offsetHeight || 0;
      let left = x;
      if (left + w > root.width - 4) left = parent ? parent.offsetLeft - w + 2 : root.width - w - 4;
      menu.style.left = `${Math.max(4, left)}px`;
      menu.style.top = `${Math.max(4, Math.min(y, root.height - h - 4))}px`;
      return menu;
    };
    S.menu = { subs: [] };
    S.menu.subs.push(open(list, e.clientX - root.left, e.clientY - root.top));
    const away = (ev) => {
      if (ev.target instanceof Element && ev.target.closest(".igfv-ed-menu")) return;
      closeMenu();
    };
    S.menu.away = away;
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("wheel", away, true);
    window.addEventListener("resize", away);
    window.addEventListener("blur", away);
  }

  function closeMenu() {
    if (!S || !S.menu) return;
    for (const m of S.menu.subs) m.remove();
    window.removeEventListener("pointerdown", S.menu.away, true);
    window.removeEventListener("wheel", S.menu.away, true);
    window.removeEventListener("resize", S.menu.away);
    window.removeEventListener("blur", S.menu.away);
    S.menu = null;
  }

  // "Move to bin ▸" / "Add to media pool ▸": Master, each named bin, a new bin.
  function binItems(run) {
    const p = proj();
    return [
      { label: "▤ Master", run: () => run(null) },
      ...(p.bins || []).map((b) => ({ label: `\u{1f4c1} ${b.name}`, run: () => run(b.id) })),
      { sep: true },
      {
        label: "New bin…",
        run: () => {
          let bin = null;
          change((q) => (bin = M.addBin(q, `Bin ${(q.bins || []).length + 1}`)));
          S.currentBin = bin.id;
          renderPool();
          run(bin.id); // rename it with a double-click on its chip
        },
      },
    ];
  }

  // The video track above / below a clip's (dir +1 / -1), or null.
  function trackNextTo(clip, dir) {
    const p = proj();
    const list = M.tracksOf(p, M.trackKindFor(clip.type)); // bottom first
    const i = list.findIndex((t) => t.id === clip.track);
    return list[i + dir] || null;
  }

  // Moves a clip to the track above / below (the layer order on the canvas); above the top track:
  // onto a new track.
  function moveClipTrack(clip, dir) {
    const target = trackNextTo(clip, dir);
    if (target && (target.locked || !M.fits(proj(), target.id, clip.start, clip.dur, clip.id))) return toast(`The track ${dir > 0 ? "above" : "below"} isn't free there`);
    if (!target && dir < 0) return toast("It's already on the bottom track");
    change((q) => {
      const tr = target || M.addTrack(q, M.trackKindFor(clip.type));
      M.moveClip(q, clip.id, clip.start, tr.id);
    });
  }

  function timelineMenu(e) {
    // On a keyframe's diamond: its own menu.
    {
      const [kx, ky] = S.timeline.local(e);
      const kh = S.timeline.hits.find((h) => h.key === "kf" && kx >= h.x && kx <= h.x + h.w && ky >= h.y && ky <= h.y + h.h);
      const kc = kh && M.clipOf(proj(), kh.clip);
      if (kc && kc.kf && kc.kf[kh.index]) {
        pickKey(kc.id, kh.index);
        const cur = kc.kf[kh.index].ease;
        return contextMenu(e, [
          {
            label: "Ease to the next",
            sub: [...M.KF_EASES.map((x) => ({ label: x.label + (cur === x.id ? "  \u2713" : ""), run: () => setKeyEase(kc.id, kh.index, x.id) })), { label: "Custom curve\u2026" + (typeof cur === "object" ? "  \u2713" : ""), run: () => setKeyEase(kc.id, kh.index, typeof cur === "object" ? cur : { bezier: [0.25, 0.1, 0.25, 1] }) }],
          },
          { label: "Go to this keyframe", run: () => S.engine.seek(kc.start + kc.kf[kh.index].t) },
          { sep: true },
          { label: "Delete keyframe", hint: "Del", danger: true, run: deletePickedKey },
          { label: "Delete all keyframes", danger: true, run: () => clearKeys(kc.id) },
        ]);
      }
    }
    // On a transition's bow-tie: its own menu.
    const [lx, ly] = S.timeline.local(e);
    const th = S.timeline.hits.find((h) => h.key === "trans" && lx >= h.x && lx <= h.x + h.w && ly >= h.y && ly <= h.y + h.h);
    const tclip = th && M.clipOf(proj(), th.clip);
    if (tclip && tclip.transIn) {
      showTransition(tclip.id);
      return contextMenu(e, [
        { label: "Transition settings\u2026", run: () => showTransition(tclip.id) },
        {
          label: "Change to",
          sub: M.TRANSITION_GROUPS.map((g) => ({
            label: g,
            sub: M.TRANSITIONS.filter((x) => x.group === g).map((x) => ({ label: x.label + (x.id === tclip.transIn.type ? "  \u2713" : ""), run: () => setTransitionType(tclip.id, x.id) })),
          })),
        },
        { sep: true },
        { label: "Remove transition", hint: "Del", danger: true, run: () => removeTransition(tclip.id) },
      ]);
    }
    const at = S.timeline.contextAt(e.clientX, e.clientY);
    if (!at) return;
    const items = [];
    const clip = at.clip && M.clipOf(proj(), at.clip.id);
    if (clip) {
      if (S.selected !== clip.id) select(clip.id, true);
      const many = S.clipSel.has(clip.id) ? S.clipSel.size : 0;
      const selIds = selectedIds();
      const mixed = new Set(selIds.map((id) => M.trackKindFor(M.clipOf(proj(), id).type))).size > 1;
      const av = clip.type === "video" || clip.type === "audio";
      const visual = M.trackKindFor(clip.type) === "video";
      const inside = at.time > clip.start + 0.05 && at.time < clip.start + clip.dur - 0.05;
      items.push(...splitBoxItems(clip));
      items.push(
        {
          label: "✂ Split here",
          hint: "Ctrl+B",
          disabled: !inside,
          run: async () => {
            await S.engine.seek(at.time);
            if (!S) return;
            select(clip.id);
            splitAtPlayhead();
          },
        },
        { label: "⧉ Merge with the piece next to it", hint: "Ctrl+J", run: mergeSelected },
        { label: "Duplicate", hint: "Ctrl+D", run: duplicateSelected },
        { sep: true },
        M.VISUAL_MEDIA.has(clip.type) || clip.type === "adjust" ? { label: "Effects…", run: () => setTool("effects") } : null,
        canTransition(clip) ? { label: clip.transIn ? "Transition settings…" : "Transition…", run: () => (clip.transIn ? showTransition(clip.id) : setTool("transitions")) } : null,
        M.kfProps(clip.type).length ? { label: "Animate from the playhead", sub: animateMenu() } : null,
        M.kfProps(clip.type).length ? { label: "\u25c6 Keyframe at the playhead", hint: hk("keyframe"), run: toggleKeyAtPlayhead } : null,
        clip.kf && clip.kf.length ? { label: "Clear all keyframes", run: () => clearKeys(clip.id) } : null,
        clip.transIn ? { label: "Remove transition", run: () => removeTransition(clip.id) } : null,
        av ? { label: clip.muted ? "Unmute" : "Mute", run: () => setClip(clip.id, (c) => (c.muted = !c.muted), null, true) } : null,
        av
          ? {
              label: "Speed",
              sub: M.SPEEDS.map((s) => ({
                label: `${s}×${(clip.speed || 1) === s ? "  ✓" : ""}`,
                run: () =>
                  setClip(clip.id, (c, q) => {
                    // A joined partner gets the same speed (and length).
                    for (const x of [c, M.partner(q, c)].filter(Boolean)) {
                      const srcLen = x.dur * (x.speed || 1);
                      x.speed = s;
                      x.dur = Math.max(0.1, Math.min(srcLen / s, M.maxDur(q, x)));
                    }
                  }, null, true),
              })),
            }
          : null,
        { label: "Move to the track above", hint: many ? `${many} clips` : "", run: () => relevelSelected(1) },
        { label: "Move to the track below", hint: many ? `${many} clips` : "", run: () => relevelSelected(-1) },
        { label: "Move to the top track", disabled: mixed, run: () => relevelSelected("top") },
        { label: "Move to the bottom track", disabled: mixed, run: () => relevelSelected("bottom") },
        {
          label: "Move to track",
          disabled: mixed,
          sub: (visual ? [...M.tracksOf(proj(), "video")].reverse() : M.tracksOf(proj(), "audio")).map((t) => ({
            label: t.name + (t.locked ? "  \u{1f512}" : ""),
            disabled: t.locked || selIds.every((id) => M.clipOf(proj(), id).track === t.id),
            run: () => relevelSelected({ track: t.id }),
          })),
        },
        { sep: true },
        clip.type === "video" && !clip.audioOut ? { label: "Detach audio", disabled: (proj().media[clip.media] || {}).hasAudio === false, run: () => detachAudio(clip.id) } : null,
        M.partner(proj(), clip) ? { label: "Unjoin audio / video", run: unjoinSelected } : null,
        av && !M.partner(proj(), clip) && joinCandidate(clip) ? { label: "\u{1f517} Join with its " + (clip.type === "video" ? "audio" : "video"), run: joinSelected } : null,
        (clip.type === "video" && clip.audioOut) || (clip.type === "audio" && M.partner(proj(), clip)) ? { label: "Put the sound back in the video", run: () => reattachAudio(clip.id) } : null,
        clip.media != null ? { label: "Properties\u2026", run: () => openProperties(clip.media, clip.id) } : null,
        M.VISUAL_MEDIA.has(clip.type) ? { label: "Split screen", sub: TP.LAYOUTS.map((l) => ({ label: l.label, run: () => applyLayout(l.id) })) } : null,
        clip.group != null ? { label: "Ungroup", run: () => ungroup(clip.id) } : null,
        { sep: true },
        { label: "Move to timeline start", hint: many ? `${many} clips` : "", run: () => sendClips("start") },
        { label: "Move to timeline end", hint: many ? `${many} clips` : "", run: () => sendClips("end") },
        { label: "Adjust to timeline end", hint: many ? `${many} clips` : "", run: () => sendClips("align-end") },
        { sep: true },
        { label: "Cut", hint: hk("cut"), run: cutClips },
        { label: "Copy", hint: hk("copy"), run: () => copyClips() },
        { label: "Paste at the playhead", hint: hk("paste"), disabled: !S.clipboard, run: pasteClips },
        { label: many ? `Delete ${many} clips` : "Delete", hint: "Del", danger: true, run: deleteSelected }
      );
    } else if (at.track && !at.header) {
      const pick = S.poolPick != null && proj().media[S.poolPick] ? S.poolPick : null;
      const fitsKind = pick != null && M.trackKindFor(proj().media[pick].kind) === at.track.kind;
      const name = pick != null ? `“${proj().media[pick].name}”` : "the picked media";
      items.push(
        { label: `Add ${name} here`, disabled: !fitsKind || at.track.locked, run: () => addMediaClip(pick, { time: at.time, track: at.track.id }) },
        { label: `⤵ Insert ${name} here`, disabled: !fitsKind || at.track.locked, run: () => insertMediaAt(pick, { time: at.time, track: at.track.id }) },
        { label: "Move the playhead here", run: () => S.engine.seek(at.time) }
      );
    }
    if (at.track) {
      const tr = at.track;
      const api = S.timeline.api;
      if (items.length) items.push({ sep: true });
      // On a header or an empty part of a row: the track becomes the selection (if it isn't in it),
      // and the whole selected tracks can move to the timeline start / end.
      if (!clip) {
        if (!S.trackSel.has(tr.id)) selectTrack(tr.id, "only");
        const n = S.trackSel.size;
        const hint = n > 1 ? `${n} tracks` : "";
        items.push(
          { label: "Move track to timeline start", hint, run: () => sendTracks("start") },
          { label: "Move track to timeline end", hint, run: () => sendTracks("end") },
          { label: "Adjust track to timeline end", hint, run: () => sendTracks("align-end") },
          { label: "Select all tracks", run: () => (proj().tracks.forEach((t) => S.trackSel.add(t.id)), S.timeline.draw()) },
          { label: "Clear track selection", disabled: !n, run: () => selectTrack(null) },
          { sep: true }
        );
      }
      items.push(
        tr.kind === "video" ? { label: tr.hidden ? "Show track" : "Hide track", run: () => api.toggleTrack(tr.id, "hidden") } : null,
        { label: tr.muted ? "Unmute track" : "Mute track", run: () => api.toggleTrack(tr.id, "muted") },
        { label: tr.locked ? "Unlock track" : "Lock track", run: () => api.toggleTrack(tr.id, "locked") },
        { label: "Remove track", danger: true, disabled: proj().clips.some((c) => c.track === tr.id), run: () => api.removeTrack(tr.id) }
      );
    }
    if (!clip) {
      const anyOn = proj().tracks.some((t) => !t.muted);
      items.push(
        { sep: true },
        { label: "Paste at the playhead", hint: hk("paste"), disabled: !S.clipboard, run: pasteClips },
        { label: "Select all clips", hint: hk("selectAll"), run: selectAllClips },
        { label: anyOn ? "Mute all tracks" : "Unmute all tracks", hint: hk("muteAll"), run: muteAllTracks },
        { sep: true },
        { label: "+ Video track", run: () => change((p) => M.addTrack(p, "video")) },
        { label: "+ Audio track", run: () => change((p) => M.addTrack(p, "audio")) },
        { label: "Fit the project in the timeline", run: () => ((S.timeline.autoFit = true), S.timeline.draw()) }
      );
    }
    contextMenu(e, items);
  }

  function canvasMenu(e) {
    if (!S || !S.history || S.drag) return;
    if (S.preview && S.preview.panel.contains(e.target)) return; // the video's own menu
    const [fx, fy] = toFrac(e);
    const hit = cropTarget() ? null : topHitAt(fx, fy);
    const still = M.isStill(proj());
    const play = { label: S.engine && S.engine.playing ? "Pause" : "Play", hint: "Space", disabled: still, run: togglePlay };
    if (!hit) {
      return contextMenu(e, [
        { label: "Add text", run: () => setTool("text") },
        { label: "Stickers…", run: () => setTool("stickers") },
        { label: "Effects…", run: () => setTool("effects") },
        { label: "Project: canvas and background\u2026", run: openProjectSettings },
        { sep: true },
        { label: "Zoom to fit", hint: "0", run: () => setZoom("fit") },
        play,
      ]);
    }
    if (S.selected !== hit.id) select(hit.id);
    const id = hit.id;
    const media = M.VISUAL_MEDIA.has(hit.type);
    contextMenu(e, [
      ...splitBoxItems(hit),
      { label: "Duplicate", hint: "Ctrl+D", run: duplicateSelected },
      { sep: true },
      media ? { label: "Fit", run: () => setClip(id, (c) => Object.assign(c, { scale: 1, cx: 0.5, cy: 0.5 }), null, true) } : null,
      media ? { label: "Fill the canvas", run: () => setClip(id, (c, q) => Object.assign(c, { scale: M.fillScale(q, c), cx: 0.5, cy: 0.5 }), null, true) } : null,
      { label: "Centre", run: () => setClip(id, (c) => Object.assign(c, { cx: 0.5, cy: 0.5 }), null, true) },
      { label: "Reset rotation", disabled: !hit.rotation, run: () => setClip(id, (c) => (c.rotation = 0), null, true) },
      { sep: true },
      hit.group != null ? { label: "Ungroup", run: () => ungroup(hit.id) } : null,
      M.VISUAL_MEDIA.has(hit.type) ? { label: "Split screen", sub: TP.LAYOUTS.map((l) => ({ label: l.label, run: () => applyLayout(l.id) })) } : null,
      { label: "Bring forward", run: () => moveClipTrack(hit, 1) },
      { label: "Send backward", disabled: !trackNextTo(hit, -1), run: () => moveClipTrack(hit, -1) },
      { sep: true },
      media ? { label: "Crop…", run: () => setTool("crop") } : null,
      media ? { label: "Effects\u2026", run: () => setTool("effects") } : null,
      media ? { label: "Properties\u2026", run: () => openProperties(hit.media, hit.id) } : null,
      hit.type === "text" ? { label: "Edit text…", run: () => setTool("select") } : null,
      play,
      { sep: true },
      { label: "Delete", hint: "Del", danger: true, run: deleteSelected },
    ]);
  }

  // ---- modals: confirm, export ----------------------------------------------------------------------------
  function modal(build) {
    closeModal();
    const back = el("div", "igfv-ed-modal");
    const card = el("div", "igfv-ed-card");
    back.appendChild(card);
    back.addEventListener("click", (e) => {
      if (e.target === back && !S.exporting) closeModal();
    });
    build(card);
    S.root.appendChild(back);
    S.modal = back;
    return card;
  }

  function closeModal() {
    if (!S || !S.modal) return;
    if (S.exporting) S.exporting.cancelled = true;
    S.modal.remove();
    S.modal = null;
  }

  function confirmModal(title, text, okLabel, onOk, onKeep = null) {
    modal((card) => {
      card.append(el("h3", "", { text: title }), el("p", "igfv-ed-note", { text }));
      const row = el("div", "igfv-ed-buttons");
      const keep = () => {
        closeModal();
        if (onKeep) onKeep();
      };
      row.append(button("Keep editing", "", keep), button(okLabel, "igfv-ed-danger", () => {
        closeModal();
        onOk();
      }));
      card.appendChild(row);
    });
  }

  function baseName() {
    return displayName(S.opts.name);
  }

  function openExport() {
    if (!S || !S.history) return;
    if (S.engine) S.engine.pause();
    const p = proj();
    const still = M.isStill(p);
    const io = (S.settings && S.settings.io) || {};
    const st = { kind: still ? "image" : "video", format: io.photoFormat && io.photoFormat !== "auto" ? io.photoFormat : p.bg.alpha < 1 ? "png" : "jpeg", quality: io.quality || 92, size: 0, gifFps: io.gifFps || 12, gifWidth: 480, frameFormat: "png" };
    modal((card) => {
      card.appendChild(el("h3", "", { text: "Export" }));
      const body = el("div", "igfv-ed-export");
      card.appendChild(body);
      const draw = () => {
        body.textContent = "";
        if (!still) {
          chips(body, [{ id: "video", label: "Video" }, { id: "frame", label: "This frame" }, { id: "gif", label: "GIF" }], st.kind, (id) => {
            st.kind = id;
            draw();
          });
        }
        const longSide = Math.max(p.w, p.h);
        if (st.kind === "image" || st.kind === "frame") {
          const formats = st.kind === "image" ? [{ id: "png", label: "PNG" }, { id: "jpeg", label: "JPEG" }, { id: "webp", label: "WebP" }] : [{ id: "png", label: "PNG" }, { id: "jpeg", label: "JPEG" }];
          const key = st.kind === "image" ? "format" : "frameFormat";
          chips(body, formats, st[key], (id) => {
            st[key] = id;
            draw();
          });
          if (st[key] !== "png") slider(body, { label: "Quality", min: 60, max: 100, def: 92, get: () => st.quality, set: (v) => (st.quality = v) });
          if (p.bg.alpha < 1) note(body, st[key] === "jpeg" ? "JPEG has no transparency: the background is drawn opaque." : "The transparent background is kept.");
          const sizes = [{ id: 0, label: `Original (${p.w}×${p.h})` }, ...[2048, 1080].filter((s) => s < longSide).map((s) => ({ id: s, label: `${s}px` }))];
          chips(body, sizes, st.size, (id) => {
            st.size = id;
            draw();
          });
        } else if (st.kind === "video") {
          const sizes = [{ id: 0, label: `Original (${p.w}×${p.h})` }, ...[1920, 1280].filter((s) => s < longSide).map((s) => ({ id: s, label: s === 1920 ? "1080p" : "720p" }))];
          chips(body, sizes, st.size, (id) => {
            st.size = id;
            draw();
          });
          note(body, `Recorded in real time (${E.formatTime(M.duration(p))}) with the mixed sound, as MP4 or WebM depending on your browser.${p.bg.alpha < 1 ? " Videos have no transparency: the background is drawn opaque." : ""}`);
        } else if (st.kind === "gif") {
          const total = M.duration(p);
          slider(body, { label: "Frames / s", min: 6, max: 20, def: 12, get: () => st.gifFps, set: (v) => (st.gifFps = v) });
          slider(body, { label: "Width", min: 240, max: 640, step: 20, def: 480, get: () => st.gifWidth, set: (v) => (st.gifWidth = v), format: (v) => `${v}px` });
          note(body, `${total > 20 ? `The first 20 s of ${E.formatTime(total)}.` : `All ${E.formatTime(total)}.`} No sound; an opaque background.`);
        }
        const row = el("div", "igfv-ed-buttons");
        const progress = el("progress", "igfv-ed-progress", { max: 1, value: 0 });
        progress.hidden = true;
        const go = button("Export", "igfv-ed-primary", () => runExport(st, progress, go));
        const cancel = button("Cancel", "", () => {
          if (S.exporting) S.exporting.cancelled = true;
          else closeModal();
        });
        row.append(cancel, go);
        body.append(progress, row);
      };
      draw();
    });
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), type, quality));
  }

  async function runExport(st, progress, go) {
    if (S.exporting) return;
    const job = { cancelled: false };
    S.exporting = job;
    go.disabled = true;
    progress.hidden = false;
    progress.value = 0;
    const p = M.clone(proj());
    const at = now();
    try {
      let blob = null;
      let ext = "";
      if (st.kind === "image" || st.kind === "frame") {
        const fmt = st.kind === "image" ? st.format : st.frameFormat;
        const out = document.createElement("canvas");
        S.renderer.compose(p, at, out, { scale: M.scaleForMax(p, st.size), opaque: fmt === "jpeg", getSource: sourceOf });
        blob = await canvasBlob(out, `image/${fmt}`, st.quality / 100);
        ext = fmt === "jpeg" ? "jpg" : fmt;
      } else if (st.kind === "video") {
        const scale = M.scaleForMax(p, st.size);
        const size = M.outputSize(p, scale, true);
        let seed = 0;
        blob = await S.engine.exportVideo({
          width: size.width,
          height: size.height,
          compose: (canvas, t) => S.renderer.compose(p, t, canvas, { scale, even: true, opaque: true, getSource: sourceOf, seed: ++seed }),
          onProgress: (v) => (progress.value = v),
          isCancelled: () => job.cancelled,
        });
        ext = blob && /mp4/.test(blob.type) ? "mp4" : "webm";
      } else if (st.kind === "gif") {
        const to = Math.min(M.duration(p), 20);
        const scale = Math.min(1, st.gifWidth / p.w);
        const size = M.outputSize(p, scale);
        blob = await S.engine.exportGif({
          from: 0,
          to,
          fps: st.gifFps,
          width: size.width,
          height: size.height,
          compose: (canvas, t) => S.renderer.compose(p, t, canvas, { scale, opaque: true, getSource: sourceOf }),
          onProgress: (v) => (progress.value = v),
          isCancelled: () => job.cancelled,
        });
        ext = "gif";
        if (blob && blob.size > 25 * 1024 * 1024) toast("Large GIF: lower the width or frame rate for a smaller file");
      }
      if (!S) return;
      if (!blob) {
        toast("Export cancelled");
        return;
      }
      const suffix = st.kind === "frame" ? "_frame" : "_edited";
      await S.opts.save(blob, `${baseName()}${suffix}.${ext}`);
      S.clean = true;
      toast("Exported");
      S.exporting = null;
      closeModal();
    } catch (err) {
      console.debug("[igfv] editor export failed", err);
      if (S) toast(`Couldn't export — ${(err && err.message) || "error"}`);
    } finally {
      if (S) {
        S.exporting = null;
        go.disabled = false;
        if (S.engine && st.kind !== "image") S.engine.seek(at).catch(() => {});
      }
    }
  }
})();
