const fs = require("fs-extra");
const axios = require("axios");
const {
  createCanvas,
  loadImage
} = require("canvas");

module.exports.config = {
  name: "friend",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Premium 1 Square + 2 Round DP RGB Design",
  usePrefix: true,
  commandCategory: "FRIEND",
  usages: "[reply | mention | random]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    canvas: ""
  }
};

// ======================================================
//                    MAIN FUNCTION
// ======================================================

module.exports.run = async function ({
  api,
  event,
  Users
}) {

  const cache = __dirname + "/cache/";

  if (!fs.existsSync(cache)) {
    fs.mkdirSync(cache, {
      recursive: true
    });
  }

  const outPath =
    cache +
    `friend2_${Date.now()}_${Math.floor(Math.random() * 99999)}.png`;

  try {

    // ==================================================
    // USER 1 (Command Sender)
    // ==================================================

    const id1 = String(event.senderID);

    // ==================================================
    // MENTIONS
    // ==================================================

    const mentionedIDs =
      event.mentions
        ? Object.keys(event.mentions)
            .map(String)
            .filter(id => id !== id1)
        : [];

    let id2 = null;
    let id3 = null;

    // ==================================================
    // REPLY MODE
    // ==================================================

    if (
      event.messageReply &&
      event.messageReply.senderID
    ) {

      const replyID =
        String(
          event.messageReply.senderID
        );

      if (
        replyID !== id1 &&
        replyID !== String(api.getCurrentUserID())
      ) {
        id2 = replyID;
      }

      if (mentionedIDs.length > 0) {

        id3 =
          mentionedIDs.find(
            id =>
              id !== id2 &&
              id !== id1
          ) || null;
      }
    }

    // ==================================================
    // MENTION MODE
    // ==================================================

    if (!id2 && mentionedIDs.length > 0) {

      id2 = mentionedIDs[0];

      if (mentionedIDs.length > 1) {
        id3 = mentionedIDs[1];
      }
    }

    // ==================================================
    // GET GROUP MEMBERS
    // ==================================================

    let members = [];

    if (!id2 || !id3) {

      try {

        const info =
          await api.getThreadInfo(
            event.threadID
          );

        const botID =
          String(
            api.getCurrentUserID()
          );

        members =
          (info.participantIDs || [])
            .map(String)
            .filter(id =>
              id !== id1 &&
              id !== botID
            );

      } catch (e) {

        console.log(
          "FRIEND2 THREAD ERROR:",
          e.message
        );

      }
    }

    // ==================================================
    // RANDOM USER 2
    // ==================================================

    if (!id2) {

      const available =
        members.filter(
          id => id !== id3
        );

      if (!available.length) {

        return api.sendMessage(
          "❌ Doosra user nahi mila.",
          event.threadID,
          event.messageID
        );

      }

      id2 =
        available[
          Math.floor(
            Math.random() *
            available.length
          )
        ];
    }

    // ==================================================
    // RANDOM USER 3
    // ==================================================

    if (!id3) {

      const available =
        members.filter(
          id =>
            id !== id1 &&
            id !== id2
        );

      if (!available.length) {

        return api.sendMessage(
          "❌ 3 DP banane ke liye group mein kam se kam 3 alag members chahiye.",
          event.threadID,
          event.messageID
        );

      }

      id3 =
        available[
          Math.floor(
            Math.random() *
            available.length
          )
        ];
    }

    // ==================================================
    // SAFETY CHECK
    // ==================================================

    if (
      !id1 ||
      !id2 ||
      !id3 ||
      id1 === id2 ||
      id1 === id3 ||
      id2 === id3
    ) {

      return api.sendMessage(
        "❌ 3 alag users select nahi ho paaye. Dobara try karein.",
        event.threadID,
        event.messageID
      );

    }

    // ==================================================
    // NAMES
    // ==================================================

    const name1 = await getUserName(Users, id1);
    const name2 = await getUserName(Users, id2);
    const name3 = await getUserName(Users, id3);

    // ==================================================
    // FACEBOOK TOKEN & URLs
    // ==================================================

    const token =
      "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    // Fixed Center Image (Middle Square Pic)
    const centerFixedPicURL = "https://i.imgur.com/8QjZpB3.jpg";

    // Left Circle (Matched/Mentioned Person DP)
    const avatarURL2 =
      `https://graph.facebook.com/${id2}/picture` +
      `?width=1000&height=1000&access_token=${token}`;

    // Right Circle (Sender DP)
    const avatarURL3 =
      `https://graph.facebook.com/${id1}/picture` +
      `?width=1000&height=1000&access_token=${token}`;

    // ==================================================
    // DOWNLOAD ALL DP
    // ==================================================

    let avatar1, avatar2, avatar3;

    try {

      const images =
        await Promise.all([
          downloadImage(centerFixedPicURL),
          downloadImage(avatarURL2),
          downloadImage(avatarURL3)
        ]);

      avatar1 = await loadImage(images[0]);
      avatar2 = await loadImage(images[1]);
      avatar3 = await loadImage(images[2]);

    } catch (error) {

      console.log(
        "FRIEND2 AVATAR ERROR:",
        error.message
      );

      return api.sendMessage(
        "❌ DP load nahi ho paayi. Dobara try karein.",
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // CANVAS
    // ==================================================

    const W = 962;
    const H = 1536;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // ==================================================
    // BACKGROUND
    // ==================================================

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.35, "#fff5fc");
    bg.addColorStop(0.65, "#fffafd");
    bg.addColorStop(1, "#ffffff");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ==================================================
    // BACKGROUND GLOWS
    // ==================================================

    drawGlow(ctx, 100, 560, 330, "#ff00c8", 0.15);
    drawGlow(ctx, W / 2, 720, 430, "#ff00d4", 0.10);
    drawGlow(ctx, W - 100, 560, 330, "#00c8ff", 0.14);

    // ==================================================
    // OUTER RGB BORDER
    // ==================================================

    drawOuterBorder(ctx, W, H);

    // ==================================================
    // CORNER HEARTS
    // ==================================================

    drawHeart(ctx, 70, 105, 28, "#ff0080");
    drawHeart(ctx, W - 70, 105, 28, "#ff0080");
    drawHeart(ctx, 72, H - 110, 28, "#ff0080");
    drawHeart(ctx, W - 72, H - 110, 28, "#ff0080");

    // ==================================================
    // TOP LEAVES & CAPSULES
    // ==================================================

    drawTopLeaves(ctx, 100, 155, 1);
    drawTopLeaves(ctx, W - 100, 155, -1);

    drawCapsule(ctx, 270, 135, -0.35);
    drawCapsule(ctx, W - 270, 135, 0.35);

    // ==================================================
    // CROWN & TITLE
    // ==================================================

    drawCrown(ctx, W / 2, 48);
    drawTitle(ctx, W / 2, 150, "Shaan Khan");
    drawTitleLine(ctx, W / 2, 205);
    drawHeart(ctx, W / 2, 230, 23, "#ff00c8");

    // ==================================================
    // FLOWER GARDENS
    // ==================================================

    drawFlowerGarden(ctx, 85, 450, 1);
    drawFlowerGarden(ctx, W - 85, 450, -1);

    // ==================================================
    // DP POSITIONS
    // ==================================================

    const squareSize = 440;
    const squareX = (W - squareSize) / 2;
    const squareY = 405;

    const roundRadius = 130;
    const leftX = 165;
    const rightX = W - 165;
    const roundY = 635;

    // CENTER SQUARE DP (Fixed Baby Image)
    drawSquareDP(ctx, avatar1, squareX, squareY, squareSize);

    // LEFT ROUND DP (Matched/Mentioned Person)
    drawRoundDP(ctx, avatar2, leftX, roundY, roundRadius, 0);

    // RIGHT ROUND DP (Sender / Command User)
    drawRoundDP(ctx, avatar3, rightX, roundY, roundRadius, 1);

    // ==================================================
    // HEARTS & FLOWERS AROUND DPs
    // ==================================================

    drawHeart(ctx, 355, 610, 30, "#ff0080");
    drawHeart(ctx, W - 355, 610, 30, "#00bfff");
    drawHeart(ctx, W / 2, 880, 32, "#ff00d4");

    drawFlower(ctx, squareX - 12, squareY + squareSize - 30, 42, "#ff1744");
    drawFlower(ctx, squareX + squareSize + 12, squareY + squareSize - 30, 42, "#ff1744");
    drawFlower(ctx, squareX - 24, squareY + squareSize - 105, 31, "#1677ff");
    drawFlower(ctx, squareX + squareSize + 24, squareY + squareSize - 105, 31, "#1677ff");

    drawLeaf(ctx, squareX - 30, squareY + squareSize - 75, 1, 1.15);
    drawLeaf(ctx, squareX + squareSize + 30, squareY + squareSize - 75, -1, 1.15);

    // ==================================================
    // NAMES
    // ==================================================

    drawSmallName(ctx, leftX, 810, name2);
    drawSmallName(ctx, rightX, 810, name1);

    // ==================================================
    // BOTTOM PREMIUM BARS & FLOWERS
    // ==================================================

    drawBottomBar(ctx, W / 2, 1125, 720, 105);
    drawBottomFlowers(ctx, 135, 1275, 1);
    drawBottomFlowers(ctx, W - 135, 1275, -1);

    // ==================================================
    // FOOTER
    // ==================================================

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#222222";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(255,0,212,0.35)";
    ctx.fillText("♥ MADE WITH LOVE ♥", W / 2, 1405);

    ctx.font = "bold 18px Arial";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#777777";
    ctx.fillText("SHAAN KHAN", W / 2, 1440);
    ctx.restore();

    // ==================================================
    // SAVE & SEND
    // ==================================================

    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

    return api.sendMessage(
      {
        body: "",
        mentions: [
          { id: id1, tag: name1 },
          { id: id2, tag: name2 }
        ],
        attachment: fs.createReadStream(outPath)
      },
      event.threadID,
      function () {
        try {
          if (fs.existsSync(outPath)) {
            fs.unlinkSync(outPath);
          }
        } catch (e) {
          console.log("FRIEND2 CLEAN ERROR:", e.message);
        }
      },
      event.messageID
    );

  } catch (error) {
    console.log("FRIEND2 MAIN ERROR:", error);
    try {
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
      }
    } catch (e) {}

    return api.sendMessage(
      "❌ Friend2 DP banate waqt error aa gaya. Dobara try karein.",
      event.threadID,
      event.messageID
    );
  }
};

