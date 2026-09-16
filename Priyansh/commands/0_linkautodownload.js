module.exports = {
  config: {
    name: "autoDownload",
    version: "1.3.1",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Auto downloads videos from YT, FB, Insta, TikTok, Pinterest, etc.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    // Command trigger par empty rakha gaya hai
  },

  handleEvent: async function({ api, event }) {
    const axios = require('axios');
    const fs = require('fs-extra');
    const path = require('path');
    const { alldown } = require('arif-babu-downloader');

    const messageBody = event.body ? event.body.trim() : '';
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    if (urlRegex.test(messageBody)) {
      const links = messageBody.match(urlRegex);
      if (!links || links.length === 0) return;

      const targetUrl = links[0];

      // Reaction set karein parsing start hone par
      api.setMessageReaction('⏳', event.messageID, () => {}, true);

      try {
        const res = await alldown(targetUrl);
        if (!res || (!res.data && !res.url)) {
          api.setMessageReaction('❌', event.messageID, () => {}, true);
          return;
        }

        // Multiple response formats handle karne ke liye fallback structure
        const mediaData = res.data || res;
        const videoUrl = mediaData.high || mediaData.low || mediaData.video || mediaData.url || mediaData.medias?.[0]?.url;
        const title = mediaData.title || "Downloaded Media";

        if (!videoUrl) {
          api.setMessageReaction('❌', event.messageID, () => {}, true);
          return;
        }

        // Cache folder setup
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const fileName = `auto_${Date.now()}.mp4`;
        const cachePath = path.join(cacheDir, fileName);

        // Download video using stream
        const response = await axios({
          method: 'get',
          url: videoUrl,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(cachePath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
          api.setMessageReaction('✅', event.messageID, () => {}, true);

          return api.sendMessage({
            body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
            attachment: fs.createReadStream(cachePath)
          }, event.threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          }, event.messageID);
        });

        writer.on('error', (err) => {
          console.error("File Write Error:", err);
          api.setMessageReaction('❌', event.messageID, () => {}, true);
        });

      } catch (error) {
        console.error("AutoDownload Error:", error);
        api.setMessageReaction('❌', event.messageID, () => {}, true);
      }
    }
  }
};
