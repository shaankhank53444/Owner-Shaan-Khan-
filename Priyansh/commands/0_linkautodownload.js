const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { alldown } = require("arif-babu-downloader");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.6.0",
    hasPermssion: 0,
    credits: "SMART SHAAN",
    description: "FB, YT, IG, aur TikTok auto-downloader with stylish title.",
    commandCategory: "Utilities",
    usages: "Link paste karein",
    cooldowns: 5,
  },

  run: async function ({ events, args }) {},

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body || !body.startsWith("https://")) return;

    // Supported Platforms Regex
    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg)/ig;
    const igRegex = /(instagram\.com)/ig;
    const ytRegex = /(youtube\.com|youtu\.be)/ig;
    const ttRegex = /(tiktok\.com)/ig;

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body)) {
      
      api.setMessageReaction("📥", messageID, () => {}, true);
      
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const cachePath = path.join(cacheDir, `shankar_${Date.now()}.mp4`);

      try {
        // arif-babu-downloader se data nikalna
        const res = await alldown(body);
        const videoUrl = res.data.high || res.data.low;

        if (!videoUrl) {
          return api.sendMessage("❌ Link se video download link nahi mil saka.", threadID, messageID);
        }

        // Video download process
        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        // Aapka Stylish Title Format
        const videoTitle = res.data.title || "Video Downloaded";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        // Message send karna
        api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error(err);
        api.sendMessage("❌ Error: Download nahi ho saka. Link check karein.", threadID, messageID);
      }
    }
  }
};
