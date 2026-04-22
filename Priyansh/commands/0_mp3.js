const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "MP3 Downloader with New API Fix",
  commandCategory: "media",
  usages: "[song name/link]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Song ka naam ya YouTube link likhen.", threadID, messageID);
  }

  // 1. Search Start Message
  api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);
  
  // FIXED API URL: Yahan aapki nayi API link set kar di hai
  const NEW_API = "https://uzair-new-music-api.onrender.com/download/dlmp3";
  const apiUrl = `${NEW_API}?q=${encodeURIComponent(query)}`;

  try {
    const res = await axios.get(apiUrl);
    const data = res.data;

    // API response check (Mapping links)
    const downloadUrl = data.downloadUrl || data.link || data.url || data.audio;
    if (!downloadUrl) throw new Error("Audio link nahi mil saka.");

    const title = data.title || "Unknown Title";

    // 2. Pehle Info bhejega (Fancy Body Text)
    const infoMsg = `╭━━━[ 🎵 AUDIO INFO ]━━━╮\n` +
                    `┃ 📌 Title: ${title}\n` +
                    `┃ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n` +
                    `┃ 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await api.sendMessage(infoMsg, threadID);

    // 3. Audio Stream Download
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      // 4. Bina reply ke MP3 file send karna
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`⚠️ Error: API server busy hai ya link invalid hai.\n${error.message}`, threadID, messageID);
  }
};
