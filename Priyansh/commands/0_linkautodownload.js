module.exports = {
  config: {
    name: "autoDownload",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "uzairrajput",
    description: "Automatically detects links and creates cache folder if missing.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    // Empty
  },

  handleEvent: async function({ api, event }) {
    const axios = require('axios');
    const fs = require('fs-extra');
    const path = require('path');
    const { alldown } = require('arif-babu-downloader');

    const messageBody = event.body ? event.body : '';

    if (messageBody.includes('https://')) {
      const link = messageBody.match(/\bhttps?:\/\/\S+/gi);
      if (!link) return;

      api.setMessageReaction('📿', event.messageID, (err) => {}, true);

      try {
        const res = await alldown(link[0]);
        if (!res || !res.data) return;

        const videoUrl = res.data.video || res.data.high || res.data.low;
        const title = res.data.title || "No Title";

        if (!videoUrl) return;

        // --- CACHE FOLDER CHECK & CREATE ---
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
          console.log("Cache folder nahi mila, naya folder bana diya gaya hai.");
        }
        // ------------------------------------

        api.setMessageReaction('✅', event.messageID, (err) => {}, true);

        const fileName = `auto_${Date.now()}.mp4`;
        const cachePath = path.join(cacheDir, fileName);
        
        const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(cachePath, Buffer.from(videoResponse.data, 'utf-8'));

        return api.sendMessage({
          body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(cachePath)
        }, event.threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, event.messageID);

      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
};
