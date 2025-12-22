const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "autoYoutube",
  version: "1.0.0",
  credits: "SHAAN KHAN",
  description: "Auto YouTube Downloader (Mirai Event)",
  eventType: ["message"]
};

module.exports.run = async function ({ api, event }) {
  try {
    const { body, threadID, senderID } = event;
    if (!body) return;

    // Bot khud ko ignore kare
    if (senderID === api.getCurrentUserID()) return;

    // YouTube link detect
    const ytRegex =
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[^\s]+/i;

    const match = body.match(ytRegex);
    if (!match) return;

    const youtubeUrl = match[0];
    const API = "https://yt-tt.onrender.com/api/youtube/video";

    const loading = await api.sendMessage(
      "🎬 YouTube link detected...\n⏳ Downloading...",
      threadID
    );

    const res = await axios.get(API, {
      params: { url: youtubeUrl },
      responseType: "arraybuffer",
      timeout: 180000
    });

    if (!res.data || res.data.length < 1000) {
      api.editMessage("❌ Video fetch failed", loading.messageID);
      return;
    }

    // Cache folder (Mirai standard)
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

    const filePath = path.join(
      cachePath,
      `yt_${Date.now()}.mp4`
    );

    fs.writeFileSync(filePath, Buffer.from(res.data));

    if (fs.statSync(filePath).size < 1000) {
      fs.unlinkSync(filePath);
      api.editMessage("❌ Invalid video file", loading.messageID);
      return;
    }

    await api.sendMessage(
      {
        body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑩𝑬 𝑽𝑰𝑫𝑬𝑶",
        attachment: fs.createReadStream(filePath)
      },
      threadID
    );

    api.unsendMessage(loading.messageID);

    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 20000);

  } catch (err) {
    console.log("AutoYoutube Error:", err.message);
  }
};