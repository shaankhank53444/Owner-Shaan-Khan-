const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.7.5",
    hasPermssion: 0,
    credits: " ISMRST-SHAAN",
    description: "Auto download FB, YT, IG, TikTok with auto-cache & reactions.",
    commandCategory: "Utilities",
    usages: "Sirf link paste karein",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    // Ye khali rahega kyunki hum handleEvent use kar rahe hain
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    if (!body || !body.startsWith("https://")) return;

    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg)/ig;
    const igRegex = /(instagram\.com)/ig;
    const ytRegex = /(youtube\.com|youtu\.be)/ig;
    const ttRegex = /(tiktok\.com)/ig;

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body)) {

      // 1. Loading Reaction (Wait wala)
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const fileName = `shankar_${Date.now()}.mp4`;
      const cachePath = path.join(cacheDir, fileName);

      try {
        const { alldown } = require("arif-babu-downloader");
        
        // 2. Download logic
        const res = await alldown(body);
        const videoUrl = res.data.high || res.data.low;

        if (!videoUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        const videoTitle = res.data.title || "Social Media Video";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        // 3. Send and Success Reaction
        return api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, (err) => {
          if (!err) {
            // File bhejte hi Done wala reaction
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error("Download Error:", err.message);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
      }
    }
  }
};
