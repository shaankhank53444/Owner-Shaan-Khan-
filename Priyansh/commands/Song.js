const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "sing"],
    version: "1.0.1",
    description: "Download music from YouTube by name or link",
    usage: "{prefix}song [song name / link]",
    credit: "Shaan Khan",
    hasPrefix: true,
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

    try {
      api.sendMessage("⏳ Searching for your song, please wait...", threadID, messageID);

      // Step 1: Search for the video using Priyanshu's API
      const searchRes = await axios.get(`https://api.priyanshuraiput.xyz/api/yts?q=${encodeURIComponent(query)}&apikey=${apiKey}`);
      const video = searchRes.data.results ? searchRes.data.results[0] : null;

      if (!video) {
        return api.sendMessage("❌ No results found for your query.", threadID, messageID);
      }

      const videoUrl = video.url;
      const title = video.title;
      const duration = video.duration ? video.duration.timestamp : "Unknown";
      const channel = video.author ? video.author.name : "Unknown";

      // Step 2: Get Download Link from Priyanshu's ytmp3 API
      const downloadRes = await axios.get(`https://api.priyanshuraiput.xyz/api/v2/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`);
      const downloadUrl = downloadRes.data.download_url || downloadRes.data.result;

      if (!downloadUrl) {
        return api.sendMessage("❌ Failed to generate download link. Try again later.", threadID, messageID);
      }

      // Step 3: Download the file to cache directory
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
        const fileSizeInMegabytes = stats.size / (1024 * 1024);

        if (fileSizeInMegabytes > 25) {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          return api.sendMessage("❌ The file is too large (over 25MB). I cannot send it via Messenger.", threadID, messageID);
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
        api.sendMessage("❌ Error while downloading the audio file.", threadID, messageID);
      });

    } catch (error) {
      return api.sendMessage(`⚠️ Error: ${error.message || "Server is not responding."}`, threadID, messageID);
    }
  },

  handleEvent: async function({ api, message }) {
    const { threadID, messageID, body } = message;
    if (!body) return;

    if (body.toLowerCase().startsWith("song ")) {
      const query = body.slice(5).trim();
      if (!query) return;
      
      return this.run({ api, message, args: query.split(" ") });
    }
  }
};
