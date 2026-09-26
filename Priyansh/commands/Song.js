const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "sing"],
    version: "1.0.0",
    description: "Download music from YouTube by name or link",
    usage: "{prefix}song [song name]",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
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

    try {
      api.sendMessage("⏳ Searching for your song, please wait...", threadID, (err, info) => {
        global.client.replies = global.client.replies || new Map();
        // Store info to unsend later if needed
      }, messageID);

      // Step 1: Search for the video using Priyanshu's API
      const searchRes = await axios.get(`https://api.priyanshuraiput.xyz/api/yts?q=${encodeURIComponent(query)}`);
      const video = searchRes.data.results[0];

      if (!video) {
        return api.sendMessage("❌ No results found for your query.", threadID, messageID);
      }

      const videoUrl = video.url;
      const title = video.title;

      // Step 2: Get Download Link from Priyanshu's ytmp3 API
      const downloadRes = await axios.get(`https://api.priyanshuraiput.xyz/api/v2/ytmp3?url=${encodeURIComponent(videoUrl)}`);
      const downloadUrl = downloadRes.data.download_url;

      if (!downloadUrl) {
        return api.sendMessage("❌ Failed to generate download link. Try again later.", threadID, messageID);
      }

      // Step 3: Download the file to cache
      const cachePath = path.join(__dirname, "cache", `${Date.now()}_song.mp3`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        const stats = fs.statSync(cachePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

        if (fileSizeInMegabytes > 25) {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          return api.sendMessage("❌ The file is too large (over 25MB). I cannot send it via Messenger.", threadID, messageID);
        }

        api.sendMessage({
          body: `🎵 Title: ${title}\n⏱️ Duration: ${video.duration.timestamp}\n👤 Channel: ${video.author.name}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 SONG`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      });

      writer.on('error', (err) => {
        global.logger.error(`Download Error: ${err.message}`);
        api.sendMessage("❌ Error while downloading the audio file.", threadID, messageID);
      });

    } catch (error) {
      global.logger.error(`Error in song command: ${error.message}`);
      return api.sendMessage("⚠️ Server is not responding. Please try again later.", threadID, messageID);
    }
  },

  handleEvent: async function({ api, message }) {
    const { threadID, messageID, body } = message;
    if (!body) return;

    // Logic to handle "song " without prefix
    if (body.toLowerCase().startsWith("song ")) {
      const query = body.slice(5).trim();
      if (!query) return;
      
      // Execute the run function logic
      return this.run({ api, message, args: query.split(" ") });
    }
  }
};