// ======================================================
// HELPER DRAWING FUNCTIONS
// ======================================================

async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 25000,
    maxContentLength: 20 * 1024 * 1024,
    validateStatus: status => status >= 200 && status < 300
  });
  return Buffer.from(response.data);
}

async function getUserName(Users, id) {
  try {
    const name = await Users.getNameUser(String(id));
    return name || "Facebook User";
  } catch (e) {
    return "Facebook User";
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function hexToRGB(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function drawOuterBorder(ctx, W, H) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#ff0080");
  g.addColorStop(0.15, "#7b00ff");
  g.addColorStop(0.30, "#00c8ff");
  g.addColorStop(0.48, "#00ff80");
  g.addColorStop(0.65, "#fff000");
  g.addColorStop(0.82, "#ff6500");
  g.addColorStop(1, "#ff00d4");

  ctx.shadowBlur = 22;
  ctx.shadowColor = "#ff00d4";
  ctx.strokeStyle = g;
  ctx.lineWidth = 12;
  roundRect(ctx, 25, 25, W - 50, H - 50, 42);
  ctx.stroke();

  ctx.shadowBlur = 7;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#222222";
  roundRect(ctx, 42, 42, W - 84, H - 84, 34);
  ctx.stroke();
  ctx.restore();
}

function drawGlow(ctx, x, y, radius, color, alpha) {
  const rgb = hexToRGB(color);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
  gradient.addColorStop(0.55, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.35})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
  ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
  ctx.fill();
  ctx.restore();
}

function drawCrown(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "#ffb700";
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 20);
  ctx.lineTo(x - 40, y - 20);
  ctx.lineTo(x - 15, y);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 15, y);
  ctx.lineTo(x + 40, y - 20);
  ctx.lineTo(x + 30, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTitle(ctx, x, y, text) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 45px Arial";
  ctx.fillStyle = "#ff0080";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(255,0,128,0.5)";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTitleLine(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "#ff00c8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 150, y);
  ctx.lineTo(x + 150, y);
  ctx.stroke();
  ctx.restore();
}

