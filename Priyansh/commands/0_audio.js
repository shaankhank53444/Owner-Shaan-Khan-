const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "audio",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Uzair",
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
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  try {
    const banner = await api.sendMessage(
      `🎵 SHAAN MUSIC\n━━━━━━━━━━━━━━━\n✅ Apki Request Jari Hai Please wait ...\n🎶 ${query}`,
      event.threadID
    );

    const searchRes = await axios.get(
      `https://alldld.onrender.com/search?q=${encodeURIComponent(query)}`
    );

    if (!searchRes.data.results.length) {
      return api.sendMessage("❌ Song nahi mila", event.threadID);
    }

    const video = searchRes.data.results[0];
    await api.unsendMessage(banner.messageID);

    const waitMsg = await api.sendMessage(
      "⏳ Please wait...\n⬇️ Download ho raha hai",
      event.threadID
    );

    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cacheDir, fileName);

    const downloadRes = await axios.get(
      `https://ytapi-kl2g.onrender.com`,
      {
        responseType: "arraybuffer",
        timeout: 300000
      }
    );

    fs.writeFileSync(filePath, downloadRes.data);

    const sizeMB = fs.statSync(filePath).size / (1024 * 1024);

    await api.unsendMessage(waitMsg.messageID);

    if (sizeMB <= 25) {
      await api.sendMessage(
        {
          body: `🎧 ${video.title}\n📦 Size: ${sizeMB.toFixed(1)}MB`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    } else {
      const stream = fs.createReadStream(filePath);
      const upload = await axios.post(
        `https://transfer.sh/${fileName}`,
        stream,
        { headers: { "Content-Type": "application/octet-stream" } }
      );

      fs.unlinkSync(filePath);

      await api.sendMessage(
        `🎧 ${video.title}\n📦 Size: ${sizeMB.toFixed(1)}MB\n🔗 Download Link:\n${upload.data}`,
        event.threadID
      );
    }

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ Error, thori der baad try karo", event.threadID);
  }
};