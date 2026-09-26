const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "sing"],
    version: "1.0.4",
    description: "Download music from YouTube by name or link",
    usage: "{prefix}song [song name] or song [song name]",
    credit: "Shaan Khan",
    hasPrefix: false,
    permission: "PUBLIC",
    cooldown: 5,
    category: "UTILITY"
  },

  run: async function({ api, message, args }) {
    const { threadID, messageID } = message;
    const query = args.join(" ");

    if (!query) {
      return api.sendMessage("❌ Please provide a song name or YouTube link!", threadID, messageID);
    }

    const apiKey = "apim_woYjgHP57d44pyaII3LzkGZ5kSK-3tE-H0QYlWmEqDE";
    const baseUrl = "https://priyanshuapi.qzz.io";

    try {
      api.sendMessage("⏳ Searching for your song, please wait...", threadID, messageID);

      // Step 1: Search Video
      const searchRes = await axios.get(`${baseUrl}/api/yts?q=${encodeURIComponent(query)}&apikey=${apiKey}`);
      const searchData = searchRes.data;

      // Handle different API JSON formats
      let video = null;
      if (Array.isArray(searchData)) {
        video = searchData[0];
      } else if (searchData.results && searchData.results.length > 0) {
        video = searchData.results[0];
      } else if (searchData.data && searchData.data.length > 0) {
        video = searchData.data[0];
      }

      if (!video) {
        return api.sendMessage("❌ No results found for your query.", threadID, messageID);
      }

      const videoUrl = video.url || video.link || `https://www.youtube.com/watch?v=${video.videoId}`;
      const title = video.title || "YouTube Audio";
      const duration = video.duration ? (video.duration.timestamp || video.duration) : "Unknown";
      const channel = video.author ? (video.author.name || video.author) : "Unknown";

      // Step 2: Get Download Link
      const downloadRes = await axios.get(`${baseUrl}/api/v2/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`);
      const downloadData = downloadRes.data;

      const downloadUrl = downloadData.download_url || downloadData.result || downloadData.url || downloadData.download;

      if (!downloadUrl) {
        return api.sendMessage("❌ Download link generate nahi ho saka. Server busy ho sakta hai.", threadID, messageID);
      }

      // Step 3: Download & Send Audio
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const cachePath = path.join(cacheDir, `${Date.now()}_song.mp3`);

      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        const stats = fs.statSync(cachePath);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > 25) {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          return api.sendMessage("❌ Audio file 25MB se badi hai, Messenger par send nahi ho sakti.", threadID, messageID);
        }

        const msgBody = `🎵 Title: ${title}\n⏱️ Duration: ${duration}\n👤 Channel: ${channel}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 SONG`;

        api.sendMessage({
          body: msgBody,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      });

      writer.on('error', (err) => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        api.sendMessage("❌ Downloading ke dauran error aya.", threadID, messageID);
      });

    } catch (error) {
      return api.sendMessage(`⚠️ Error: ${error.message || "Server responds nahi kar raha."}`, threadID, messageID);
    }
  },

  handleEvent: async function({ api, message }) {
    const { threadID, messageID, body } = message;
    if (!body) return;

    const lowerBody = body.trim().toLowerCase();

    // Direct "song <name>" trigger without prefix
    if (lowerBody.startsWith("song ")) {
      const query = body.slice(5).trim();
      if (!query) return;

      const args = query.split(" ");
      return this.run({ api, message, args });
    }
  }
};
