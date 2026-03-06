const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.8.0", // Updated version
    hasPermssion: 0,
    credits: "ISMRST-SHAAN",
    description: "Auto download FB, YT (Shorts), IG, TikTok & Pinterest with auto-cache.",
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

    // Updated Regex to include YT Shorts and Pinterest
    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg|fb\.me)/ig;
    const igRegex = /(instagram\.com|instagr\.am)/ig;
    const ytRegex = /(youtube\.com|youtu\.be|youtube\.com\/shorts)/ig;
    const ttRegex = /(tiktok\.com|vt\.tiktok\.com)/ig;
    const pinRegex = /(pinterest\.com|pin\.it)/ig;

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body) || pinRegex.test(body)) {

      // 1. Loading Reaction
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Extension handle karne ke liye variable (Pinterest images bhi ho sakti hain)
      let fileName = `shaan_dl_${Date.now()}.mp4`;
      let cachePath = path.join(cacheDir, fileName);

      try {
        const { alldown } = require("arif-babu-downloader");

        // 2. Download logic
        const res = await alldown(body);
        
        // YouTube Shorts aur Pinterest aksar 'high' ya 'low' properties mein video link dete hain
        // Agar image hui (Pinterest), toh uska alag handle karna pad sakta hai
        const mediaUrl = res.data.high || res.data.low || res.data.url;

        if (!mediaUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        const videoTitle = res.data.title || "Social Media Content";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        // 3. Send and Success Reaction
        return api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, (err) => {
          if (!err) {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error("Download Error:", err.message);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }
    }
  }
};
