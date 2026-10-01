const fs = require("fs-extra");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "birthday",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Birthday Square DP - RGB LED + Big Cake + Flowers + Balloons",
  usePrefix: true,
  commandCategory: "BIRTHDAY DP",
  usages: "[reply | mention | random]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    canvas: ""
  }
};

module.exports.run = async function ({ api, event, Users }) {
  const cache = __dirname + "/cache/";

  if (!fs.existsSync(cache)) {
    fs.mkdirSync(cache, { recursive: true });
  }

  const id = Date.now();
  const avatarPath = `${cache}birthday_${id}.jpg`;
  const outputPath = `${cache}birthday_${id}.png`;

  try {
    // =====================================================
    //                    USER SELECT
    // =====================================================

    let uid = String(event.senderID);

    // 1. REPLY
    if (
      event.messageReply &&
      event.messageReply.senderID
    ) {
      uid = String(event.messageReply.senderID);
    }

    // 2. MENTION
    else if (
      event.mentions &&
      Object.keys(event.mentions).length > 0
    ) {
      uid = String(Object.keys(event.mentions)[0]);
    }

    // 3. RANDOM
    else {
      try {
        const info = await api.getThreadInfo(event.threadID);

        let botID = "";

        try {
          if (typeof api.getCurrentUserID === "function") {
            botID = String(api.getCurrentUserID());
          }
        } catch (e) {
          botID = "";
        }

        const members = (info.participantIDs || [])
          .map(String)
          .filter(memberID =>
            memberID !== String(event.senderID) &&
            memberID !== botID
          );

        if (members.length > 0) {
          uid = members[
            Math.floor(Math.random() * members.length)
          ];
        }
      } catch (e) {
        console.log("Random user select error:", e.message);
      }
    }

    // =====================================================
    //                       NAME
    // =====================================================

    let name = "BIRTHDAY STAR";

    try {
      if (Users && typeof Users.getNameUser === "function") {
        name = await Users.getNameUser(uid);
      }
    } catch (e) {}

    if (!name) {
      name = "BIRTHDAY STAR";
    }

    // =====================================================
    //                    DOWNLOAD DP
    // =====================================================

    const token =
      "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    const avatarURL =
      `https://graph.facebook.com/${encodeURIComponent(uid)}/picture` +
      `?width=1000&height=1000&type=large&access_token=${encodeURIComponent(token)}`;

    let avatarBuffer;

    try {
      const res = await axios.get(avatarURL, {
        responseType: "arraybuffer",
        timeout: 20000,
        maxContentLength: 15 * 1024 * 1024,
        maxBodyLength: 15 * 1024 * 1024
      });

      avatarBuffer = Buffer.from(res.data);
    } catch (e) {
      // Fallback
      const fallbackURL =
        `https://graph.facebook.com/${encodeURIComponent(uid)}/picture` +
        `?width=1000&height=1000&type=large`;

      const res = await axios.get(fallbackURL, {
        responseType: "arraybuffer",
        timeout: 20000,
        maxContentLength: 15 * 1024 * 1024,
        maxBodyLength: 15 * 1024 * 1024
      });

      avatarBuffer = Buffer.from(res.data);
    }

    if (!avatarBuffer || !avatarBuffer.length) {
      throw new Error("Avatar download failed");
    }

    fs.writeFileSync(avatarPath, avatarBuffer);

    const avatar = await loadImage(avatarBuffer);

    // =====================================================
    //                       CANVAS
    // =====================================================

    const W = 1080;
    const H = 1080;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // WHITE BACKGROUND
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // =====================================================
    //                     RGB GLOW
    // =====================================================

    glow(ctx, 90, 90, "#ff00d4", 220);
    glow(ctx, 990, 90, "#00eaff", 220);
    glow(ctx, 90, 980, "#7b00ff", 220);
    glow(ctx, 990, 980, "#ff0080", 220);

    // =====================================================
    //                   OUTER RGB FRAME
    // =====================================================

    rgbBorder(ctx, 14, 14, 1052, 1052, 30);
    rgbBorder(ctx, 29, 29, 1022, 1022, 24);

    ledFrame(ctx, 42, 42, 996, 996);

    // =====================================================
    //                  HAPPY BIRTHDAY LED
    // =====================================================

    ledText(ctx, "HAPPY BIRTHDAY", 540, 92, 58);

    // Decorative hearts
    heart(ctx, 90, 100, 23, "#ff0080");
    heart(ctx, 990, 100, 23, "#00c8ff");

    // =====================================================
    //                    FLOWER GARDENS
    // =====================================================

    flowerGarden(ctx, 92, 230, 1);
    flowerGarden(ctx, 988, 230, -1);

    // =====================================================
    //                    SQUARE DP
    // =====================================================

    const x = 240;
    const y = 265;
    const size = 600;

    // Outer DP glow
    ctx.save();

    round(ctx, x - 12, y - 12, size + 24, size + 24, 28);

    ctx.shadowBlur = 35;
    ctx.shadowColor = "#ff00d4";

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();

    // RGB DP frame
    rgbBorder(
      ctx,
      x - 9,
      y - 9,
      size + 18,
      size + 18,
      24
    );

    // DP
    drawAvatar(
      ctx,
      avatar,
      x + 17,
      y + 17,
      size - 34
    );

    // LED bulbs
    ledSquare(
      ctx,
      x - 9,
      y - 9,
      size + 18
    );

    // =====================================================
    //                      BALLOONS
    // =====================================================

    balloon(ctx, 105, 430, 48, 70, "#ff00a8");
    balloon(ctx, 130, 585, 43, 65, "#00bfff");

    balloon(ctx, 975, 430, 48, 70, "#7b00ff");
    balloon(ctx, 950, 585, 43, 65, "#ff1744");

    // Balloon strings
    balloonString(ctx, 105, 500, 105, 790);
    balloonString(ctx, 130, 650, 130, 805);
    balloonString(ctx, 975, 500, 975, 790);
    balloonString(ctx, 950, 650, 950, 805);

    // =====================================================
    //                  SIDE FLOWERS
    // =====================================================

    flower(ctx, 165, 760, 40, "#ff1493");
    flower(ctx, 915, 760, 40, "#00aaff");

    flower(ctx, 130, 825, 30, "#ff1744");
    flower(ctx, 950, 825, 30, "#7b00ff");

    flower(ctx, 205, 845, 25, "#ff6500");
    flower(ctx, 875, 845, 25, "#00ff80");

    // =====================================================
    //                       BIG CAKE
    // =====================================================

    drawBigCake(ctx, 540, 790);

    // =====================================================
    //                     NAME PLATE
    // =====================================================

    let shortName = String(name || "BIRTHDAY STAR");

    if (shortName.length > 18) {
      shortName = shortName.slice(0, 18) + "...";
    }

    namePlate(ctx, shortName, 540, 1000);

    // =====================================================
    //                       SAVE
    // =====================================================

    fs.writeFileSync(
      outputPath,
      canvas.toBuffer("image/png")
    );

    // =====================================================
    //                       SEND
    // =====================================================

    return api.sendMessage(
      {
        body: `🎂 Happy Birthday ${name}! 🎉`,
        mentions: [
          {
            id: uid,
            tag: name
          }
        ],
        attachment: fs.createReadStream(outputPath)
      },
      event.threadID,
      () => {
        clean(avatarPath);
        clean(outputPath);
      },
      event.messageID
    );

  } catch (err) {
    console.error("[BIRTHDAY ERROR]", err);

    clean(avatarPath);
    clean(outputPath);

    return api.sendMessage(
      "❌ Birthday DP generate nahi ho paayi. Dobara try karo.",
      event.threadID,
      event.messageID
    );
  }
};

