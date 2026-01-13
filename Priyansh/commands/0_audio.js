const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "audio",
  version: "3.2.0",
  hasPermission: 0,
  credits: "Shaan / Fixed by Gemini",
  description: "Unlimited size song sender (auto link fallback)",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  const msg = event.body?.toLowerCase();
  if (!msg || (!msg.startsWith("bot") && !msg.startsWith("pika"))) return;

  const query = msg.split(" ").slice(1).join(" ").trim();
  if (!query) return;

  return this.run({ api, event, query });
};

module.exports.run = async function ({ api, event, query }) {
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let bannerID;
  try {
    const banner = await api.sendMessage(
      `🎵 SHAAN MUSIC\n━━━━━━━━━━━━━━━\n✅ Apki Request Jari Hai: ${query}\n⏳ Please wait...`,
      event.threadID
    );
    bannerID = banner.messageID;

    // 1. Search Logic
    const searchRes = await axios.get(`https://alldld.onrender.com/search?q=${encodeURIComponent(query)}`);
    const video = searchRes.data.results?.[0];

    if (!video) {
      return api.sendMessage("❌ Song nahi mila!", event.threadID);
    }

    // 2. Download Logic (Fixing the missing URL)
    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cacheDir, fileName);
    
    // Yahan humne video.url pass kiya hai jo pehle missing tha
    const downloadUrl = `https://ytapi-kl2g.onrender.com/api/download?url=${encodeURIComponent(video.url)}&format=mp3`;

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const stats = fs.statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);

      if (bannerID) api.unsendMessage(bannerID);

      if (sizeMB <= 25) {
        await api.sendMessage({
          body: `🎧 ${video.title}\n📦 Size: ${sizeMB.toFixed(2)} MB`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));
      } else {
        // Agar file 25MB se badi hai
        api.sendMessage(`⚠️ File 25MB se bari hai, direct nahi bhej sakta. Link try karein.`, event.threadID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    writer.on('error', (err) => {
      console.error("Stream Error:", err);
      api.sendMessage("❌ Download failed!", event.threadID);
    });

  } catch (e) {
    console.error(e);
    if (bannerID) api.unsendMessage(bannerID);
    api.sendMessage("❌ API Error! Shayad server down hai.", event.threadID);
  }
};
