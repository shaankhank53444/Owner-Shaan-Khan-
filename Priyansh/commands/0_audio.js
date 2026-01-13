const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "audio",
  version: "3.5.0",
  hasPermission: 0,
  credits: "Shaan / Fixed by Gemini",
  description: "YT API fixed song sender",
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

  let banner;
  try {
    banner = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...: ${query}...`, event.threadID);

    // 1. Search Logic
    const searchRes = await axios.get(`https://alldld.onrender.com/search?q=${encodeURIComponent(query)}`);
    const video = searchRes.data.results?.[0];

    if (!video) {
      return api.sendMessage("❌ Song nahi mila!", event.threadID);
    }

    // 2. Get Download Link from your API
    // Humne yahan query ki jagah video.url istemal kiya hai jo zyada accurate hai
    const apiRes = await axios.get(`https://ytapi-kl2g.onrender.com/api/download?url=${encodeURIComponent(video.url)}&format=mp3`);
    
    // API aksar 'downloadUrl' ya 'link' key mein URL deti hai
    const finalDownloadUrl = apiRes.data.downloadUrl || apiRes.data.link || apiRes.data.url;

    if (!finalDownloadUrl) {
      return api.sendMessage("❌ API ne download link nahi diya. Thodi der baad try karen.", event.threadID);
    }

    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cacheDir, fileName);

    // 3. Download the actual file
    const fileRes = await axios({
      method: 'get',
      url: finalDownloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    fileRes.data.pipe(writer);

    writer.on('finish', async () => {
      const stats = fs.statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);

      if (banner) api.unsendMessage(banner.messageID);

      if (sizeMB <= 45) { // Messenger ki limit tak
        await api.sendMessage({
          body: `🎧 ${video.title}\n📦 Size: ${sizeMB.toFixed(2)} MB`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      } else {
        api.sendMessage(`⚠️ File bari hai (${sizeMB.toFixed(2)}MB). Ye raha link:\n${finalDownloadUrl}`, event.threadID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

  } catch (e) {
    console.error(e);
    if (banner) api.unsendMessage(banner.messageID);
    api.sendMessage("❌ System Error! API respond nahi kar rahi.", event.threadID);
  }
};
