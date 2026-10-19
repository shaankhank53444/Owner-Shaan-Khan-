const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const { createCanvas, loadImage } = require("canvas");

/* ================= CONFIG ================= */

const FALLBACK_GRAPH_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

module.exports.config = {
  name: "mp3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download music with custom Polaroid & Neon User DP collage",
  commandCategory: "MEDIA",
  usages: "song [music name or YouTube URL]",
  cooldowns: 5
};

/* ================= SAFE HELPERS ================= */

function safeReact(api, messageID, emoji) {
  try {
    if (api && typeof api.setMessageReaction === "function") {
      api.setMessageReaction(emoji, messageID, () => {}, true);
    }
  } catch (e) {}
}

/* ================= MAIN RUN ================= */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = (args || []).join(" ").trim();

  if (!query) {
    return api.sendMessage(
      "❌ Please enter a music name or YouTube URL.\n\nExample: #song Believer",
      threadID,
      messageID
    );
  }

  /* ⚠️ Replace with your real API key */
  const API_KEY = "API-KYE";

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const uniqueId = Date.now();
  const mp3Path = path.join(cacheDir, `music_${uniqueId}.mp3`);
  const finalImagePath = path.join(cacheDir, `dp_${uniqueId}.png`);

  try {
    safeReact(api, messageID, "⌛");

    /* ---------- 1. Search YouTube ---------- */
    const searchResult = await ytSearch(query);
    const music = searchResult?.videos?.[0];
    if (!music) throw new Error("Music not found.");

    const thumbnailUrl =
      music.thumbnail || `https://i.ytimg.com/vi/${music.videoId}/hqdefault.jpg`;

    /* ---------- 2. Get User Info ---------- */
    const usersInfo = await api.getUserInfo(senderID);
    const userName = usersInfo[senderID]?.name || "User Name";

    /* ---------- 3. Canvas Setup ---------- */
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext("2d");

    // White Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1000, 1000);

    const graphToken =
      global.config?.facebookToken &&
      global.config.facebookToken.trim().length > 0
        ? global.config.facebookToken.trim()
        : FALLBACK_GRAPH_TOKEN;

    const userDpUrl = `https://graph.facebook.com/${senderID}/picture?height=720&width=720&access_token=${graphToken}`;

    // Load Images
    const [userImg, songImg] = await Promise.all([
      loadImage(userDpUrl).catch(() =>
        loadImage("https://i.imgur.com/6ve9Y86.png")
      ),
      loadImage(thumbnailUrl).catch(() =>
        loadImage("https://i.imgur.com/6ve9Y86.png")
      )
    ]);

    /* ---------- Decorative Hearts (Top Left) ---------- */
    ctx.fillStyle = "#ccc";
    ctx.font = "80px serif";
    ctx.fillText("🎧", 50, 100);
    ctx.font = "50px serif";
    ctx.fillText("♥️", 30, 160);

    /* ---------- Right Side: Large Frame (User Image) ---------- */
    ctx.save();
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#000";
    ctx.strokeRect(535, 185, 400, 570);
    ctx.drawImage(userImg, 550, 200, 370, 540);

    // Vertical Name Text
    ctx.translate(970, 600);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#000";
    ctx.font = "italic 40px serif";
    ctx.fillText(userName, 0, 0);
    ctx.restore();

    /* ---------- Left Top: User Name Box ---------- */
    ctx.fillStyle = "#e0e0e0";
    const bx = 50,
      by = 210,
      bw = 300,
      bh = 80,
      br = 15;
    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.lineTo(bx + bw - br, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
    ctx.lineTo(bx + bw, by + bh - br);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
    ctx.lineTo(bx + br, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
    ctx.lineTo(bx, by + br);
    ctx.quadraticCurveTo(bx, by, bx + br, by);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(userName, bx + bw / 2, by + bh / 2);
    ctx.textAlign = "left";

    // Tagline
    ctx.font = "40px serif";
    ctx.fillStyle = "#000";
    ctx.fillText("Song Jindagi.", 150, 350);

    /* ---------- Middle: Song Title Box ---------- */
    ctx.fillStyle = "#e0e0e0";
    const sx = 110,
      sy = 380,
      sw = 280,
      sh = 80;
    ctx.beginPath();
    ctx.moveTo(sx + br, sy);
    ctx.lineTo(sx + sw - br, sy);
    ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + br);
    ctx.lineTo(sx + sw, sy + sh - br);
    ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - br, sy + sh);
    ctx.lineTo(sx + br, sy + sh);
    ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - br);
    ctx.lineTo(sx, sy + br);
    ctx.quadraticCurveTo(sx, sy, sx + br, sy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    const songTitleShort =
      music.title.length > 18 ? music.title.substring(0, 18) + "..." : music.title;
    ctx.fillText(songTitleShort, sx + sw / 2, sy + sh / 2);
    ctx.textAlign = "left";

    /* ---------- Left Bottom: Polaroid (Song Image) ---------- */
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.fillStyle = "#fefefe";
    ctx.fillRect(60, 550, 300, 400);
    ctx.drawImage(songImg, 80, 570, 260, 260);

    // Music UI
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText("0:52", 80, 855);
    ctx.fillText(music.timestamp || "3:45", 295, 855);
    ctx.fillRect(80, 865, 220, 3);
    ctx.font = "24px serif";
    ctx.fillText("✶  ♡  ✶", 145, 915);

    // Crown on Polaroid
    ctx.font = "60px serif";
    ctx.fillText("👑", 290, 560);
    ctx.restore();

    /* ---------- Crown on User DP ---------- */
    ctx.font = "50px serif";
    ctx.fillText("👑", 605, 140);

    /* ---------- Center Hearts ---------- */
    ctx.fillStyle = "#ccc";
    ctx.font = "50px serif";
    ctx.fillText("♥️", 465, 250);
    ctx.fillText("♥️", 465, 330);
    ctx.fillText("♥️", 465, 410);

    /* ---------- Bottom Decorations ---------- */
    ctx.fillStyle = "#000";
    ctx.font = "italic 55px serif";
    ctx.fillText("", 480, 900);
    ctx.fillText("", 480, 965);
    ctx.font = "60px serif";
    ctx.fillText("🌸", 780, 875);

    /* ---------- Save Collage ---------- */
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(finalImagePath, buffer);

    /* ---------- 4. Audio Download ---------- */
    const response = await axios.post(
      "https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download",
      { url: music.url, format: "mp3", quality: "128" },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const downloadUrl = response.data?.data?.downloadUrl;
    if (!downloadUrl) throw new Error("Could not get download link.");

    const audioRes = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(mp3Path);
    audioRes.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    /* ---------- 5. Send Results ---------- */
    await api.sendMessage(
      {
        body: `🎵 Song: ${music.title}\n👤 ${userName}`,
        attachment: fs.createReadStream(finalImagePath)
      },
      threadID,
      messageID
    );

    await api.sendMessage(
      {
        body: `🎶 Audio is ready!`,
        attachment: fs.createReadStream(mp3Path)
      },
      threadID,
      (err) => {
        if (!err) safeReact(api, messageID, "✅");
      },
      messageID
    );
  } catch (error) {
    console.error("[SONG ERROR]", error);
    safeReact(api, messageID, "❌");
    return api.sendMessage(
      `❌ Error: ${error.message}`,
      threadID,
      messageID
    );
  } finally {
    setTimeout(() => {
      if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
      if (fs.existsSync(finalImagePath)) fs.unlinkSync(finalImagePath);
    }, 30000);
  }
};