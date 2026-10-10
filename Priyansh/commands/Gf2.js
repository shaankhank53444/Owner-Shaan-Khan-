const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

/* ================= CONFIG ================= */

module.exports.config = {
  name: "gf2",
  version: "4.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Romantic Neon Couple DP Generator",
  commandCategory: "IMAGE",
  usages: "gf [@mention / reply]",
  cooldowns: 10
};

/* ================= FALLBACK TOKEN ================= */

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

  const outPath = path.join(cacheDir, `romantic_dp_${Date.now()}.png`);

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

    api.sendMessage(
      "⏳ Creating your Romantic Neon DP... Please wait!",
      threadID,
      messageID
    );

    /* ---------- 3. Download Avatars ---------- */
    const graphToken =
      global.config?.facebookToken &&
      global.config.facebookToken.trim().length > 0
        ? global.config.facebookToken.trim()
        : FALLBACK_GRAPH_TOKEN;

    const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=800&height=800&access_token=${graphToken}`;
    const avatarURL2 = `https://graph.facebook.com/${id2}/picture?width=800&height=800&access_token=${graphToken}`;

    const [res1, res2] = await Promise.all([
      axios.get(avatarURL1, { responseType: "arraybuffer" }),
      axios.get(avatarURL2, { responseType: "arraybuffer" })
    ]);

    const img1 = await loadImage(Buffer.from(res1.data));
    const img2 = await loadImage(Buffer.from(res2.data));

    /* ---------- 4. Canvas ---------- */
    const canvas = createCanvas(1200, 675);
    const ctx = canvas.getContext("2d");

    // Romantic Gradient BG
    const grad = ctx.createRadialGradient(600, 337, 100, 600, 337, 800);
    grad.addColorStop(0, "#4a001e");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 675);

    // Bokeh Dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = "rgba(255, 20, 147, 0.2)";
      ctx.beginPath();
      ctx.arc(
        Math.random() * 1200,
        Math.random() * 675,
        Math.random() * 50,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw User Function
    const drawUser = (img, x, y, name) => {
      const radius = 160;

      // Glow Border
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ffcc00";
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Profile Pic
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      // Name
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 55px Arial";
      ctx.textAlign = "center";
      ctx.fillText(name, x, y + radius + 80);
    };

    drawUser(img1, 300, 300, name1);
    drawUser(img2, 900, 300, name2);

    /* ---------- Center Heart ---------- */
    const centerX = 600;
    const centerY = 200;

    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = "#ff1493";
    ctx.fillStyle = "#ff1493";
    const d = 80;
    ctx.translate(centerX, centerY);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-d / 2, -d / 2, -d, d / 4, 0, d);
    ctx.bezierCurveTo(d, d / 4, d / 2, -d / 2, 0, 0);
    ctx.fill();
    ctx.restore();

    /* ---------- Neon "Pyar" ---------- */
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff00ff";
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic bold 80px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Pyar", 600, 480);
    ctx.restore();

    /* ---------- Bottom Quote ---------- */
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "italic 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      '"Tum ho toh sab kuch hai, tum nahi toh kuch bhi nahi..."',
      600,
      620
    );

    /* ---------- 5. Send ---------- */
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, buffer);

    return api.sendMessage(
      {
        body: `👤 ${name1} ❤️ ${name2}\n✨ "Rab Ne Bana Di Jodi"`,
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      },
      messageID
    );
  } catch (error) {
    if (global.logger) global.logger.error(`Error in gf command: ${error.message}`);
    else console.error(`Error in gf command: ${error.message}`);

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    return api.sendMessage(
      "❌ An error occurred while generating the DP.",
      threadID,
      messageID
    );
  }
};