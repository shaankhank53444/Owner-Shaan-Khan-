const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "autodown",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SHAAN KHAN Fix",
  description: "Detects links and downloads video using arif-babu-downloader",
  commandCategory: "Utilities",
  usages: "Tiktok, Facebook, Instagram, YouTube Links",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  // Agar message link nahi hai to ignore karein
  if (!body || !body.toLowerCase().startsWith("https://")) return;

  try {
    // Arif Babu Downloader package ko call karna
    const arif = require('arif-babu-downloader');

    // Reaction lagana processing ke liye
    api.setMessageReaction("📿", messageID, () => {}, true);

    // Link se data nikalna
    const res = await arif.all(body);

    // Check karna ki data mila ya nahi
    if (res && res.status) {
      const videoUrl = res.data.high || res.data.url;
      const title = res.data.title || "No Title";

      // Success reaction
      api.setMessageReaction("✅", messageID, () => {}, true);

      const cachePath = path.join(__dirname, 'cache', `video_${Date.now()}.mp4`);
      
      // Cache folder check karna
      if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
      }

      // Video download karna
      const videoData = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(cachePath, Buffer.from(videoData, 'utf-8'));

      // Aapka bataya hua format: Owner aur Shaan
      return api.sendMessage({
        body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        // File bhejne ke baad delete kar dena
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);
    }
  } catch (error) {
    console.error("Downloader Error:", error.message);
    // Error aane par warning reaction
    api.setMessageReaction("⚠️", messageID, () => {}, true);
  }
};

module.exports.run = async function({ api, event, args }) {
  // Mirai mein handleEvent automatic kaam karta hai
};
