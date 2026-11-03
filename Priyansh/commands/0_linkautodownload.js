module.exports = {
  config: {
    name: "autoDownload",
    version: "1.4.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Auto detects and downloads media from FB, Insta, TikTok, YT, Shorts, Pinterest.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    // Command trigger par empty
  },

  handleEvent: async function({ api, event }) {
    const axios = require('axios');
    const fs = require('fs-extra');
    const path = require('path');
    const { alldown } = require('arif-babu-downloader');

    const messageBody = event.body ? event.body.trim() : '';
    if (!messageBody) return;

    // Direct link detection
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = messageBody.match(urlRegex);
    if (!links || links.length === 0) return;

    const targetUrl = links[0];

    // Processing reaction
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      let videoUrl = null;
      let title = "Downloaded Media";

      // --- 1. Downloader API Call ---
      try {
        const res = await alldown(targetUrl);
        if (res) {
          title = res.title || res.data?.title || title;
          videoUrl = res.url || res.data?.video || res.data?.high || res.data?.low || res.data?.url || (res.data?.medias && res.data.medias[0]?.url);
        }
      } catch (e) {
        console.log("Primary downloader failed, trying backup API...");
      }

      // --- 2. Fallback API (YouTube / TikTok / Insta Alternative) ---
      if (!videoUrl) {
        const backupRes = await axios.get(`https://api.vytal.project/download?url=${encodeURIComponent(targetUrl)}`).catch(() => null);
        if (backupRes?.data?.url) {
          videoUrl = backupRes.data.url;
          title = backupRes.data.title || title;
        }
      }

      if (!videoUrl) {
        api.setMessageReaction('❌', event.messageID, () => {}, true);
        return;
      }

      // --- 3. Cache Folder Setup ---
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

      // --- 4. Stream Download ---
      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.setMessageReaction('✅', event.messageID, () => {}, true);

        return api.sendMessage({
          body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, event.messageID);
      });

      writer.on('error', (err) => {
        console.error("Stream Write Error:", err);
        api.setMessageReaction('❌', event.messageID, () => {}, true);
      });

    } catch (error) {
      console.error("AutoDownload Error:", error.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
    }
  }
};