// =====================================================
//                         CLEAN
// =====================================================

function clean(file) {
  try {
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch (e) {}
}

// =====================================================
//                    ROUNDED RECT
// =====================================================

function round(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    r
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    r
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    r
  );

  ctx.closePath();
}

// =====================================================
//                       AVATAR
// =====================================================

function drawAvatar(ctx, img, x, y, size) {
  ctx.save();

  round(
    ctx,
    x,
    y,
    size,
    size,
    14
  );

  ctx.clip();

  const scale = Math.max(
    size / img.width,
    size / img.height
  );

  const w = img.width * scale;
  const h = img.height * scale;

  ctx.drawImage(
    img,
    x + (size - w) / 2,
    y + (size - h) / 2,
    w,
    h
  );

  ctx.restore();
}

// =====================================================
//                     RGB BORDER
// =====================================================

function rgbBorder(ctx, x, y, w, h, r) {
  const g = ctx.createLinearGradient(
    x,
    y,
    x + w,
    y + h
  );

  g.addColorStop(0, "#ff0080");
  g.addColorStop(.16, "#7b00ff");
  g.addColorStop(.32, "#00c8ff");
  g.addColorStop(.48, "#00ff80");
  g.addColorStop(.64, "#ffff00");
  g.addColorStop(.80, "#ff6500");
  g.addColorStop(1, "#ff00d4");

  ctx.save();

  round(
    ctx,
    x,
    y,
    w,
    h,
    r
  );

  ctx.strokeStyle = g;
  ctx.lineWidth = 9;

  ctx.shadowBlur = 22;
  ctx.shadowColor = "#ff00d4";

  ctx.stroke();

  ctx.restore();
}

