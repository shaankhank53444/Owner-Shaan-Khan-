const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "2.5.0",
    hasPermssion: 0,
    credits: "ISMRST-SHAAN",
    description: "Universal Downloader: FB, YT, IG, TT, X, Pinterest, Snapchat, SnackVideo, etc.",
    commandCategory: "Utilities",
    usages: "Sirf link paste karein (All Platforms Support)",
    cooldowns: 5,
  },

  run: async function ({ api, event }) {
    // handleEvent use ho raha hai
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    if (!body || !body.startsWith("https://")) return;

    // Universal Regex: Sabhi platforms (YT, FB, IG, TT, Pinterest, Twitter, Snapchat, SnackVideo, etc.)
    const universalRegex = /(facebook\.com|fb\.watch|fb\.gg|instagram\.com|youtube\.com|youtu\.be|tiktok\.com|twitter\.com|x\.com|pinterest\.com|pin\.it|snapchat\.com|s\.snackvideo\.com|v\.doubletick\.top)/ig;

    if (universalRegex.test(body)) {
      
      // Reaction: Download shuru hone ka signal
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

      const cachePath = path.join(cacheDir, `shaan_universal_${Date.now()}.mp4`);

      try {
        const { alldown } = require("arif-babu-downloader");

        // Data Fetching from Package
        const res = await alldown(body);
        
        // Sabhi platforms ke liye URL nikalne ka logic
        const videoUrl = res.data.high || res.data.low || res.data.url || res.data.video_url;

        if (!videoUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        // Axios Stream for better performance with large files
        const response = await axios({
          method: 'get',
          url: videoUrl,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(cachePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
          const videoTitle = res.data.title || "Universal Media Content";
          const platform = body.split('/')[2].replace('www.', ''); // Platform name nikalne ke liye
          
          const caption = `✨❁ ━━ ━[ 𝑶𝑾𝑵𝑬𝑹 ]━ ━━ ❁✨\n\n📝 ᴛɪᴛʟᴇ: ${videoTitle}\n🌐 sᴏᴜʀᴄᴇ: ${platform}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

          api.sendMessage({
            body: caption,
            attachment: fs.createReadStream(cachePath)
          }, threadID, (err) => {
            if (!err) {
              api.setMessageReaction("✅", messageID, () => {}, true);
            }
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          }, messageID);
        });

      } catch (err) {
        console.error("Global DL Error:", err.message);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }
    }
  }
};
