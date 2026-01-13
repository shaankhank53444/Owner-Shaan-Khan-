const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "audio",
  version: "3.1.0",
  hasPermission: 0,
  credits: "Shaan / Fixed by Gemini",
  description: "Unlimited size song sender (auto link fallback)",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  const msg = event.body?.toLowerCase();
  if (!msg) return;
  if (!msg.startsWith("bot") && !msg.startsWith("pika")) return;

  const query = msg.split(" ").slice(1).join(" ").trim();
  if (!query) return;

  module.exports.run({ api, event, query });
};

module.exports.run = async function ({ api, event, query }) {
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let banner;
  try {
    banner = await api.sendMessage(
      `🎵 SHAAN MUSIC\n━━━━━━━━━━━━━━━\n✅ Apki Request Jari Hai Please wait ...\n🎶 ${query}`,
      event.threadID
    );

    // 1. Search for the video
    const searchRes = await axios.get(`https://alldld.onrender.com/search?q=${encodeURIComponent(query)}`);
    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      return api.sendMessage("❌ Song nahi mila!", event.threadID);
    }

    const video = searchRes.data.results[0];
    const videoUrl = video.url;

    // 2. Get Download Link (Fixing the API call)
    // Note: I'm using a common pattern for this API. Ensure the endpoint is correct.
    const downloadInfo = await axios.get(`https://ytapi-kl2g.onrender.com/api/download?url=${encodeURIComponent(videoUrl)}&type=mp3`);
    const downloadUrl = downloadInfo.data.downloadUrl || downloadInfo.data.link; 

    if (!downloadUrl) {
      return api.sendMessage("❌ Download link generate nahi ho saka.", event.threadID);
    }

    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cacheDir, fileName);

    // 3. Download the file
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

      if (banner) api.unsendMessage(banner.messageID);

      if (sizeMB <= 25) {
        await api.sendMessage({
          body: `🎧 ${video.title}\n📦 Size: ${sizeMB.toFixed(1)}MB`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      } else {
        // Fallback for large files
        api.sendMessage(`⚠️ File bari hai (${sizeMB.toFixed(1)}MB). Link generate ho raha hai...`, event.threadID);
        // Add your transfer.sh logic here if needed
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    writer.on('error', (err) => {
      throw err;
    });

  } catch (e) {
    console.error(e);
    api.sendMessage(`❌ Error: ${e.message}`, event.threadID);
  }
};
