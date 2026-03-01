const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { alldown } = require("arif-babu-downloader"); // Naya package import kiya

module.exports.config = {
  name: "autodownloader",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Auto download using arif-babu-downloader",
  commandCategory: "Events",
  usages: "send a link",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  // Supported links check
  const regex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch|instagram\.com|tiktok\.com|youtu\.be|youtube\.com|pin\.it|pinterest\.com|capcut\.com)\/[^\s]+/;
  
  const urlMatch = body.match(regex);
  if (!urlMatch) return;
  const url = urlMatch[0];

  try {
    // 📥 Reaction Start
    api.setMessageReaction("⌛", messageID, (err) => {}, true);

    // Package se data fetch karna
    const res = await alldown(url);
    if (!res || !res.data || !res.data.video) {
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        return;
    }

    const videoUrl = res.data.video;
    const title = res.data.title || "No Title";
    
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const outputPath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, Buffer.from(videoRes.data));

    const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

    api.sendMessage({
      body: caption,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      api.setMessageReaction("✅", messageID, (err) => {}, true);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    console.error("Download Error:", e.message);
  }
};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("🤖 Auto-Downloader with arif-babu-downloader is active!", event.threadID);
};
