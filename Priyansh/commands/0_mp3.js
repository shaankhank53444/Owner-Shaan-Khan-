const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3", 
  version: "1.9.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Super Fast MP3 Downloader by Shaan Khan",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Song name likhen.", threadID, messageID);

  // 1. Search Message (Isse baad mein delete karenge)
  const waitingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
  
  const API_URL = `https://uzair-new-music-api.onrender.com/download/dlmp3?q=${encodeURIComponent(query)}`;

  try {
    // API Call
    const res = await axios.get(API_URL);
    const { downloadUrl, link, url, title } = res.data;
    const finalUrl = downloadUrl || link || url;

    if (!finalUrl) throw new Error("Link nahi mil saka.");

    // 2. Download Audio
    const response = await axios({
      method: 'get',
      url: finalUrl,
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // 3. Pehle Search message ko delete karein
      api.unsendMessage(waitingMsg.messageID).catch(e => {});

      // 4. PEHLA MESSAGE: Sirf Title aur Signature (Bina Reply ke)
      const textMsg = `🎵 Title: ${title || "Unknown"}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC`;
      
      await api.sendMessage(textMsg, threadID);

      // 5. DOOSRA MESSAGE: Sirf MP3 File (Bina Reply ke)
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    api.unsendMessage(waitingMsg.messageID).catch(e => {});
    api.sendMessage(`⚠️ Error: ${error.message}`, threadID, messageID);
  }
};