// =====================================================
//                    LED FRAME
// =====================================================

function ledFrame(ctx, x, y, w, h) {
  const colors = [
    "#ff0080",
    "#7b00ff",
    "#00c8ff",
    "#00ff80",
    "#ffff00",
    "#ff6500"
  ];

  const count = 72;

  for (let i = 0; i < count; i++) {
    let px;
    let py;

    const perimeter =
      2 * (w + h);

    const d =
      (i / count) * perimeter;

    if (d < w) {
      px = x + d;
      py = y;
    } else if (d < w + h) {
      px = x + w;
      py = y + (d - w);
    } else if (d < 2 * w + h) {
      px = x + w - (d - w - h);
      py = y + h;
    } else {
      px = x;
      py = y + h - (d - 2 * w - h);
    }

    const color =
      colors[i % colors.length];

    ctx.save();

    ctx.fillStyle = color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.arc(
      px,
      py,
      4.5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }
}

// =====================================================
//                     LED SQUARE
// =====================================================

function ledSquare(ctx, x, y, size) {
  const colors = [
    "#ff0080",
    "#7b00ff",
    "#00c8ff",
    "#00ff80",
    "#ffff00",
    "#ff6500"
  ];

  const total = 48;

  for (let i = 0; i < total; i++) {
    let px;
    let py;

    if (i < 13) {
      px =
        x +
        25 +
        i * ((size - 50) / 12);

      py = y;

    } else if (i < 25) {
      px = x + size;

      py =
        y +
        25 +
        (i - 13) *
        ((size - 50) / 11);

    } else if (i < 37) {
      px =
        x +
        size -
        25 -
        (i - 25) *
        ((size - 50) / 11);

      py = y + size;

    } else {
      px = x;

      py =
        y +
        size -
        25 -
        (i - 37) *
        ((size - 50) / 10);
    }

    const color =
      colors[i % colors.length];

    ctx.save();

    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.arc(
      px,
      py,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }
}

// =====================================================
//                    LED HAPPY BIRTHDAY
// =====================================================

function ledText(ctx, text, x, y, size) {
  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    `900 ${size}px Arial Black, Arial`;

  // Outer dark outline
  ctx.lineWidth = 13;
  ctx.strokeStyle = "#111";

  ctx.strokeText(
    text,
    x,
    y
  );

  // RGB gradient
  const g = ctx.createLinearGradient(
    x - 450,
    y,
    x + 450,
    y
  );

  g.addColorStop(0, "#ff0080");
  g.addColorStop(.18, "#7b00ff");
  g.addColorStop(.35, "#00c8ff");
  g.addColorStop(.52, "#00ff80");
  g.addColorStop(.68, "#ffff00");
  g.addColorStop(.84, "#ff6500");
  g.addColorStop(1, "#ff00d4");

  ctx.fillStyle = g;

  ctx.shadowBlur = 28;
  ctx.shadowColor = "#ff00d4";

  ctx.fillText(
    text,
    x,
    y
  );

  // LED dots
  ctx.shadowBlur = 12;

  const startX = x - 390;

  for (let i = 0; i < 16; i++) {
    const dotX =
      startX + i * 52;

    const color =
      [
        "#ff0080",
        "#7b00ff",
        "#00c8ff",
        "#00ff80",
        "#ffff00",
        "#ff6500"
      ][i % 6];

    ctx.fillStyle = color;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.arc(
      dotX,
      y + 43,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();
}

// =====================================================
//                   FLOWER GARDEN
// =====================================================

function flowerGarden(ctx, x, y, d) {
  ctx.save();

  ctx.strokeStyle = "#159447";
  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.moveTo(
    x,
    y + 250
  );

  ctx.quadraticCurveTo(
    x + 30 * d,
    y + 100,
    x,
    y
  );

  ctx.stroke();

  leaf(
    ctx,
    x - 35 * d,
    y + 150,
    d
  );

  leaf(
    ctx,
    x + 30 * d,
    y + 95,
    -d
  );

  flower(
    ctx,
    x,
    y + 225,
    38,
    "#ff0080"
  );

  flower(
    ctx,
    x + 45 * d,
    y + 165,
    30,
    "#00aaff"
  );

  flower(
    ctx,
    x - 30 * d,
    y + 80,
    25,
    "#ff1744"
  );

  ctx.restore();
}

// =====================================================
//                         LEAF
// =====================================================

function leaf(ctx, x, y, d) {
  ctx.save();

  ctx.translate(x, y);
  ctx.scale(d, 1);

  ctx.fillStyle = "#20a447";

  ctx.beginPath();

  ctx.moveTo(0, 0);

  ctx.bezierCurveTo(
    30,
    -25,
    55,
    -15,
    58,
    5
  );

  ctx.bezierCurveTo(
    30,
    25,
    10,
    18,
    0,
    0
  );

  ctx.fill();

  ctx.restore();
}

// =====================================================
//                         FLOWER
// =====================================================

function flower(ctx, x, y, s, color) {
  ctx.save();

  ctx.fillStyle = color;

  ctx.shadowBlur = 14;
  ctx.shadowColor = color;

  for (let i = 0; i < 8; i++) {
    const a =
      i * Math.PI / 4;

    ctx.beginPath();

    ctx.ellipse(
      x + Math.cos(a) * s * .45,
      y + Math.sin(a) * s * .45,
      s * .25,
      s * .5,
      a,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.fillStyle = "#ffd600";

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    s * .22,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

// =====================================================
//                       BALLOON
// =====================================================

function balloon(ctx, x, y, rx, ry, color) {
  ctx.save();

  const g =
    ctx.createRadialGradient(
      x - rx * .3,
      y - ry * .4,
      3,
      x,
      y,
      ry
    );

  g.addColorStop(0, "#ffffff");
  g.addColorStop(.18, color);
  g.addColorStop(1, "#550055");

  ctx.fillStyle = g;

  ctx.shadowBlur = 16;
  ctx.shadowColor = color;

  ctx.beginPath();

  ctx.ellipse(
    x,
    y,
    rx,
    ry,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Knot
  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.moveTo(
    x - 7,
    y + ry - 2
  );

  ctx.lineTo(
    x + 7,
    y + ry - 2
  );

  ctx.lineTo(
    x,
    y + ry + 12
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

// =====================================================
//                  BALLOON STRING
// =====================================================

function balloonString(
  ctx,
  x1,
  y1,
  x2,
  y2
) {
  ctx.save();

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(x1, y1);

  ctx.quadraticCurveTo(
    x1 + 12,
    (y1 + y2) / 2,
    x2,
    y2
  );

  ctx.stroke();

  ctx.restore();
}

// =====================================================
//                       BIG CAKE
// =====================================================

function drawBigCake(ctx, x, y) {
  ctx.save();

  // Cake glow
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#ff00d4";

  // Bottom cake
  const bottom =
    ctx.createLinearGradient(
      x - 190,
      y + 80,
      x + 190,
      y + 190
    );

  bottom.addColorStop(
    0,
    "#ff1493"
  );

  bottom.addColorStop(
    .5,
    "#7b00ff"
  );

  bottom.addColorStop(
    1,
    "#00c8ff"
  );

  round(
    ctx,
    x - 190,
    y + 70,
    380,
    125,
    25
  );

  ctx.fillStyle = bottom;
  ctx.fill();

  // Cake top
  const top =
    ctx.createLinearGradient(
      x - 185,
      y + 30,
      x + 185,
      y + 85
    );

  top.addColorStop(
    0,
    "#fff0fa"
  );

  top.addColorStop(
    .5,
    "#ffffff"
  );

  top.addColorStop(
    1,
    "#ffe2f4"
  );

  ctx.fillStyle = top;

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 70,
    190,
    55,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Cream line
  ctx.fillStyle = "#ffffff";

  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();

    ctx.arc(
      x + i * 45,
      y + 115,
      16,
      0,
      Math.PI
    );

    ctx.fill();
  }

  // Cake decorations
  const dots = [
    [-135, 105, "#ff0080"],
    [-90, 145, "#00c8ff"],
    [-45, 105, "#ffff00"],
    [0, 150, "#00ff80"],
    [45, 105, "#ff6500"],
    [90, 145, "#7b00ff"],
    [135, 105, "#ff0080"]
  ];

  for (const d of dots) {
    ctx.fillStyle = d[2];

    ctx.shadowBlur = 10;
    ctx.shadowColor = d[2];

    ctx.beginPath();

    ctx.arc(
      x + d[0],
      y + d[1],
      7,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  // Candles
  const candleColors = [
    "#ff0080",
    "#00c8ff",
    "#7b00ff",
    "#ff6500",
    "#00ff80"
  ];

  for (let i = -2; i <= 2; i++) {
    const cx = x + i * 58;
    const cy = y - 12;

    ctx.fillStyle =
      candleColors[
        (i + 2) %
        candleColors.length
      ];

    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;

    round(
      ctx,
      cx - 8,
      cy,
      16,
      70,
      5
    );

    ctx.fill();

    // Flame
    ctx.fillStyle = "#ffd600";
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff6500";

    ctx.beginPath();

    ctx.moveTo(
      cx,
      cy - 25
    );

    ctx.bezierCurveTo(
      cx - 15,
      cy - 5,
      cx - 8,
      cy + 5,
      cx,
      cy + 8
    );

    ctx.bezierCurveTo(
      cx + 8,
      cy + 5,
      cx + 15,
      cy - 5,
      cx,
      cy - 25
    );

    ctx.fill();
  }

  // Small HAPPY BIRTHDAY cake text
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#ff00d4";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    "bold 25px Arial Black";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    "HAPPY BIRTHDAY",
    x,
    y + 185
  );

  ctx.restore();
}

// =====================================================
//                       HEART
// =====================================================

function heart(ctx, x, y, s, color) {
  ctx.save();

  ctx.translate(x, y);

  ctx.fillStyle = color;

  ctx.shadowBlur = 12;
  ctx.shadowColor = color;

  ctx.beginPath();

  ctx.moveTo(0, s);

  ctx.bezierCurveTo(
    -s * 1.4,
    -s * .1,
    -s,
    -s,
    0,
    -s * .35
  );

  ctx.bezierCurveTo(
    s,
    -s,
    s * 1.4,
    -.1 * s,
    0,
    s
  );

  ctx.fill();

  ctx.restore();
}

// =====================================================
//                     NAME PLATE
// =====================================================

function namePlate(ctx, name, x, y) {
  const w = 460;
  const h = 62;

  ctx.save();

  const g =
    ctx.createLinearGradient(
      x - w / 2,
      y,
      x + w / 2,
      y
    );

  g.addColorStop(
    0,
    "#ff0080"
  );

  g.addColorStop(
    .3,
    "#7b00ff"
  );

  g.addColorStop(
    .5,
    "#00eaff"
  );

  g.addColorStop(
    .7,
    "#7b00ff"
  );

  g.addColorStop(
    1,
    "#ff0080"
  );

  round(
    ctx,
    x - w / 2,
    y - h / 2,
    w,
    h,
    30
  );

  ctx.fillStyle = g;

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff00d4";

  ctx.fill();

  round(
    ctx,
    x - w / 2 + 5,
    y - h / 2 + 5,
    w - 10,
    h - 10,
    26
  );

  ctx.fillStyle = "#15151d";
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    "bold 28px Arial";

  ctx.fillStyle = "#ffffff";

  ctx.shadowBlur = 8;
  ctx.shadowColor = "#ffffff";

  ctx.fillText(
    `♥ ${name} ♥`,
    x,
    y
  );

  ctx.restore();
}

// =====================================================
//                         STAR
// =====================================================

function star(ctx, x, y, r, color) {
  ctx.save();

  ctx.fillStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;

  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const a =
      -Math.PI / 2 +
      i * Math.PI / 5;

    const rr =
      i % 2 === 0
        ? r
        : r * .42;

    const px =
      x + Math.cos(a) * rr;

    const py =
      y + Math.sin(a) * rr;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// =====================================================
//                         GLOW
// =====================================================

function glow(ctx, x, y, color, r) {
  const g =
    ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      r
    );

  g.addColorStop(
    0,
    color
  );

  g.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.save();

  ctx.globalAlpha = .13;
  ctx.fillStyle = g;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    r,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}