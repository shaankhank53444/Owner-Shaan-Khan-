const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

/* ================= CONFIG ================= */

module.exports.config = {
  name: "gfpair",
  version: "4.3.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Dark Neon Couple / Pair DP Generator",
  commandCategory: "IMAGE",
  usages: "gfpair [@mention / reply]",
  cooldowns: 10
};

/* ================= FALLBACK GRAPH TOKEN ================= */

const FALLBACK_GRAPH_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

/* ================= GENDER NORMALIZE ================= */

const normalizeGender = (gender) => {
  if (gender === 1 || gender === "FEMALE" || gender === "female") return "FEMALE";
  if (gender === 2 || gender === "MALE" || gender === "male") return "MALE";
  return null;
};

/* ================= MAIN RUN ================= */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const outPath = path.join(cacheDir, `dark_square_${Date.now()}.png`);

  try {
    /* ---------- 1. Sender Info ---------- */
    const senderInfo = await api.getUserInfo(senderID);
    const name1 = senderInfo[senderID].name.split(" ")[0];
    const gender1 = normalizeGender(senderInfo[senderID].gender);

    /* ---------- 2. Determine Partner ---------- */
    let id2;

    if (messageReply && messageReply.senderID) {
      id2 = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      id2 = Object.keys(mentions)[0];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const targetGender = gender1 === "FEMALE" ? "MALE" : "FEMALE";

      let potentialMatches = [];
      if (threadInfo && Array.isArray(threadInfo.userInfo)) {
        potentialMatches = threadInfo.userInfo.filter(
          (u) =>
            u.id !== senderID &&
            u.id !== global.client.botID &&
            normalizeGender(u.gender) === targetGender
        );
      }

      if (potentialMatches.length === 0) {
        const allMembers = threadInfo.participantIDs.filter(
          (id) => id !== senderID && id !== global.client.botID
        );
        if (allMembers.length === 0)
          return api.sendMessage("❌ No members found to pair with.", threadID, messageID);
        id2 = allMembers[Math.floor(Math.random() * allMembers.length)];
      } else {
        const randomPick =
          potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
        id2 = randomPick.id || randomPick.userID;
      }
    }

    if (id2 === senderID)
      return api.sendMessage("❌ You cannot pair with yourself!", threadID, messageID);

    const info2 = await api.getUserInfo(id2);
    const name2 = info2[id2].name.split(" ")[0];
    const gender2 = normalizeGender(info2[id2].gender);

    api.sendMessage(
      "⏳ Processing your Dark Neon Pair DP... Please wait!",
      threadID,
      messageID
    );

    /* ---------- 3. Download Avatars ---------- */
    const graphToken =
      global.config?.facebookToken &&
      global.config.facebookToken.trim().length > 0
        ? global.config.facebookToken.trim()
        : FALLBACK_GRAPH_TOKEN;

    const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=1000&height=1000&access_token=${graphToken}`;
    const avatarURL2 = `https://graph.facebook.com/${id2}/picture?width=1000&height=1000&access_token=${graphToken}`;

    const [res1, res2] = await Promise.all([
      axios.get(avatarURL1, { responseType: "arraybuffer" }),
      axios.get(avatarURL2, { responseType: "arraybuffer" })
    ]);

    const img1 = await loadImage(Buffer.from(res1.data));
    const img2 = await loadImage(Buffer.from(res2.data));

    /* ---------- 4. Canvas (1000x1000) ---------- */
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext("2d");

    // Deep Dark BG
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 1000, 1000);

    // Subtle Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < 1000; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1000);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1000, i);
      ctx.stroke();
    }

    /* ---------- Butterflies ---------- */
    const drawButterfly = (x, y, color, scale, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-25, -35, -50, 15, 0, 10);
      ctx.bezierCurveTo(50, 15, 25, -35, 0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-15, 5, -30, 25, 0, 20);
      ctx.bezierCurveTo(30, 25, 15, 5, 0, 5);
      ctx.fill();
      ctx.restore();
    };

    /* ---------- Hearts ---------- */
    const drawHeart = (x, y, size, color) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x, y - 3, x - 5, y - 15, x - 25, y - 15);
      ctx.bezierCurveTo(x - 55, y - 15, x - 55, y + 22.5, x - 55, y + 22.5);
      ctx.bezierCurveTo(x - 55, y + 40, x - 35, y + 62, x, y + 80);
      ctx.bezierCurveTo(x + 35, y + 62, x + 55, y + 40, x + 55, y + 22.5);
      ctx.bezierCurveTo(x + 55, y + 22.5, x + 55, y - 15, x + 25, y - 15);
      ctx.bezierCurveTo(x + 10, y - 15, x, y - 3, x, y);
      ctx.fill();
      ctx.restore();
    };

    /* ---------- Profile Draw ---------- */
    const drawProfile = (img, x, y, label, name, color) => {
      const size = 380;

      // Outer Glow
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = "white";
      ctx.fillStyle = "white";
      ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
      ctx.restore();

      // Image
      ctx.drawImage(img, x, y, size, size);

      // White Signature Bar
      ctx.fillStyle = "white";
      ctx.fillRect(x - 40, y + size - 60, size / 1.5, 60);

      // Label Text
      ctx.save();
      ctx.fillStyle = "white";
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.font = "italic bold 85px Georgia";
      ctx.textAlign = "left";

      const textY = y > 500 ? y + 80 : y + size + 100;
      const textX = x > 500 ? x - 250 : x + size + 30;
      ctx.fillText(label, textX, textY);

      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(textX, textY + 15);
      ctx.lineTo(textX + 250, textY + 15);
      ctx.stroke();
      ctx.restore();

      // Name
      ctx.fillStyle = "black";
      ctx.font = "bold 30px Arial";
      ctx.fillText(name, x - 20, y + size - 20);
    };

    /* ---------- Labels ---------- */
    let label1 = gender1 === "FEMALE" ? "Wife" : "Hubby";
    let label2 = gender2 === "MALE" ? "Hubby" : "Wife";
    if (id2 === global.client.botID) label2 = "Robot";
    if (gender1 === gender2)
      label2 = gender1 === "FEMALE" ? "Bestie" : "Brother";

    /* ---------- Draw Profiles ---------- */
    drawProfile(img1, 80, 110, label1, name1, "#ff007f");
    drawProfile(img2, 540, 480, label2, name2, "#00ccff");

    /* ---------- Decorations ---------- */
    drawButterfly(500, 350, "#ff007f", 2.0, -0.3);
    drawButterfly(900, 100, "#00ccff", 1.2, 0.5);
    drawButterfly(150, 850, "#ff007f", 1.2, -0.8);

    drawHeart(430, 100, 0.5, "#ff007f");
    drawHeart(480, 130, 0.3, "#ff007f");
    drawHeart(900, 450, 0.4, "#00ccff");
    drawHeart(940, 480, 0.2, "#00ccff");

    // Emoji Glow
    ctx.font = "80px Arial";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "yellow";
    ctx.fillText("🥺", 460, 540);

    /* ---------- 5. Send ---------- */
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, buffer);

    return api.sendMessage(
      {
        body: `👤 ${label1}: ${name1}\n♥️ ${label2}: ${name2}\n\nEnjoy your new profile design!`,
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      },
      messageID
    );
  } catch (error) {
    if (global.logger) global.logger.error(`Error in gfpair command: ${error.message}`);
    else console.error(`Error in gfpair command: ${error.message}`);

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    return api.sendMessage(
      "❌ Gomen! DP generate karne me error aaya.",
      threadID,
      messageID
    );
  }
};