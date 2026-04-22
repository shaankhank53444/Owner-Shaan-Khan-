const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3", 
  version: "1.6.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "MP3 Downloader with Auto-Delete Search Message",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Song ka naam likhen.", threadID, messageID);
  }

  // 1. Search message bhejna aur ID save karna taaki baad mein delete ho sake
  const waitingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
  const API_URL = `https://uzair-new-music-api.onrender.com/download/dlmp3?q=${encodeURIComponent(query)}`;

  try {
    const res = await axios.get(API_URL);
    const data = res.data;

    const downloadUrl = data.downloadUrl || data.link || data.url;
    if (!downloadUrl) throw new Error("Audio link nahi mila.");

    const songTitle = data.title || "Unknown Song";

    // 2. MP3 Download Process
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // 3. Search message ko delete (unsend) karna
      try {
        await api.unsendMessage(waitingMsg.messageID);
      } catch (e) { console.log("Message already deleted or error") }

      // 4. Title aur Signature ke sath MP3 bhejna
      api.sendMessage({
        body: `🎵 Title: ${songTitle}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    // Error ki surat mein message delete kar dena aur error show karna
    api.unsendMessage(waitingMsg.messageID);
    api.sendMessage(`⚠️ Error: ${error.message}`, threadID, messageID);
  }
};
