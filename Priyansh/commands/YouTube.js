const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "YouTube", // Ensure your file is named music.js
  version: "1.1.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Audio & Video Downloader with Custom Message",
  commandCategory: "media",
  usages: "music <song> | music <song> video",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length) {
    return api.sendMessage("❌ Song ka naam likho.", threadID, messageID);
  }

  api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, (err, info) => {
    // Optional: This gives feedback if the initial message fails
  }, messageID);

  const text = args.join(" ").toLowerCase();
  const isVideo = text.endsWith("video");
  const query = isVideo ? text.replace("video", "").trim() : text;

  // Create cache folder if it doesn't exist
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    // Search for the video
    const search = await axios.get(`https://api.popcat.xyz/yt/search?q=${encodeURIComponent(query)}`);
    if (!search.data || search.data.length === 0) {
      return api.sendMessage("❌ Song nahi mila.", threadID, messageID);
    }
    
    const videoUrl = search.data[0].url;
    const title = search.data[0].title;

    const apiEndpoint = isVideo ? "mp4" : "mp3";
    const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;

    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.result.download;

    const ext = isVideo ? "mp4" : "mp3";
    const filePath = path.join(cacheDir, `music_${Date.now()}.${ext}`);

    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `${isVideo ? "🎬" : "🎧"} ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete file after sending
      }, messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage("❌ File download karne mein masla hua.", threadID, messageID);
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ Server Busy hai ya API down hai. Baad mein try karein.", threadID, messageID);
  }
};
