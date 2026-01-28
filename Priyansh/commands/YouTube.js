const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "youtube", // Bot ab isse detect karega
  version: "1.1.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Audio & Video Downloader with Custom Message",
  commandCategory: "media",
  usages: "youtube <song> | youtube <song> video",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args.length) return api.sendMessage("Song ka naam likho.", threadID, messageID);

  api.sendMessage("✅ Apki Request Jari Hai Please wait..", threadID, messageID);

  const text = args.join(" ").toLowerCase();
  const isVideo = text.endsWith("video");
  const query = isVideo ? text.replace("video", "").trim() : text;

  try {
    // Apki purani logic: Popcat search
    const search = await axios.get(`https://api.popcat.xyz/yt/search?q=${encodeURIComponent(query)}`);
    const videoUrl = search.data[0].url;

    // Apki purani logic: Anabot API
    const apiEndpoint = isVideo ? "mp4" : "mp3";
    const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;

    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.result.download;

    const ext = isVideo ? "mp4" : "mp3";
    // Mirai compatible path
    const filePath = path.join(__dirname, "cache", `${Date.now()}.${ext}`);

    // Cache folder check taake error na aaye
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }

    const stream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    stream.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `${isVideo ? "🎬" : "🎧"} ${res.data.result.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // File bhejne ke baad delete karna zaroori hai memory ke liye
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on("error", () => {
      api.sendMessage("File download karne mein masla hua.", threadID, messageID);
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("Kuch ghalti ho gayi, baad me try karo.", threadID, messageID);
  }
};
