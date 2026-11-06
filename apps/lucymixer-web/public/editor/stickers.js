// The editor's built-in animated stickers, drawn frame by frame (so they play and export exactly,
// offline), in groups: Social (Like, Subscribe, Follow...), Laugh (ROFL, laughing cat, HAHA...),
// Sass (Burn, Bruh, Facepalm, Mic drop...), Celebrate (Congrats, fireworks, balloons, birthday
// cake...), Love, Reactions and Shapes. Also the animations any emoji / text sticker can have
// (bounce, spin, pulse...).
var IgfvEditor;
IgfvEditor = IgfvEditor || {};

IgfvEditor.Stickers = (() => {
  // aspect: width / height of the sticker's box.
  // group: the heading the picker shows it under (GROUPS order).
  const GROUPS = ["Social", "Cute", "Cats & trolls", "Laugh", "Sass", "Celebrate", "Love", "Reactions", "Fun", "Shapes"];
  const DESIGNS = [
    { id: "like", label: "Like", aspect: 2.1, color: "#1877f2", text: "LIKE", group: "Social" },
    { id: "subscribe", label: "Subscribe", aspect: 3, color: "#ff0000", text: "SUBSCRIBE", group: "Social" },
    { id: "follow", label: "Follow", aspect: 2.6, color: "", text: "FOLLOW", group: "Social" },
    { id: "new", label: "New", aspect: 1, color: "#ffd60a", text: "NEW", group: "Social" },
    { id: "sale", label: "Sale", aspect: 1.5, color: "#ff3b30", text: "SALE", group: "Social" },
    { id: "live", label: "Live", aspect: 2.2, color: "#ff1744", text: "LIVE", group: "Social" },
    { id: "thanks", label: "Thank you", aspect: 2.8, color: "#ff6fa8", text: "THANK YOU", group: "Social" },
    { id: "rofl", label: "ROFL", aspect: 1.3, color: "#4fc3ff", group: "Laugh" },
    { id: "lol", label: "LOL", aspect: 1.3, color: "#4cd964", text: "LOL", group: "Laugh" },
    { id: "haha", label: "HAHA", aspect: 2.4, color: "#ffd60a", text: "HAHA", group: "Laugh" },
    { id: "laughcat", label: "Laughing cat", aspect: 1, color: "#f5a442", group: "Laugh" },
    { id: "cryinglaugh", label: "\u{1f602} \u{1f602} \u{1f602}", aspect: 2.6, color: "", group: "Laugh" },
    { id: "dead", label: "I'm dead", aspect: 1.1, color: "#ffffff", text: "I'M DEAD", group: "Laugh" },
    { id: "burn", label: "Burn", aspect: 1.4, color: "#ff5a00", text: "BURN", group: "Sass" },
    { id: "bruh", label: "Bruh", aspect: 1.8, color: "#ffffff", text: "BRUH", group: "Sass" },
    { id: "facepalm", label: "Facepalm", aspect: 1.2, color: "#ffffff", text: "FACEPALM", group: "Sass" },
    { id: "micdrop", label: "Mic drop", aspect: 1, color: "#ffffff", text: "MIC DROP", group: "Sass" },
    { id: "boo", label: "Boo", aspect: 1.3, color: "#ff4d4d", text: "BOO", group: "Sass" },
    { id: "cringe", label: "Cringe", aspect: 1.3, color: "#9bff6b", text: "CRINGE", group: "Sass" },
    { id: "whatever", label: "Whatever", aspect: 1.5, color: "#c9b6ff", text: "WHATEVER", group: "Sass" },
    { id: "loser", label: "Loser", aspect: 1, color: "#39d353", text: "LOSER", group: "Sass" },
    { id: "ohsnap", label: "Oh snap!", aspect: 1.8, color: "#ffea00", text: "OH SNAP!", group: "Sass" },
    { id: "sus", label: "Sus", aspect: 1.4, color: "#ff3b30", text: "SUS", group: "Sass" },
    { id: "congrats", label: "Congrats", aspect: 2.4, color: "#ffc300", text: "CONGRATS!", group: "Celebrate" },
    { id: "fireworks", label: "Fireworks", aspect: 1, color: "", group: "Celebrate" },
    { id: "balloons", label: "Balloons", aspect: 0.9, color: "", group: "Celebrate" },
    { id: "partypop", label: "Party popper", aspect: 1, color: "", group: "Celebrate" },
    { id: "trophy", label: "Trophy", aspect: 1, color: "#ffd24a", group: "Celebrate" },
    { id: "birthday", label: "Happy birthday", aspect: 1.2, color: "#ff7ab6", text: "HAPPY BIRTHDAY", group: "Celebrate" },
    { id: "clapping", label: "Clapping", aspect: 1, color: "#ffe066", group: "Celebrate" },
    { id: "cheers", label: "Cheers", aspect: 1.2, color: "#ffe9a8", text: "CHEERS!", group: "Celebrate" },
    { id: "confetti", label: "Confetti pop", aspect: 1, color: "", group: "Celebrate" },
    { id: "sparkle", label: "Sparkles", aspect: 1, color: "#ffe066", group: "Celebrate" },
    { id: "hearts", label: "Hearts", aspect: 1, color: "#ff3b6b", group: "Love" },
    { id: "heartpop", label: "Heart pop", aspect: 1, color: "#ff2d55", group: "Love" },
    { id: "loveyou", label: "Love you", aspect: 2.4, color: "#ff2d55", text: "LOVE YOU", group: "Love" },
    { id: "hearteyes", label: "Heart eyes", aspect: 1, color: "#ff2d55", group: "Love" },
    { id: "wow", label: "WOW!", aspect: 1.3, color: "#ffcc00", text: "WOW!", group: "Reactions" },
    { id: "omg", label: "OMG", aspect: 1.3, color: "#ff5ac8", text: "OMG", group: "Reactions" },
    { id: "kittycute", label: "Kitty", aspect: 1, color: "#ffffff", group: "Cute" },
    { id: "bear", label: "Teddy bear", aspect: 1, color: "#c68a5a", group: "Cute" },
    { id: "bunny", label: "Bunny", aspect: 0.85, color: "#ffffff", group: "Cute" },
    { id: "puppy", label: "Puppy", aspect: 1, color: "#e7c39b", group: "Cute" },
    { id: "panda", label: "Panda", aspect: 1, color: "#ffffff", group: "Cute" },
    { id: "chick", label: "Chick", aspect: 1, color: "#ffd84a", group: "Cute" },
    { id: "ghost", label: "Ghost", aspect: 0.9, color: "#ffffff", group: "Cute" },
    { id: "cloudy", label: "Happy cloud", aspect: 1.4, color: "#ffffff", group: "Cute" },
    { id: "starface", label: "Happy star", aspect: 1, color: "#ffd24a", group: "Cute" },
    { id: "heartface", label: "Happy heart", aspect: 1, color: "#ff6f91", group: "Cute" },
    { id: "sunny", label: "Sunshine", aspect: 1, color: "#ffc93c", group: "Cute" },
    { id: "rainbow", label: "Rainbow", aspect: 1.6, color: "", group: "Cute" },
    { id: "trollcat", label: "Troll cat", aspect: 1, color: "#b9b9c3", text: "PROBLEM?", group: "Cats & trolls" },
    { id: "nopecat", label: "Nope cat", aspect: 1, color: "#f3a65a", text: "NOPE", group: "Cats & trolls" },
    { id: "peekcat", label: "Peeking cat", aspect: 1.2, color: "#8c8c96", group: "Cats & trolls" },
    { id: "vibecat", label: "Vibing cat", aspect: 1, color: "#2f2f36", group: "Cats & trolls" },
    { id: "rainbowcat", label: "Rainbow cat", aspect: 2, color: "#9a9aa6", group: "Cats & trolls" },
    { id: "slapcat", label: "Slap cat", aspect: 1.3, color: "#f3a65a", text: "SLAP!", group: "Cats & trolls" },
    { id: "smugcat", label: "Smug cat", aspect: 1, color: "#ffffff", text: "SMUG", group: "Cats & trolls" },
    { id: "screamcat", label: "Screaming cat", aspect: 1, color: "#d8d8de", text: "AAAAA", group: "Cats & trolls" },
    { id: "mindblown", label: "Mind blown", aspect: 1, color: "#ffb000", group: "Fun" },
    { id: "thinking", label: "Thinking", aspect: 1.3, color: "#ffffff", group: "Fun" },
    { id: "sleepy", label: "Sleepy", aspect: 1, color: "#9ad0ff", group: "Fun" },
    { id: "music", label: "Music", aspect: 1, color: "#c77dff", group: "Fun" },
    { id: "coffee", label: "Coffee", aspect: 0.9, color: "#ffffff", group: "Fun" },
    { id: "peace", label: "Peace", aspect: 1, color: "#9bff6b", group: "Fun" },
    { id: "thumbsup", label: "Thumbs up", aspect: 1, color: "#ffd166", group: "Fun" },
    { id: "fire", label: "Fire", aspect: 0.8, color: "#ff7a00", group: "Shapes" },
    { id: "arrow", label: "Arrow", aspect: 0.7, color: "#ffffff", group: "Shapes" },
    { id: "star", label: "Star", aspect: 1, color: "#ffc300", group: "Shapes" },
    { id: "loading", label: "Loading", aspect: 1, color: "#ffffff", group: "Shapes" },
    { id: "bubble", label: "Typing\u2026", aspect: 1.5, color: "#ffffff", group: "Shapes" },
    { id: "countdown", label: "3-2-1", aspect: 1, color: "#ffffff", group: "Shapes" },
    { id: "swipeup", label: "Swipe up", aspect: 0.9, color: "#ffffff", text: "Swipe up", group: "Shapes" },
  ];
  const BY_ID = new Map(DESIGNS.map((d) => [d.id, d]));
  const TEXT_DESIGNS = new Set(DESIGNS.filter((d) => d.text).map((d) => d.id));
  const FONT = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const TAU = Math.PI * 2;

  function design(id) {
    return BY_ID.get(id) || DESIGNS[0];
  }

  // ---- shapes ---------------------------------------------------------------------------------------
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

  function star(ctx, x, y, r, points, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI) / points - Math.PI / 2;
      const rr = i % 2 ? r * inner : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.2);
    ctx.bezierCurveTo(x, y - s * 0.5, x - s * 0.5, y - s * 0.5, x - s * 0.5, y - s * 0.2);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.1, x, y + s * 0.3, x, y + s * 0.5);
    ctx.bezierCurveTo(x, y + s * 0.3, x + s * 0.5, y + s * 0.1, x + s * 0.5, y - s * 0.2);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.5, x, y - s * 0.5, x, y - s * 0.2);
    ctx.closePath();
  }

  // A comic burst: spikes of varying length.
  function burst(ctx, x, y, rx, ry, spikes) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i * Math.PI) / spikes;
      const k = i % 2 ? 0.72 + 0.08 * Math.sin(i * 2.3) : 1 - 0.08 * Math.cos(i * 1.7);
      ctx.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k);
    }
    ctx.closePath();
  }

  // Bold text fitted into width w (font size at most h).
  function label(ctx, text, x, y, w, h, color, { weight = 800, font = FONT, stroke = "" } = {}) {
    let px = h;
    ctx.font = `${weight} ${px}px ${font}`;
    const tw = ctx.measureText(text).width;
    if (tw > w) {
      px = Math.max(4, (px * w) / tw);
      ctx.font = `${weight} ${px}px ${font}`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = px * 0.14;
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function emoji(ctx, ch, x, y, px) {
    ctx.font = `${px}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, x, y + px * 0.05);
  }

  const wave = (t, hz, phase = 0) => Math.sin(t * TAU * hz + phase);
  const rnd = (i, k) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // ---- cute faces ------------------------------------------------------------------------------------
  const INK = "#2b2b33";

  // Closed for a moment every few seconds.
  const blinking = (t, phase = 0) => (t + phase) % 3.2 < 0.12;

  // Two eyes: "dot" (blinks), "happy" (^ ^), "smug" (half closed), "wide".
  function eyes(ctx, s, t, { y = -0.05, gap = 0.27, r = 0.075, mode = "dot", phase = 0, look = 0 } = {}) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = s * 0.035;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    for (const side of [-1, 1]) {
      const x = side * gap * s;
      const yy = y * s;
      const rr = r * s;
      if (mode === "happy") {
        ctx.beginPath();
        ctx.arc(x, yy + rr * 0.5, rr, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (mode === "smug" || (mode === "dot" && blinking(t, phase))) {
        ctx.beginPath();
        ctx.moveTo(x - rr, yy);
        ctx.quadraticCurveTo(x, yy + (mode === "smug" ? -rr * 0.3 : rr * 0.7), x + rr, yy);
        ctx.stroke();
        if (mode === "smug") {
          ctx.beginPath();
          ctx.arc(x + look * rr * 0.4, yy + rr * 0.15, rr * 0.45, 0, Math.PI);
          ctx.fill();
        }
      } else {
        const big = mode === "wide" ? 1.35 : 1;
        if (mode === "wide") {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x, yy, rr * 1.6, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = INK;
        }
        ctx.beginPath();
        ctx.arc(x + look * rr * 0.5, yy, rr * big * (mode === "wide" ? 0.6 : 1), 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + look * rr * 0.5 - rr * 0.3, yy - rr * 0.35, rr * 0.35, 0, TAU);
        ctx.fill();
        ctx.fillStyle = INK;
      }
    }
    ctx.restore();
  }

  function blush(ctx, s, { y = 0.13, gap = 0.4, alpha = 0.55 } = {}) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ff8fab";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * gap * s, y * s, s * 0.08, s * 0.05, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // "cat" (ω), "smile", "open", "tongue", "grin" (a troll's), "flat", "scream".
  function mouth(ctx, s, kind, t, y = 0.13) {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = s * 0.032;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const Y = y * s;
    switch (kind) {
      case "cat":
        ctx.lineWidth = s * 0.026;
        ctx.beginPath();
        ctx.arc(-s * 0.04, Y, s * 0.04, 0.1, Math.PI - 0.1);
        ctx.moveTo(s * 0.08 * Math.cos(0.1), Y + s * 0.04 * Math.sin(0.1));
        ctx.arc(s * 0.04, Y, s * 0.04, 0.1, Math.PI - 0.1);
        ctx.stroke();
        break;
      case "smile":
        ctx.beginPath();
        ctx.arc(0, Y - s * 0.06, s * 0.11, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        break;
      case "open": {
        const o = 0.6 + 0.4 * Math.abs(wave(t, 2));
        ctx.fillStyle = "#7a2335";
        ctx.beginPath();
        ctx.ellipse(0, Y + s * 0.02, s * 0.07, s * 0.06 * o, 0, 0, TAU);
        ctx.fill();
        break;
      }
      case "tongue": {
        ctx.beginPath();
        ctx.arc(0, Y - s * 0.06, s * 0.11, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        const lick = 0.7 + 0.3 * Math.abs(wave(t, 3));
        ctx.fillStyle = "#ff6f91";
        ctx.beginPath();
        ctx.ellipse(0, Y + s * 0.09 * lick, s * 0.055, s * 0.075 * lick, 0, 0, TAU);
        ctx.fill();
        break;
      }
      case "grin": {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, Y - s * 0.1);
        ctx.quadraticCurveTo(0, Y + s * 0.32, s * 0.4, Y - s * 0.1);
        ctx.quadraticCurveTo(0, Y + s * 0.06, -s * 0.4, Y - s * 0.1);
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = s * 0.015;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(i * s * 0.08, Y + s * 0.0 + Math.abs(i) * -s * 0.02);
          ctx.lineTo(i * s * 0.08, Y + s * 0.17 - Math.abs(i) * s * 0.035);
          ctx.stroke();
        }
        break;
      }
      case "flat":
        ctx.beginPath();
        ctx.moveTo(-s * 0.08, Y);
        ctx.lineTo(s * 0.08, Y);
        ctx.stroke();
        break;
      case "scream": {
        const o = 0.75 + 0.25 * Math.abs(wave(t, 6));
        ctx.fillStyle = "#5a1020";
        ctx.beginPath();
        ctx.ellipse(0, Y + s * 0.06, s * 0.13, s * 0.17 * o, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ff8fab";
        ctx.beginPath();
        ctx.ellipse(0, Y + s * 0.15 * o, s * 0.07, s * 0.05, 0, 0, TAU);
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  // A cat's head (radius about s / 2), centred on (0, 0). ear: a twitch angle.
  function catHead(ctx, s, color, { ear = 0, stripes = false } = {}) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = s * 0.02;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * s * 0.3, -s * 0.28);
      ctx.rotate(side * (0.15 + (side > 0 ? ear : 0)));
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, s * 0.08);
      ctx.lineTo(0, -s * 0.24);
      ctx.lineTo(s * 0.16, s * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffb3c6";
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, s * 0.04);
      ctx.lineTo(0, -s * 0.13);
      ctx.lineTo(s * 0.08, s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (stripes) {
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = s * 0.03;
      for (const dx of [-0.08, 0, 0.08]) {
        ctx.beginPath();
        ctx.moveTo(dx * s, -s * 0.4);
        ctx.lineTo(dx * s, -s * 0.28);
        ctx.stroke();
      }
    }
    // nose and whiskers
    ctx.fillStyle = "#ff8fab";
    ctx.beginPath();
    ctx.moveTo(-s * 0.035, s * 0.05);
    ctx.lineTo(s * 0.035, s * 0.05);
    ctx.lineTo(0, s * 0.09);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(43,43,51,0.6)";
    ctx.lineWidth = s * 0.012;
    for (const side of [-1, 1]) for (const dy of [-0.03, 0.04]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.28, s * (0.1 + dy));
      ctx.lineTo(side * s * 0.6, s * (0.06 + dy * 1.8));
      ctx.stroke();
    }
    ctx.restore();
  }

  function roundHead(ctx, s, color, rx = 0.46, ry = 0.42) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = s * 0.02;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * rx, s * ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // A music note drawn as shapes (the note glyphs are missing from some fonts). double: two notes.
  function note(ctx, x, y, size, color, double = false) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.1;
    const heads = double ? [[-size * 0.28, 0], [size * 0.28, -size * 0.12]] : [[0, 0]];
    for (const [hx, hy] of heads) {
      ctx.beginPath();
      ctx.ellipse(x + hx, y + hy + size * 0.35, size * 0.17, size * 0.12, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + hx + size * 0.14, y + hy + size * 0.33);
      ctx.lineTo(x + hx + size * 0.14, y + hy - size * 0.35);
      ctx.stroke();
    }
    ctx.beginPath();
    if (double) {
      ctx.lineWidth = size * 0.16;
      ctx.moveTo(x - size * 0.14, y - size * 0.35);
      ctx.lineTo(x + size * 0.42, y - size * 0.47);
    } else {
      ctx.moveTo(x + size * 0.14, y - size * 0.35);
      ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.15, x + size * 0.32, y + size * 0.05);
    }
    ctx.stroke();
    ctx.restore();
  }

  function sparklesAround(ctx, s, t, n = 4, color = "#fff6b0") {
    for (let i = 0; i < n; i++) {
      const tw = Math.max(0, wave(t, 0.9, i * 1.9));
      if (tw < 0.05) continue;
      const a = (i / n) * TAU + 0.6;
      ctx.fillStyle = color;
      star(ctx, Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.5, s * 0.07 * tw, 4, 0.25);
      ctx.fill();
    }
  }

  // ---- the designs -----------------------------------------------------------------------------------
  // Draws a design centred on (0, 0) in a box w × h at t seconds into the clip.
  function draw(ctx, layer, w, h, t) {
    const d = design(layer.design);
    const color = layer.color || d.color;
    const text = layer.text || d.text || "";
    ctx.save();
    switch (d.id) {
      case "like": {
        const s = 1 + 0.06 * wave(t, 1.2);
        ctx.scale(s, s);
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
        ctx.fill();
        ctx.save();
        ctx.translate(-w / 2 + h * 0.62, 0);
        ctx.rotate(wave(t, 1.2) * 0.25);
        emoji(ctx, "\u{1f44d}", 0, 0, h * 0.6);
        ctx.restore();
        label(ctx, text, h * 0.35, 0, w - h * 1.4, h * 0.5, "#fff");
        break;
      }
      case "subscribe": {
        const click = (t % 2.4) / 2.4;
        const s = click > 0.8 && click < 0.88 ? 0.92 : 1;
        ctx.scale(s, s);
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.18);
        ctx.fill();
        ctx.save();
        ctx.translate(-w / 2 + h * 0.55, -h * 0.05);
        ctx.rotate(wave(t, 2.5) * 0.35 * Math.max(0, wave(t, 0.4)));
        emoji(ctx, "\u{1f514}", 0, 0, h * 0.55);
        ctx.restore();
        label(ctx, text, h * 0.35, 0, w - h * 1.3, h * 0.42, "#fff");
        break;
      }
      case "follow": {
        const k = (t % 2) / 2;
        const s = k < 0.15 ? 1 + Math.sin((k / 0.15) * Math.PI) * 0.12 : 1;
        ctx.scale(s, s);
        if (color) ctx.fillStyle = color;
        else {
          const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
          g.addColorStop(0, "#f58529");
          g.addColorStop(0.5, "#dd2a7b");
          g.addColorStop(1, "#8134af");
          ctx.fillStyle = g;
        }
        roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
        ctx.fill();
        label(ctx, `+ ${text}`, 0, 0, w * 0.82, h * 0.46, "#fff");
        break;
      }
      case "new": {
        ctx.rotate(t * 0.6);
        ctx.fillStyle = color;
        star(ctx, 0, 0, Math.min(w, h) / 2, 16, 0.78);
        ctx.fill();
        ctx.rotate(-t * 0.6);
        const s = 1 + 0.08 * wave(t, 1.5);
        ctx.scale(s, s);
        label(ctx, text, 0, 0, w * 0.62, h * 0.3, "#1a1a1a");
        break;
      }
      case "sale": {
        ctx.translate(0, -h / 2);
        ctx.rotate(wave(t, 0.8) * 0.18);
        ctx.translate(0, h / 2);
        const tw = w * 0.9;
        const th = h * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-tw / 2 + th * 0.35, -th / 2);
        ctx.lineTo(tw / 2, -th / 2);
        ctx.lineTo(tw / 2, th / 2);
        ctx.lineTo(-tw / 2 + th * 0.35, th / 2);
        ctx.lineTo(-tw / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-tw / 2 + th * 0.32, 0, th * 0.09, 0, TAU);
        ctx.fill();
        label(ctx, text, th * 0.2, 0, tw - th * 0.8, th * 0.55, "#fff");
        break;
      }
      case "live": {
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.2);
        ctx.fill();
        ctx.globalAlpha = 0.35 + 0.65 * (wave(t, 1) > 0 ? 1 : 0.2);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-w / 2 + h * 0.5, 0, h * 0.16, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        label(ctx, text, h * 0.3, 0, w - h * 1.2, h * 0.5, "#fff");
        break;
      }
      case "wow":
      case "omg":
      case "lol": {
        const s = 1 + 0.07 * wave(t, 2.2);
        ctx.rotate(wave(t, 3.1) * 0.06);
        ctx.scale(s, s);
        ctx.fillStyle = color;
        ctx.strokeStyle = "#111";
        ctx.lineWidth = Math.min(w, h) * 0.04;
        ctx.lineJoin = "round";
        burst(ctx, 0, 0, w / 2 - ctx.lineWidth, h / 2 - ctx.lineWidth, 12);
        ctx.fill();
        ctx.stroke();
        label(ctx, text, 0, 0, w * 0.6, h * 0.34, "#fff", { weight: 900, stroke: "#111" });
        break;
      }
      case "thanks": {
        ctx.translate(0, wave(t, 0.6) * h * 0.06);
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
        ctx.fill();
        label(ctx, text, -h * 0.25, 0, w - h * 1.4, h * 0.42, "#fff");
        const beat = (t * 1.6) % 1;
        const s = 1 + 0.25 * Math.exp(-((beat * 10) ** 2)) + 0.18 * Math.exp(-(((beat - 0.25) * 10) ** 2));
        ctx.fillStyle = "#fff";
        heart(ctx, w / 2 - h * 0.55, 0, h * 0.5 * s);
        ctx.fill();
        break;
      }
      case "hearts": {
        for (let i = 0; i < 7; i++) {
          const k = (t * 0.5 + i / 7) % 1;
          const x = (rnd(i, 1) - 0.5) * w * 0.6 + wave(t, 0.8, i) * w * 0.08;
          const y = h / 2 - k * h;
          const s = h * (0.16 + 0.12 * rnd(i, 2)) * (0.6 + 0.4 * Math.min(1, k * 4));
          ctx.globalAlpha = Math.min(1, (1 - k) * 2);
          ctx.fillStyle = i % 2 ? color : "#ff8fb1";
          heart(ctx, x, y, s);
          ctx.fill();
        }
        break;
      }
      case "sparkle": {
        for (let i = 0; i < 7; i++) {
          const tw = Math.max(0, wave(t, 0.9 + rnd(i, 3), i * 1.7));
          if (tw < 0.03) continue;
          const x = (rnd(i, 1) - 0.5) * w * 0.85;
          const y = (rnd(i, 2) - 0.5) * h * 0.85;
          const r = Math.min(w, h) * (0.08 + 0.1 * rnd(i, 4)) * tw;
          ctx.globalAlpha = tw;
          ctx.fillStyle = i % 3 ? color : "#ffffff";
          ctx.shadowColor = "rgba(255,255,255,0.9)";
          ctx.shadowBlur = r;
          star(ctx, x, y, r, 4, 0.22);
          ctx.fill();
        }
        break;
      }
      case "confetti": {
        const period = 1.6;
        const k = (t % period) / period;
        const colors = color ? [color] : ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f15bb5"];
        for (let i = 0; i < 26; i++) {
          const a = rnd(i, 1) * TAU;
          const v = 0.25 + 0.3 * rnd(i, 2);
          const x = Math.cos(a) * v * k * w;
          const y = Math.sin(a) * v * k * h + k * k * h * 0.45;
          const s = Math.min(w, h) * 0.035;
          ctx.globalAlpha = Math.max(0, 1 - k * 1.1);
          ctx.fillStyle = colors[i % colors.length];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(k * 8 * rnd(i, 3) + i);
          ctx.fillRect(-s, -s / 2, s * 2, s);
          ctx.restore();
        }
        break;
      }
      case "fire": {
        const layers = [
          [color, 1],
          ["#ffb000", 0.7],
          ["#fff3a0", 0.42],
        ];
        for (const [i, [c, k]] of layers.entries()) {
          const fw = w * 0.9 * k;
          const fh = h * 0.95 * k;
          const sway = wave(t, 1.7 + i * 0.4, i) * fw * 0.12 + wave(t, 3.3, i * 2) * fw * 0.05;
          const tip = -h / 2 + (h * 0.95 - fh) + wave(t, 4.1, i) * fh * 0.04;
          const base = h / 2 - h * 0.05;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(sway, tip);
          ctx.bezierCurveTo(fw * 0.25 + sway * 0.5, tip + fh * 0.3, fw * 0.55, base - fh * 0.35, fw * 0.4, base - fh * 0.12);
          ctx.bezierCurveTo(fw * 0.3, base, -fw * 0.3, base, -fw * 0.4, base - fh * 0.12);
          ctx.bezierCurveTo(-fw * 0.55, base - fh * 0.35, -fw * 0.25 + sway * 0.5, tip + fh * 0.3, sway, tip);
          ctx.fill();
        }
        break;
      }
      case "arrow": {
        ctx.translate(0, Math.abs(wave(t, 1.1)) * h * 0.15 - h * 0.07);
        const aw = w * 0.9;
        const ah = h * 0.8;
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = Math.min(w, h) * 0.035;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(-aw * 0.18, -ah / 2);
        ctx.lineTo(aw * 0.18, -ah / 2);
        ctx.lineTo(aw * 0.18, 0);
        ctx.lineTo(aw / 2, 0);
        ctx.lineTo(0, ah / 2);
        ctx.lineTo(-aw / 2, 0);
        ctx.lineTo(-aw * 0.18, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;
      }
      case "star": {
        ctx.rotate(t * 1.2);
        const s = 1 + 0.08 * wave(t, 1.4);
        ctx.scale(s, s);
        const r = Math.min(w, h) * 0.46;
        ctx.fillStyle = color;
        ctx.shadowColor = "rgba(255,220,0,0.8)";
        ctx.shadowBlur = r * 0.3;
        star(ctx, 0, 0, r, 5, 0.45);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        star(ctx, -r * 0.12, -r * 0.12, r * 0.35, 5, 0.45);
        ctx.fill();
        break;
      }
      case "loading": {
        const r = Math.min(w, h) * 0.38;
        const n = 12;
        const head = Math.floor(t * 12) % n;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = r * 0.16;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU - Math.PI / 2;
          ctx.globalAlpha = 0.15 + 0.85 * (((i - head + n) % n) / n);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.stroke();
        }
        break;
      }
      case "bubble": {
        const u = Math.min(1, t / 0.35);
        const pop = 1 + (2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2);
        ctx.scale(pop, pop);
        const bw = w * 0.92;
        const bh = h * 0.72;
        ctx.fillStyle = color;
        roundRect(ctx, -bw / 2, -h / 2, bw, bh, bh * 0.45);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-bw * 0.28, -h / 2 + bh - 1);
        ctx.lineTo(-bw * 0.38, h / 2);
        ctx.lineTo(-bw * 0.08, -h / 2 + bh - 1);
        ctx.fill();
        ctx.fillStyle = "#8e8e93";
        for (let i = 0; i < 3; i++) {
          const jump = Math.max(0, Math.sin(t * TAU * 1.2 - i * 0.7)) * bh * 0.12;
          ctx.beginPath();
          ctx.arc((i - 1) * bw * 0.2, -h / 2 + bh / 2 - jump, bh * 0.1, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "countdown": {
        const k = t % 3;
        const n = 3 - Math.floor(k);
        const f = k - Math.floor(k);
        const r = Math.min(w, h) * 0.45;
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - f));
        ctx.stroke();
        const s = 1.35 - 0.35 * Math.min(1, f * 4);
        ctx.globalAlpha = f > 0.85 ? (1 - f) / 0.15 : 1;
        ctx.scale(s, s);
        label(ctx, String(n), 0, 0, r * 1.4, r * 1.1, color, { weight: 900, stroke: "rgba(0,0,0,0.5)" });
        break;
      }
      // ---- laugh ----
      case "rofl": {
        // rolling back and forth, tears flying off both sides
        const roll = wave(t, 0.9);
        const s = Math.min(w, h);
        for (let i = 0; i < 8; i++) {
          const k = (t * 1.4 + i / 8) % 1;
          const side = i % 2 ? 1 : -1;
          const x = side * (s * 0.3 + k * w * 0.25);
          const y = -s * 0.1 - Math.sin(k * Math.PI) * s * 0.25 + k * s * 0.3;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(x, y, s * 0.035, s * 0.055, side * 0.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.translate(roll * w * 0.12, 0);
        ctx.rotate(roll * 1.1);
        emoji(ctx, "\u{1f923}", 0, 0, s * 0.72);
        break;
      }
      case "haha": {
        const letters = [...text];
        const lw = w / Math.max(1, letters.length);
        letters.forEach((ch, i) => {
          const jump = Math.max(0, Math.sin(t * TAU * 1.6 - i * 0.6)) * h * 0.2;
          label(ctx, ch, -w / 2 + lw * (i + 0.5), h * 0.08 - jump, lw * 1.05, h * 0.62, color, { weight: 900, stroke: "#111" });
        });
        break;
      }
      case "laughcat": {
        const s = Math.min(w, h);
        ctx.rotate(wave(t, 2.2) * 0.12);
        ctx.translate(0, Math.abs(wave(t, 2.2)) * -s * 0.04);
        const r = s * 0.36;
        ctx.fillStyle = color;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * r * 0.85, -r * 0.35);
          ctx.lineTo(side * r * 0.75, -r * 1.25);
          ctx.lineTo(side * r * 0.2, -r * 0.8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.88, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#2b1a0e";
        ctx.lineWidth = s * 0.03;
        ctx.lineCap = "round";
        for (const side of [-1, 1]) {
          // closed, laughing eyes: ^ ^
          ctx.beginPath();
          ctx.moveTo(side * r * 0.55, -r * 0.18);
          ctx.lineTo(side * r * 0.36, -r * 0.36);
          ctx.lineTo(side * r * 0.17, -r * 0.18);
          ctx.stroke();
          // whiskers
          ctx.lineWidth = s * 0.012;
          for (const dy of [-0.06, 0.06]) {
            ctx.beginPath();
            ctx.moveTo(side * r * 0.55, r * (0.12 + dy));
            ctx.lineTo(side * r * 1.15, r * (0.04 + dy * 2));
            ctx.stroke();
          }
          ctx.lineWidth = s * 0.03;
        }
        const open = 0.55 + 0.45 * Math.abs(wave(t, 3.3));
        ctx.fillStyle = "#5a1020";
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, r * 0.15);
        ctx.quadraticCurveTo(0, r * (0.15 + 0.75 * open), r * 0.4, r * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff7a9a";
        ctx.beginPath();
        ctx.ellipse(0, r * (0.15 + 0.45 * open), r * 0.16, r * 0.1 * open, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ff8fb1";
        ctx.beginPath();
        ctx.moveTo(-r * 0.07, r * 0.02);
        ctx.lineTo(r * 0.07, r * 0.02);
        ctx.lineTo(0, r * 0.1);
        ctx.fill();
        for (const side of [-1, 1]) {
          const k = (t * 1.3 + (side > 0 ? 0.5 : 0)) % 1;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = "#4fc3ff";
          ctx.beginPath();
          ctx.ellipse(side * (r * 0.6 + k * r * 0.5), -r * 0.15 + k * r * 0.6, s * 0.03, s * 0.045, 0, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "cryinglaugh":
        for (let i = 0; i < 3; i++) {
          const jump = Math.max(0, Math.sin(t * TAU * 1.4 - i * 0.9)) * h * 0.18;
          ctx.save();
          ctx.translate((i - 1) * w * 0.31, h * 0.06 - jump);
          ctx.rotate(wave(t, 1.4, i) * 0.2);
          emoji(ctx, "\u{1f602}", 0, 0, h * 0.62);
          ctx.restore();
        }
        break;
      case "dead": {
        ctx.translate(wave(t, 9) * w * 0.02, 0);
        emoji(ctx, "\u{1f480}", 0, -h * 0.12, h * 0.55);
        label(ctx, text, 0, h * 0.34, w * 0.95, h * 0.22, color, { weight: 900, stroke: "#111" });
        break;
      }
      // ---- sass ----
      case "burn": {
        ctx.save();
        ctx.translate(0, -h * 0.08);
        draw(ctx, { design: "fire", color }, w * 0.62, h * 0.9, t);
        ctx.restore();
        ctx.translate(wave(t, 7) * w * 0.01, 0);
        label(ctx, text, 0, h * 0.3, w * 0.95, h * 0.32, "#fff", { weight: 900, stroke: "#7a1a00" });
        break;
      }
      case "bruh": {
        const s = 1 + 0.05 * Math.min(1, (t % 3) / 0.4);
        ctx.scale(s, s);
        emoji(ctx, "\u{1f610}", -w * 0.3, 0, h * 0.6);
        label(ctx, text, w * 0.14, 0, w * 0.6, h * 0.5, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "facepalm": {
        const k = (t % 1.8) / 1.8;
        const slap = k < 0.12 ? 1 - Math.sin((k / 0.12) * Math.PI) * 0.12 : 1;
        ctx.scale(slap, slap);
        emoji(ctx, "\u{1f926}", 0, -h * 0.12, h * 0.6);
        label(ctx, text, 0, h * 0.36, w * 0.95, h * 0.2, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "micdrop": {
        const k = (t % 2.2) / 2.2;
        const floor = h * 0.18;
        let y;
        if (k < 0.35) y = -h * 0.5 + (k / 0.35) ** 2 * (floor + h * 0.5);
        else y = floor - Math.abs(Math.sin(((k - 0.35) / 0.65) * Math.PI * 3)) * h * 0.12 * (1 - (k - 0.35) / 0.65);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = h * 0.015;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, floor + h * 0.12);
        ctx.lineTo(w * 0.35, floor + h * 0.12);
        ctx.stroke();
        ctx.save();
        ctx.translate(0, y);
        ctx.rotate(k < 0.35 ? k * 3 : 1.05);
        emoji(ctx, "\u{1f3a4}", 0, 0, h * 0.36);
        ctx.restore();
        label(ctx, text, 0, h * 0.42, w * 0.95, h * 0.16, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "boo": {
        ctx.save();
        ctx.translate(-w * 0.24, 0);
        ctx.rotate(wave(t, 1.6) * 0.3);
        emoji(ctx, "\u{1f44e}", 0, 0, h * 0.55);
        ctx.restore();
        const s = 1 + 0.08 * Math.abs(wave(t, 1.6));
        ctx.scale(s, s);
        label(ctx, text, w * 0.2, 0, w * 0.5, h * 0.48, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "cringe": {
        const jx = wave(t, 13) * w * 0.012;
        ctx.translate(jx, 0);
        emoji(ctx, "\u{1f62c}", 0, -h * 0.12, h * 0.55);
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.025;
        ctx.lineCap = "round";
        for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
          const x = side * (h * 0.36 + i * h * 0.05);
          ctx.beginPath();
          ctx.moveTo(x, -h * 0.28 + i * h * 0.03);
          ctx.lineTo(x + side * h * 0.03, -h * 0.06 + i * h * 0.03);
          ctx.stroke();
        }
        label(ctx, text, 0, h * 0.34, w * 0.95, h * 0.22, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "whatever": {
        ctx.save();
        ctx.translate(0, -h * 0.1);
        ctx.rotate(wave(t, 0.6) * 0.15);
        emoji(ctx, "\u{1f644}", 0, 0, h * 0.55);
        ctx.restore();
        label(ctx, text, 0, h * 0.34, w * 0.95, h * 0.2, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "loser": {
        const s = Math.min(w, h);
        ctx.translate(0, -Math.abs(wave(t, 1.2)) * s * 0.06);
        ctx.fillStyle = color;
        roundRect(ctx, -s * 0.22, -s * 0.42, s * 0.14, s * 0.6, s * 0.05);
        ctx.fill();
        roundRect(ctx, -s * 0.22, s * 0.06, s * 0.44, s * 0.13, s * 0.05);
        ctx.fill();
        label(ctx, text, 0, s * 0.36, w * 0.95, s * 0.18, "#fff", { weight: 900, stroke: "#111" });
        break;
      }
      case "ohsnap": {
        const k = (t % 1.4) / 1.4;
        if (k < 0.25) {
          ctx.save();
          ctx.globalAlpha = 1 - k / 0.25;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = h * 0.03;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * TAU;
            const r0 = h * (0.3 + k * 0.6);
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.6);
            ctx.lineTo(Math.cos(a) * (r0 + h * 0.15), Math.sin(a) * (r0 + h * 0.15) * 0.6);
            ctx.stroke();
          }
          ctx.restore();
        }
        const s = k < 0.1 ? 1.15 - k * 1.5 : 1;
        ctx.scale(s, s);
        label(ctx, text, 0, 0, w * 0.9, h * 0.42, color, { weight: 900, stroke: "#111" });
        break;
      }
      case "sus": {
        const look = Math.sign(wave(t, 0.7)) * w * 0.03;
        emoji(ctx, "\u{1f928}", -w * 0.22 + look, 0, h * 0.55);
        label(ctx, text, w * 0.2, 0, w * 0.5, h * 0.45, color, { weight: 900, stroke: "#111" });
        break;
      }
      // ---- celebrate ----
      case "congrats": {
        const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5"];
        for (let i = 0; i < 18; i++) {
          const k = (t * 0.6 + rnd(i, 1)) % 1;
          const x = (rnd(i, 2) - 0.5) * w;
          const y = -h / 2 + k * h * 1.1;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(t * 4 + i);
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(-h * 0.03, -h * 0.015, h * 0.06, h * 0.03);
          ctx.restore();
        }
        const s = 1 + 0.05 * wave(t, 1.2);
        ctx.scale(s, s);
        label(ctx, text, 0, 0, w * 0.92, h * 0.5, color, { weight: 900, stroke: "#5a3a00" });
        break;
      }
      case "fireworks": {
        const colors = color ? [color] : ["#ff4d6d", "#ffd166", "#4fc3ff", "#9bff6b", "#c77dff"];
        for (let b = 0; b < 3; b++) {
          const k = (t * 0.7 + b / 3) % 1;
          const cx = (rnd(b, Math.floor(t * 0.7 + b / 3)) - 0.5) * w * 0.6;
          const cy = (rnd(b + 5, Math.floor(t * 0.7 + b / 3)) - 0.6) * h * 0.5;
          const r = Math.min(w, h) * 0.38 * Math.sqrt(k);
          ctx.globalAlpha = Math.max(0, 1 - k);
          ctx.strokeStyle = colors[b % colors.length];
          ctx.lineWidth = Math.min(w, h) * 0.02;
          ctx.lineCap = "round";
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6 + k * k * h * 0.08);
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r + k * k * h * 0.12);
            ctx.stroke();
          }
        }
        break;
      }
      case "balloons": {
        const colors = color ? [color] : ["#ff4d6d", "#ffd166", "#4fc3ff", "#c77dff"];
        for (let i = 0; i < 4; i++) {
          const x = (i - 1.5) * w * 0.22 + wave(t, 0.5, i * 1.3) * w * 0.04;
          const y = -h * 0.18 + wave(t, 0.4, i) * h * 0.05 - (i % 2) * h * 0.08;
          const r = Math.min(w, h) * 0.13;
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = Math.min(w, h) * 0.01;
          ctx.beginPath();
          ctx.moveTo(x, y + r * 1.2);
          ctx.quadraticCurveTo(x + wave(t, 1, i) * r * 0.5, y + r * 2.5, x, h * 0.48);
          ctx.stroke();
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 1.2, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.2, r * 0.3, -0.5, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "partypop": {
        const k = (t % 1.6) / 1.6;
        const colors = color ? [color] : ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f15bb5"];
        for (let i = 0; i < 24; i++) {
          const a = -Math.PI / 4 + (rnd(i, 1) - 0.5) * 1.3;
          const v = 0.35 + 0.4 * rnd(i, 2);
          const x = -w * 0.2 + Math.cos(a) * v * k * w;
          const y = h * 0.2 + Math.sin(a) * v * k * h + k * k * h * 0.4;
          ctx.globalAlpha = Math.max(0, 1 - k);
          ctx.fillStyle = colors[i % colors.length];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(k * 9 + i);
          ctx.fillRect(-h * 0.025, -h * 0.012, h * 0.05, h * 0.024);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        const kick = k < 0.1 ? 1.12 - k * 1.2 : 1;
        ctx.scale(kick, kick);
        emoji(ctx, "\u{1f389}", -w * 0.15, h * 0.12, Math.min(w, h) * 0.5);
        break;
      }
      case "trophy": {
        const s = Math.min(w, h);
        ctx.save();
        ctx.rotate(t * 0.8);
        ctx.fillStyle = "rgba(255,220,90,0.25)";
        for (let i = 0; i < 12; i++) {
          ctx.rotate(TAU / 12);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(s * 0.5, -s * 0.06);
          ctx.lineTo(s * 0.5, s * 0.06);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        const sc = 1 + 0.05 * wave(t, 1.3);
        ctx.scale(sc, sc);
        emoji(ctx, "\u{1f3c6}", 0, 0, s * 0.62);
        const g = (t % 1.5) / 1.5;
        ctx.fillStyle = `rgba(255,255,255,${0.9 * Math.max(0, 1 - Math.abs(g - 0.5) * 4)})`;
        star(ctx, s * 0.12, -s * 0.18, s * 0.08, 4, 0.2);
        ctx.fill();
        break;
      }
      case "birthday": {
        const cw = w * 0.6;
        const ch = h * 0.3;
        const top = -h * 0.02;
        ctx.fillStyle = "#fff3e0";
        roundRect(ctx, -cw / 2, top, cw, ch, ch * 0.15);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fillRect(-cw / 2, top + ch * 0.45, cw, ch * 0.18);
        ctx.fillStyle = "#ffb3d1";
        roundRect(ctx, -cw / 2 - cw * 0.04, top - ch * 0.12, cw * 1.08, ch * 0.22, ch * 0.1);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * cw * 0.28;
          ctx.fillStyle = ["#4fc3ff", "#9bff6b", "#ffd166"][i];
          ctx.fillRect(x - cw * 0.025, top - ch * 0.62, cw * 0.05, ch * 0.5);
          const fl = 1 + 0.25 * wave(t, 5 + i, i);
          ctx.fillStyle = "#ffb000";
          ctx.beginPath();
          ctx.ellipse(x + wave(t, 3, i) * cw * 0.01, top - ch * 0.75, cw * 0.03, cw * 0.06 * fl, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#fff3a0";
          ctx.beginPath();
          ctx.ellipse(x, top - ch * 0.72, cw * 0.014, cw * 0.03 * fl, 0, 0, TAU);
          ctx.fill();
        }
        label(ctx, text, 0, h * 0.4, w * 0.98, h * 0.15, color, { weight: 900, stroke: "#5a0030" });
        break;
      }
      case "clapping": {
        const k = (t * 2.4) % 1;
        const s = 1 + (k < 0.2 ? Math.sin((k / 0.2) * Math.PI) * 0.18 : 0);
        const m = Math.min(w, h);
        if (k < 0.3) {
          ctx.strokeStyle = color;
          ctx.lineWidth = m * 0.025;
          ctx.lineCap = "round";
          for (const a of [-2.4, -1.57, -0.7]) {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * m * 0.34, Math.sin(a) * m * 0.34);
            ctx.lineTo(Math.cos(a) * m * 0.46, Math.sin(a) * m * 0.46);
            ctx.stroke();
          }
        }
        ctx.scale(s, s);
        emoji(ctx, "\u{1f44f}", 0, m * 0.04, m * 0.6);
        break;
      }
      case "cheers": {
        const k = (t % 1.6) / 1.6;
        const tilt = k < 0.3 ? (k / 0.3) * 0.35 : k < 0.45 ? 0.35 : 0.35 * (1 - (k - 0.45) / 0.55);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * w * 0.17, -h * 0.05);
          ctx.rotate(-side * tilt);
          ctx.scale(side, 1);
          emoji(ctx, "\u{1f942}", 0, 0, h * 0.5);
          ctx.restore();
        }
        if (k > 0.28 && k < 0.5) {
          ctx.fillStyle = "#fff";
          star(ctx, 0, -h * 0.3, h * 0.1 * (1 - Math.abs(k - 0.39) * 8), 4, 0.25);
          ctx.fill();
        }
        label(ctx, text, 0, h * 0.38, w * 0.9, h * 0.2, color, { weight: 900, stroke: "#5a3a00" });
        break;
      }
      // ---- love ----
      case "heartpop": {
        const k = (t % 1.4) / 1.4;
        const s = Math.min(w, h);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          const r = s * (0.25 + k * 0.25);
          ctx.globalAlpha = Math.max(0, 1 - k);
          ctx.fillStyle = color;
          heart(ctx, Math.cos(a) * r, Math.sin(a) * r, s * 0.1);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        const p = k < 0.25 ? 0.7 + (k / 0.25) * 0.45 : 1.15 - Math.min(0.15, (k - 0.25) * 0.6);
        ctx.fillStyle = color;
        heart(ctx, 0, 0, s * 0.5 * p);
        ctx.fill();
        break;
      }
      case "loveyou": {
        const beat = (t * 1.3) % 1;
        const s = 1 + 0.22 * Math.exp(-((beat * 10) ** 2)) + 0.15 * Math.exp(-(((beat - 0.25) * 10) ** 2));
        ctx.save();
        ctx.translate(-w * 0.36, 0);
        ctx.fillStyle = color;
        heart(ctx, 0, 0, h * 0.62 * s);
        ctx.fill();
        ctx.restore();
        label(ctx, text, w * 0.12, 0, w * 0.68, h * 0.42, "#fff", { weight: 900, stroke: color });
        break;
      }
      case "hearteyes": {
        const s = Math.min(w, h);
        for (let i = 0; i < 5; i++) {
          const k = (t * 0.6 + i / 5) % 1;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = color;
          heart(ctx, (rnd(i, 1) - 0.5) * s * 0.8, s * 0.3 - k * s * 0.8, s * 0.1);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        const p = 1 + 0.08 * Math.abs(wave(t, 1.3));
        ctx.scale(p, p);
        emoji(ctx, "\u{1f60d}", 0, 0, s * 0.6);
        break;
      }
      // ---- cute ----
      case "kittycute": {
        const s = Math.min(w, h) * 0.88;
        ctx.translate(0, Math.abs(wave(t, 0.9)) * -h * 0.05 + h * 0.05);
        ctx.rotate(wave(t, 0.9) * 0.08);
        catHead(ctx, s, color, { ear: Math.max(0, wave(t, 0.5)) > 0.95 ? 0.25 : 0 });
        eyes(ctx, s, t, { y: -0.04 });
        blush(ctx, s);
        mouth(ctx, s, "cat", t, 0.12);
        break;
      }
      case "bear": {
        const s = Math.min(w, h) * 0.86;
        ctx.translate(0, h * 0.04);
        ctx.rotate(wave(t, 0.8) * 0.12);
        for (const side of [-1, 1]) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(side * s * 0.34, -s * 0.32, s * 0.15, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#f2c9a8";
          ctx.beginPath();
          ctx.arc(side * s * 0.34, -s * 0.32, s * 0.08, 0, TAU);
          ctx.fill();
        }
        roundHead(ctx, s, color);
        ctx.fillStyle = "#f2d7bd";
        ctx.beginPath();
        ctx.ellipse(0, s * 0.12, s * 0.17, s * 0.13, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.06, s * 0.05, s * 0.035, 0, 0, TAU);
        ctx.fill();
        eyes(ctx, s, t, { y: -0.08, gap: 0.2, r: 0.055 });
        blush(ctx, s, { y: 0.06, gap: 0.33 });
        mouth(ctx, s, "smile", t, 0.2);
        break;
      }
      case "bunny": {
        const s = Math.min(w, h) * 0.9;
        ctx.translate(0, h * 0.14 - Math.abs(wave(t, 1.2)) * h * 0.06);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * s * 0.16, -s * 0.32);
          ctx.rotate(side * (0.12 + (side > 0 ? Math.max(0, wave(t, 0.7)) * 0.5 : 0)));
          ctx.fillStyle = color;
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.lineWidth = s * 0.02;
          ctx.beginPath();
          ctx.ellipse(0, -s * 0.22, s * 0.09, s * 0.26, 0, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffb3c6";
          ctx.beginPath();
          ctx.ellipse(0, -s * 0.22, s * 0.045, s * 0.19, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        roundHead(ctx, s, color, 0.4, 0.34);
        eyes(ctx, s, t, { y: -0.03, gap: 0.18, r: 0.055, phase: 1 });
        blush(ctx, s, { y: 0.08, gap: 0.27 });
        mouth(ctx, s, "cat", t, 0.1);
        break;
      }
      case "puppy": {
        const s = Math.min(w, h) * 0.86;
        ctx.translate(0, h * 0.04);
        ctx.rotate(wave(t, 1) * 0.1);
        roundHead(ctx, s, color);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * s * 0.38, -s * 0.18);
          ctx.rotate(side * (0.35 + wave(t, 2, side) * 0.15));
          ctx.fillStyle = "#9c6b45";
          ctx.beginPath();
          ctx.ellipse(0, s * 0.16, s * 0.11, s * 0.24, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#fff3e3";
        ctx.beginPath();
        ctx.ellipse(0, s * 0.13, s * 0.19, s * 0.14, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.06, s * 0.04, 0, 0, TAU);
        ctx.fill();
        eyes(ctx, s, t, { y: -0.1, gap: 0.2, r: 0.06, phase: 0.6 });
        mouth(ctx, s, "tongue", t, 0.18);
        break;
      }
      case "panda": {
        const s = Math.min(w, h) * 0.86;
        ctx.translate(0, h * 0.04);
        ctx.rotate(wave(t, 0.7) * 0.1);
        ctx.fillStyle = INK;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(side * s * 0.33, -s * 0.31, s * 0.13, 0, TAU);
          ctx.fill();
        }
        roundHead(ctx, s, color);
        ctx.fillStyle = INK;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * s * 0.19, -s * 0.03, s * 0.1, s * 0.13, side * 0.5, 0, TAU);
          ctx.fill();
        }
        // white eyes inside the patches
        for (const side of [-1, 1]) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(side * s * 0.19, -s * 0.04, s * (blinking(t, 0.4) ? 0.01 : 0.045), 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.05, s * 0.035, 0, 0, TAU);
        ctx.fill();
        blush(ctx, s, { y: 0.12, gap: 0.33 });
        mouth(ctx, s, "cat", t, 0.17);
        break;
      }
      case "chick": {
        const s = Math.min(w, h) * 0.86;
        const hop = Math.abs(Math.sin(t * Math.PI * 1.6));
        ctx.translate(0, h * 0.08 - hop * h * 0.12);
        ctx.scale(1 + (1 - hop) * 0.05, 1 - (1 - hop) * 0.05);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.42, s * 0.4, 0, 0, TAU);
        ctx.fill();
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * s * 0.38, s * 0.05);
          ctx.rotate(side * (0.4 + Math.abs(wave(t, 3)) * 0.5));
          ctx.fillStyle = "#ffc400";
          ctx.beginPath();
          ctx.ellipse(side * s * 0.05, 0, s * 0.12, s * 0.07, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#ffd84a";
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, -s * 0.38);
        ctx.quadraticCurveTo(0, -s * 0.55, s * 0.06, -s * 0.4);
        ctx.fill();
        eyes(ctx, s, t, { y: -0.08, gap: 0.16, r: 0.055 });
        ctx.fillStyle = "#ff9f1c";
        ctx.beginPath();
        ctx.moveTo(-s * 0.07, s * 0.0);
        ctx.lineTo(s * 0.07, s * 0.0);
        ctx.lineTo(0, s * 0.09);
        ctx.closePath();
        ctx.fill();
        blush(ctx, s, { y: 0.05, gap: 0.27 });
        break;
      }
      case "ghost": {
        const s = Math.min(w, h) * 0.95;
        ctx.translate(wave(t, 0.4) * w * 0.05, wave(t, 0.8) * h * 0.05);
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = s * 0.02;
        ctx.beginPath();
        ctx.arc(0, -s * 0.08, s * 0.34, Math.PI, 0);
        const bottom = s * 0.36;
        ctx.lineTo(s * 0.34, bottom);
        for (let i = 4; i >= 0; i--) {
          const x = -s * 0.34 + (i / 4) * s * 0.68;
          ctx.lineTo(x, bottom - (i % 2 ? 0 : s * 0.06) + wave(t, 2, i) * s * 0.02);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        eyes(ctx, s, t, { y: -0.12, gap: 0.13, r: 0.05 });
        blush(ctx, s, { y: -0.01, gap: 0.22 });
        mouth(ctx, s, "open", t, 0.02);
        break;
      }
      case "cloudy": {
        const s = h * 0.9;
        ctx.translate(0, wave(t, 0.5) * h * 0.05);
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = s * 0.02;
        ctx.beginPath();
        for (const [x, y, r] of [[-0.42, 0.08, 0.22], [-0.18, -0.12, 0.3], [0.17, -0.16, 0.32], [0.45, 0.06, 0.23], [0, 0.12, 0.28]]) ctx.moveTo(x * s + r * s, y * s), ctx.arc(x * s, y * s, r * s, 0, TAU);
        ctx.fill();
        eyes(ctx, s, t, { y: 0.0, gap: 0.16, r: 0.05 });
        blush(ctx, s, { y: 0.09, gap: 0.26 });
        mouth(ctx, s, "smile", t, 0.12);
        sparklesAround(ctx, s * 1.3, t, 4);
        break;
      }
      case "starface": {
        const s = Math.min(w, h);
        ctx.rotate(wave(t, 0.8) * 0.15);
        const sc = 1 + 0.05 * wave(t, 1.6);
        ctx.scale(sc, sc);
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = s * 0.02;
        ctx.lineJoin = "round";
        star(ctx, 0, s * 0.03, s * 0.47, 5, 0.52);
        ctx.fill();
        ctx.stroke();
        eyes(ctx, s, t, { y: 0.0, gap: 0.12, r: 0.045 });
        blush(ctx, s, { y: 0.09, gap: 0.2, alpha: 0.5 });
        mouth(ctx, s, "smile", t, 0.13);
        break;
      }
      case "heartface": {
        const s = Math.min(w, h);
        const beat = (t * 1.2) % 1;
        const sc = 1 + 0.12 * Math.exp(-((beat * 10) ** 2)) + 0.08 * Math.exp(-(((beat - 0.25) * 10) ** 2));
        ctx.scale(sc, sc);
        ctx.fillStyle = color;
        heart(ctx, 0, s * 0.02, s * 0.9);
        ctx.fill();
        eyes(ctx, s, t, { y: -0.06, gap: 0.15, r: 0.05, mode: "happy" });
        blush(ctx, s, { y: 0.04, gap: 0.25 });
        mouth(ctx, s, "smile", t, 0.08);
        break;
      }
      case "sunny": {
        const s = Math.min(w, h);
        ctx.save();
        ctx.rotate(t * 0.5);
        ctx.fillStyle = color;
        for (let i = 0; i < 12; i++) {
          ctx.rotate(TAU / 12);
          ctx.beginPath();
          ctx.moveTo(-s * 0.05, -s * 0.34);
          ctx.lineTo(0, -s * (0.47 + 0.03 * wave(t, 2, i)));
          ctx.lineTo(s * 0.05, -s * 0.34);
          ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.31, 0, TAU);
        ctx.fill();
        eyes(ctx, s, t, { y: -0.04, gap: 0.12, r: 0.045, mode: "happy" });
        blush(ctx, s, { y: 0.06, gap: 0.2 });
        mouth(ctx, s, "smile", t, 0.1);
        break;
      }
      case "rainbow": {
        const bands = ["#ff5e5e", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"];
        const R = h * 0.62;
        const bw = h * 0.07;
        const grow = Math.min(1, (t % 4) / 1.2);
        ctx.lineWidth = bw;
        bands.forEach((c, i) => {
          ctx.strokeStyle = c;
          ctx.beginPath();
          ctx.arc(0, h * 0.32, R - i * bw, Math.PI, Math.PI + Math.PI * grow);
          ctx.stroke();
        });
        for (const side of [-1, 1]) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          for (const [x, y, r] of [[-0.12, 0, 0.11], [0, -0.05, 0.13], [0.13, 0, 0.1]]) ctx.moveTo(side * (R - bw * 2.5) + x * h + r * h, h * 0.32 + y * h), ctx.arc(side * (R - bw * 2.5) + x * h, h * 0.32 + y * h, r * h, 0, TAU);
          ctx.fill();
        }
        break;
      }
      // ---- cats & trolls ----
      case "trollcat": {
        const s = h * 0.62;
        ctx.save();
        ctx.translate(0, -h * 0.1);
        ctx.rotate(wave(t, 0.6) * 0.06);
        catHead(ctx, s, color, { stripes: true });
        // raised, wiggling eyebrows
        ctx.strokeStyle = INK;
        ctx.lineWidth = s * 0.035;
        ctx.lineCap = "round";
        const lift = Math.max(0, wave(t, 1.6)) * s * 0.06;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * s * 0.12, -s * 0.16 - (side > 0 ? lift : 0));
          ctx.lineTo(side * s * 0.36, -s * 0.2 - (side > 0 ? lift * 1.4 : 0));
          ctx.stroke();
        }
        eyes(ctx, s, t, { y: -0.06, gap: 0.24, r: 0.07, mode: "smug", look: wave(t, 0.5) });
        mouth(ctx, s, "grin", t, 0.16);
        ctx.restore();
        label(ctx, text, 0, h * 0.38, w * 0.95, h * 0.2, "#fff", { weight: 900, stroke: "#111" });
        break;
      }
      case "nopecat": {
        const s = h * 0.62;
        ctx.save();
        ctx.translate(0, -h * 0.1);
        ctx.rotate(Math.sin(t * TAU * 2.2) * 0.25 * (((t % 2) < 1.2) ? 1 : 0.1));
        catHead(ctx, s, color, { stripes: true });
        eyes(ctx, s, t, { y: -0.04, mode: "smug" });
        mouth(ctx, s, "flat", t, 0.17);
        ctx.restore();
        label(ctx, text, 0, h * 0.38, w * 0.9, h * 0.22, "#ff4d4d", { weight: 900, stroke: "#111" });
        break;
      }
      case "peekcat": {
        // rises from the bottom edge, looks left and right, ducks again
        const k = (t % 3.5) / 3.5;
        const up = k < 0.15 ? k / 0.15 : k < 0.8 ? 1 : Math.max(0, 1 - (k - 0.8) / 0.12);
        const s = h * 0.8;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.clip();
        ctx.translate(0, h / 2 + s * 0.45 - up * s * 0.62);
        catHead(ctx, s, color);
        const look = k < 0.35 ? -1 : k < 0.6 ? 1 : 0;
        eyes(ctx, s, t, { y: -0.06, mode: "wide", look, r: 0.07 });
        ctx.restore();
        ctx.fillStyle = color;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * s * 0.32, h / 2 - h * 0.05 + (1 - up) * h * 0.2, s * 0.1, s * 0.07, 0, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "vibecat": {
        const s = Math.min(w, h) * 0.82;
        const beat = Math.sin(t * Math.PI * 2 * 1.1);
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i / 3) % 1;
          ctx.globalAlpha = 1 - k;
          note(ctx, (i - 1) * s * 0.45, -s * 0.25 - k * s * 0.4, s * 0.2, ["#c77dff", "#4dabf7", "#ffd166"][i], i % 2 === 1);
        }
        ctx.globalAlpha = 1;
        ctx.translate(beat * w * 0.04, h * 0.06 + Math.abs(beat) * -h * 0.04);
        ctx.rotate(beat * 0.18);
        catHead(ctx, s, color);
        // sunglasses
        ctx.fillStyle = "#111";
        for (const side of [-1, 1]) {
          roundRect(ctx, side * s * 0.27 - s * 0.14, -s * 0.12, s * 0.28, s * 0.14, s * 0.04);
          ctx.fill();
        }
        ctx.fillRect(-s * 0.13, -s * 0.09, s * 0.26, s * 0.03);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (const side of [-1, 1]) ctx.fillRect(side * s * 0.27 - s * 0.09, -s * 0.1, s * 0.06, s * 0.025);
        mouth(ctx, s, "smile", t, 0.18);
        break;
      }
      case "rainbowcat": {
        const k = (t % 2.4) / 2.4;
        const x = -w * 0.25 + Math.sin(k * TAU) * w * 0.12;
        const y = Math.sin(k * TAU * 2) * h * 0.08;
        const bands = ["#ff5e5e", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"];
        const bh = h * 0.07;
        bands.forEach((c, i) => {
          ctx.fillStyle = c;
          for (let j = 0; j < 8; j++) {
            const sx = x - h * 0.15 - j * w * 0.07;
            if (sx < -w / 2 - w * 0.07) break;
            ctx.fillRect(sx - w * 0.07, y - bh * 3 + i * bh + ((j % 2) ? bh * 0.4 : 0), w * 0.075, bh);
          }
        });
        for (let i = 0; i < 5; i++) {
          const sx = ((rnd(i, 1) * w - t * w * 0.6) % w + w) % w - w / 2;
          ctx.fillStyle = "#fff";
          star(ctx, sx, (rnd(i, 2) - 0.5) * h * 0.85, h * 0.04, 4, 0.3);
          ctx.fill();
        }
        ctx.translate(x + w * 0.1, y);
        catHead(ctx, h * 0.6, color);
        eyes(ctx, h * 0.6, t, { y: -0.04, mode: "happy" });
        blush(ctx, h * 0.6);
        mouth(ctx, h * 0.6, "cat", t, 0.12);
        break;
      }
      case "slapcat": {
        const k = (t % 1.6) / 1.6;
        const s = h * 0.72;
        ctx.save();
        ctx.translate(-w * 0.15, h * 0.05);
        catHead(ctx, s, color, { stripes: true });
        eyes(ctx, s, t, { y: -0.05, mode: "smug" });
        mouth(ctx, s, "flat", t, 0.17);
        ctx.restore();
        // the paw swings in from the right
        const swing = k < 0.18 ? k / 0.18 : k < 0.3 ? 1 : Math.max(0, 1 - (k - 0.3) / 0.3);
        ctx.save();
        ctx.translate(w * 0.45, h * 0.1);
        ctx.rotate(-0.9 * swing);
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = h * 0.015;
        roundRect(ctx, -w * 0.32, -h * 0.07, w * 0.32, h * 0.14, h * 0.07);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffb3c6";
        ctx.beginPath();
        ctx.arc(-w * 0.27, 0, h * 0.035, 0, TAU);
        ctx.fill();
        ctx.restore();
        if (k > 0.15 && k < 0.45) {
          const sc = 1.2 - (k - 0.15) * 0.8;
          ctx.save();
          ctx.translate(w * 0.05, -h * 0.32);
          ctx.scale(sc, sc);
          label(ctx, text, 0, 0, w * 0.6, h * 0.24, "#ffea00", { weight: 900, stroke: "#111" });
          ctx.restore();
        }
        break;
      }
      case "smugcat": {
        const s = h * 0.62;
        ctx.save();
        ctx.translate(0, -h * 0.1);
        ctx.rotate(-0.12 + wave(t, 0.5) * 0.05);
        catHead(ctx, s, color);
        eyes(ctx, s, t, { y: -0.05, mode: "smug" });
        blush(ctx, s, { alpha: 0.35 });
        // smirk
        ctx.strokeStyle = INK;
        ctx.lineWidth = s * 0.03;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-s * 0.06, s * 0.15);
        ctx.quadraticCurveTo(s * 0.06, s * 0.2, s * 0.15, s * 0.1);
        ctx.stroke();
        sparklesAround(ctx, s * 1.2, t, 3);
        ctx.restore();
        label(ctx, text, 0, h * 0.38, w * 0.9, h * 0.2, "#fff", { weight: 900, stroke: "#111" });
        break;
      }
      case "screamcat": {
        const s = h * 0.62;
        ctx.save();
        ctx.translate(wave(t, 11) * w * 0.02, -h * 0.1);
        catHead(ctx, s, color, { ear: 0.2 });
        eyes(ctx, s, t, { y: -0.08, mode: "wide", r: 0.065 });
        mouth(ctx, s, "scream", t, 0.12);
        ctx.restore();
        const sc = 1 + 0.06 * Math.abs(wave(t, 5));
        ctx.save();
        ctx.translate(0, h * 0.38);
        ctx.scale(sc, sc);
        label(ctx, text, 0, 0, w * 0.95, h * 0.2, "#fff", { weight: 900, stroke: "#111" });
        ctx.restore();
        break;
      }
      // ---- fun ----
      case "mindblown": {
        const k = (t % 1.8) / 1.8;
        const s = Math.min(w, h);
        if (k < 0.5) {
          ctx.save();
          ctx.globalAlpha = 1 - k * 2;
          ctx.fillStyle = color;
          burst(ctx, 0, -s * 0.2, s * (0.2 + k * 0.6), s * (0.12 + k * 0.4), 10);
          ctx.fill();
          ctx.restore();
        }
        ctx.translate(wave(t, 8) * s * 0.01, s * 0.08);
        emoji(ctx, "\u{1f92f}", 0, 0, s * 0.62);
        break;
      }
      case "thinking": {
        emoji(ctx, "\u{1f914}", -w * 0.2, h * 0.08, h * 0.6);
        for (let i = 0; i < 3; i++) {
          const on = (Math.floor(t * 2.5) % 4) > i;
          ctx.fillStyle = on ? color : "rgba(255,255,255,0.25)";
          ctx.beginPath();
          ctx.arc(w * 0.12 + i * w * 0.12, -h * 0.18 - i * h * 0.06, h * (0.04 + i * 0.015), 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "sleepy": {
        const s = Math.min(w, h);
        ctx.save();
        ctx.translate(-s * 0.08, s * 0.1);
        ctx.rotate(wave(t, 0.4) * 0.08);
        emoji(ctx, "\u{1f634}", 0, 0, s * 0.55);
        ctx.restore();
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.5 + i / 3) % 1;
          ctx.globalAlpha = Math.min(1, (1 - k) * 1.5);
          label(ctx, "Z", s * 0.15 + k * s * 0.25, -s * 0.05 - k * s * 0.4, s * 0.3, s * (0.1 + k * 0.12), color, { weight: 900, stroke: "rgba(0,0,0,0.4)" });
        }
        break;
      }
      case "music": {
        const s = Math.min(w, h);
        for (let i = 0; i < 6; i++) {
          const k = (t * 0.45 + i / 6) % 1;
          const x = (rnd(i, 1) - 0.5) * s * 0.8 + wave(t, 0.8, i) * s * 0.05;
          ctx.globalAlpha = Math.min(1, (1 - k) * 1.4);
          note(ctx, x, s * 0.4 - k * s * 0.85, s * (0.18 + 0.08 * rnd(i, 2)), i % 2 ? color : "#4dabf7", i % 3 === 0);
        }
        break;
      }
      case "coffee": {
        const s = Math.min(w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = s * 0.03;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i / 3) % 1;
          ctx.globalAlpha = Math.sin(k * Math.PI);
          ctx.beginPath();
          const x0 = (i - 1) * s * 0.12;
          ctx.moveTo(x0, -s * 0.05 - k * s * 0.2);
          ctx.bezierCurveTo(x0 + s * 0.08, -s * 0.15 - k * s * 0.2, x0 - s * 0.08, -s * 0.25 - k * s * 0.2, x0, -s * 0.35 - k * s * 0.2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        emoji(ctx, "\u2615", 0, s * 0.2, s * 0.5);
        break;
      }
      case "peace": {
        const s = Math.min(w, h);
        ctx.rotate(wave(t, 1.3) * 0.25);
        emoji(ctx, "\u270c\ufe0f", 0, 0, s * 0.62);
        sparklesAround(ctx, s, t, 3, color);
        break;
      }
      case "thumbsup": {
        const s = Math.min(w, h);
        const k = (t % 1.6) / 1.6;
        const pop = k < 0.2 ? 0.6 + (k / 0.2) * 0.55 : 1.15 - Math.min(0.15, (k - 0.2) * 0.5);
        if (k < 0.45) {
          ctx.save();
          ctx.globalAlpha = 1 - k / 0.45;
          ctx.strokeStyle = color;
          ctx.lineWidth = s * 0.03;
          ctx.lineCap = "round";
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            const r0 = s * (0.32 + k * 0.3);
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
            ctx.lineTo(Math.cos(a) * (r0 + s * 0.08), Math.sin(a) * (r0 + s * 0.08));
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.scale(pop, pop);
        emoji(ctx, "\u{1f44d}", 0, 0, s * 0.58);
        break;
      }
      case "swipeup": {
        const cw = w * 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.min(w, h) * 0.06;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < 3; i++) {
          const y = -h * 0.12 - i * h * 0.13;
          ctx.globalAlpha = 0.2 + 0.8 * Math.max(0, Math.sin(t * TAU * 1.1 - i * 0.9));
          ctx.beginPath();
          ctx.moveTo(-cw / 2, y + cw * 0.25);
          ctx.lineTo(0, y);
          ctx.lineTo(cw / 2, y + cw * 0.25);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        label(ctx, text, 0, h * 0.3, w * 0.95, h * 0.16, color, { weight: 700, stroke: "rgba(0,0,0,0.45)" });
        break;
      }
    }
    ctx.restore();
  }

  // ---- animations for emoji / text stickers ----------------------------------------------------------
  // The extra move at t seconds: { dx, dy (× the box height), scale, rot (radians), pivotY (× height
  // from the centre: where it turns), dxW / dyH (× the canvas width / height), alpha }. The ticker
  // (text scrolling right to left) is worked out by the layer, which knows the canvas.
  function animate(anim, t) {
    const m = { dx: 0, dy: 0, scale: 1, rot: 0, pivotY: 0, dxW: 0, dyH: 0, alpha: null };
    const easeOut = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
    switch (anim) {
      case "slidein":
        m.dxW = -(1 - easeOut(t / 0.5));
        break;
      case "slideright":
        m.dxW = 1 - easeOut(t / 0.5);
        break;
      case "slideup":
        m.dyH = 0.25 * (1 - easeOut(t / 0.5));
        m.alpha = easeOut(t / 0.4);
        break;
      case "fadein":
        m.alpha = Math.min(1, t / 0.6);
        break;
      case "bounce":
        m.dy = -Math.abs(Math.sin(t * Math.PI * 2)) * 0.25;
        break;
      case "spin":
        m.rot = t * Math.PI;
        break;
      case "pulse":
        m.scale = 1 + 0.12 * wave(t, 1.5);
        break;
      case "shake":
        m.dx = wave(t, 7) * 0.05;
        m.rot = wave(t, 9) * 0.06;
        break;
      case "float":
        m.dy = wave(t, 0.5) * 0.12;
        break;
      case "wobble":
        m.rot = wave(t, 1.2) * 0.18;
        m.scale = 1 + wave(t, 2.4) * 0.03;
        break;
      case "heartbeat": {
        const b = (t * 1.2) % 1;
        m.scale = 1 + 0.2 * (Math.exp(-((b * 10) ** 2)) + 0.8 * Math.exp(-(((b - 0.22) * 10) ** 2)));
        break;
      }
      case "popin": {
        const u = Math.min(1, t / 0.5);
        m.scale = 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2;
        break;
      }
      case "swing":
        m.rot = wave(t, 0.8) * 0.35;
        m.pivotY = -0.5;
        break;
    }
    return m;
  }

  return { GROUPS, DESIGNS, TEXT_DESIGNS, design, draw, animate };
})();