function drawTopLeaves(ctx, x, y, scale) {
  ctx.save();
  ctx.fillStyle = "#00e676";
  ctx.beginPath();
  ctx.ellipse(x, y, 20 * scale, 8, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCapsule(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#ff0080";
  roundRect(ctx, -25, -8, 50, 16, 8);
  ctx.fill();
  ctx.restore();
}

function drawFlowerGarden(ctx, x, y, scale) {
  drawFlower(ctx, x, y, 25, "#ff0080");
  drawFlower(ctx, x + 30 * scale, y + 20, 20, "#00c8ff");
}

function drawFlower(ctx, x, y, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    const px = x + Math.cos(angle) * (radius / 2);
    const py = y + Math.sin(angle) * (radius / 2);
    ctx.beginPath();
    ctx.arc(px, py, radius / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.arc(x, y, radius / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx, x, y, dir, scale) {
  ctx.save();
  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.ellipse(x, y, 25 * scale, 10 * scale, dir * (Math.PI / 6), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSquareDP(ctx, img, x, y, size) {
  ctx.save();
  ctx.shadowBlur = 35;
  ctx.shadowColor = "#ff00d4";
  ctx.fillStyle = "rgba(255,0,212,0.18)";
  roundRect(ctx, x - 12, y - 12, size + 24, size + 24, 30);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255,0,212,0.55)";
  roundRect(ctx, x - 16, y - 16, size + 32, size + 32, 30);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, size, size, 18);
  ctx.clip();

  const source = Math.min(img.width, img.height);
  const sx = (img.width - source) / 2;
  const sy = (img.height - source) / 2;
  ctx.drawImage(img, sx, sy, source, source, x, y, size, size);
  ctx.restore();

  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, "#ff0080");
  g.addColorStop(0.5, "#00c8ff");
  g.addColorStop(1, "#ff00d4");

  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = 6;
  roundRect(ctx, x, y, size, size, 18);
  ctx.stroke();
  ctx.restore();
}

function drawRoundDP(ctx, img, x, y, radius, mode) {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = mode === 0 ? "#ff0080" : "#00c8ff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  const source = Math.min(img.width, img.height);
  const sx = (img.width - source) / 2;
  const sy = (img.height - source) / 2;
  ctx.drawImage(img, sx, sy, source, source, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = mode === 0 ? "#ff0080" : "#00c8ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSmallName(ctx, x, y, name) {
  ctx.save();
  ctx.fillStyle = "#000000";
  roundRect(ctx, x - 110, y - 20, 220, 40, 20);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("♥ " + name + " ♥", x, y);
  ctx.restore();
}

function drawBottomBar(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#000000";
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 25);
  ctx.fill();
  ctx.restore();
}

function drawBottomFlowers(ctx, x, y, scale) {
  drawFlower(ctx, x, y, 30, "#ff0080");
  drawFlower(ctx, x + 40 * scale, y, 20, "#00c8ff");
}
