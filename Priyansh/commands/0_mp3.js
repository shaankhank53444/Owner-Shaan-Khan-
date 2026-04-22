const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Uzair Rajput",
  description: "MP3 Downloader with Auto-Send",
  commandCategory: "media",
  usages: "[song name/link]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Please provide a song name or YouTube link.", threadID, messageID);
  }

  // Search start message
  api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);
  const API_URL = `https://uzair-rajput-mtx-api.onrender.com/download/dlmp3?q=${encodeURIComponent(query)}`;

  try {
    const res = await axios.get(API_URL);
    const data = res.data;

    const downloadUrl = data.downloadUrl || data.url || data.link || data.audio;
    if (!downloadUrl) throw new Error("Audio link missing!");

    const title = data.title || "Unknown Title";

    // 1. Pehle Title wala text message bhejega
    const infoMsg = `╭━━━[ 🎵 AUDIO INFO ]━━━╮\n` +
                    `┃ 📌 Title: ${title}\n` +
                    `┃ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n` +
                    `┃ 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await api.sendMessage(infoMsg, threadID);

    // 2. Audio file download karna
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      // 3. Phir bina reply ke MP3 file bhejega
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`⚠️ Error: ${error.message}`, threadID, messageID);
  }
};
