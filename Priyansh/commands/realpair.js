const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

/* ================= CONFIG ================= */

module.exports.config = {
  name: "realpair",
  version: "4.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Realistic Hubby Wife Emoji Pair DP Generator",
  commandCategory: "IMAGE",
  usages: "realpair [@mention / reply]",
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

  const outPath = path.join(cacheDir, `real_emoji_dp_${Date.now()}.png`);

  try {
    let id1 = senderID;
    let id2;

    /* ---------- Partner Selection ---------- */
    if (messageReply && messageReply.senderID) {
      id2 = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      id2 = Object.keys(mentions)[0];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const senderInfo = await api.getUserInfo(senderID);
      const senderGender = normalizeGender(senderInfo[senderID].gender);
      const targetGender = senderGender === "FEMALE" ? "MALE" : "FEMALE";

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
          return api.sendMessage(
            "❌ Pair banane ke liye koi partner nahi mila!",
            threadID,
            messageID
          );
        id2 = allMembers[Math.floor(Math.random() * allMembers.length)];
      } else {
        const randomPick =
          potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
        id2 = randomPick.id || randomPick.userID;
      }
    }

    if (!id2 || id2 === senderID)
      return api.sendMessage(
        "❌ Pair banane ke liye koi partner nahi mila!",
        threadID,
        messageID
      );

    api.sendMessage(
      "⏳ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭... 𝐂𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐲𝐨𝐮𝐫 𝐑𝐞𝐚𝐥𝐢𝐬𝐭𝐢𝐜 𝐄𝐦𝐨𝐣𝐢 𝐃𝐏!",
      threadID,
      messageID
    );

    const info1 = await api.getUserInfo(id1);
    const info2 = await api.getUserInfo(id2);

    /* ---------- Gender Based Hubby/Wife ---------- */
    let hubbyID, wifeID;
    const g1 = normalizeGender(info1[id1].gender);
    if (g1 === "FEMALE") {
      wifeID = id1;
      hubbyID = id2;
    } else {
      hubbyID = id1;
      wifeID = id2;
    }

    const graphToken =
      global.config?.facebookToken &&
      global.config.facebookToken.trim().length > 0
        ? global.config.facebookToken.trim()
        : FALLBACK_GRAPH_TOKEN;

    /* ---------- Get Twemoji PNG ---------- */
    const getEmoji = async (emoji) => {
      const code = emoji.codePointAt(0).toString(16);
      const url = `https://abs.twimg.com/emoji/v2/72x72/${code}.png`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      return await loadImage(Buffer.from(res.data));
    };

    const [resH, resW, emoButterfly, emoPleading, emoHeart] = await Promise.all([
      axios.get(
        `https://graph.facebook.com/${hubbyID}/picture?width=1000&height=1000&access_token=${graphToken}`,
        { responseType: "arraybuffer" }
      ),
      axios.get(
        `https://graph.facebook.com/${wifeID}/picture?width=1000&height=1000&access_token=${graphToken}`,
        { responseType: "arraybuffer" }
      ),
      getEmoji("🦋"),
      getEmoji("🥺"),
      getEmoji("💖")
    ]);

    const imgH = await loadImage(Buffer.from(resH.data));
    const imgW = await loadImage(Buffer.from(resW.data));

    /* ---------- Canvas (1000x1000) ---------- */
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext("2d");

    // 1. White BG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1000, 1000);

    // 2. Frame Drawer
    const drawFrame = (img, x, y, size) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 15;
      ctx.shadowOffsetY = 15;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 20, y - 20, size + 40, size + 40);
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };

    // 3. Draw Photos
    drawFrame(imgH, 100, 120, 380); // Hubby (top-left)
    drawFrame(imgW, 520, 500, 380); // Wife (bottom-right)

    // 4. Stylish Text
    ctx.fillStyle = "#2c3e50";
    ctx.font = "italic bold 80px Georgia, serif";
    ctx.fillText("Hubby", 550, 350);

    ctx.font = "italic bold 80px Georgia, serif";
    ctx.fillText("Wife", 180, 800);

    // 5. Emojis
    ctx.drawImage(emoButterfly, 820, 100, 100, 100); // Top Right
    ctx.drawImage(emoButterfly, 80, 820, 100, 100); // Bottom Left
    ctx.drawImage(emoPleading, 450, 450, 120, 120); // Center

    // Small Hearts
    const heartSpots = [
      [410, 420],
      [580, 560],
      [900, 450],
      [50, 450],
      [480, 80]
    ];
    heartSpots.forEach((pos) => {
      ctx.drawImage(emoHeart, pos[0], pos[1], 40, 40);
    });

    /* ---------- Send ---------- */
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, buffer);

    return api.sendMessage(
      {
        body: `✨ 𝐑𝐞𝐚𝐥𝐢𝐬𝐭𝐢𝐜 𝐏𝐚𝐢𝐫 𝐃𝐏 ✨\n\n🤵 Hubby: ${info1[hubbyID]?.name || "User"}\n👰 Wife: ${info2[wifeID]?.name || "User"}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      },
      messageID
    );
  } catch (error) {
    if (global.logger) global.logger.error(`Error in realpair command: ${error.message}`);
    else console.error(`Error in realpair command: ${error.message}`);

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    return api.sendMessage(
      "❌ Error: Profile picture fetch nahi ho payi ya server busy hai.",
      threadID,
      messageID
    );
  }
};