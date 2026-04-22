const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3", 
  version: "1.8.0",
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

  // 1. Instant Search Message
  const waitingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  const filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
  if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

  try {
    // API Call (Super Fast)
    const res = await axios.get(`https://uzair-new-music-api.onrender.com/download/dlmp3?q=${encodeURIComponent(query)}`);
    const { downloadUrl, link, url, title } = res.data;
    const finalUrl = downloadUrl || link || url;

    if (!finalUrl) throw new Error("Link not found");

    // 2. High-Speed Download
    const response = await axios({
      method: 'get',
      url: finalUrl,
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // 3. Search message ko delete karna
      api.unsendMessage(waitingMsg.messageID).catch(e => {});

      // 4. Direct Send (Bina Reply ke - End to End style)
      api.sendMessage({
        body: `🎵 Title: ${title || "Unknown"}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // File delete after sending
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    api.unsendMessage(waitingMsg.messageID).catch(e => {});
    api.sendMessage(`⚠️ Error: ${error.message}`, threadID, messageID);
  }
};
