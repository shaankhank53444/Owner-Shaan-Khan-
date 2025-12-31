const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const https = require("https");

module.exports = {
  config: {
    name: "music",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download YouTube audio/video using Cobalt API",
    commandCategory: "Media",
    usages: "[songName] [audio/video]",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    let songName, type;

    // Check if user specified audio or video
    if (
      args.length > 1 &&
      (args[args.length - 1].toLowerCase() === "audio" || args[args.length - 1].toLowerCase() === "video")
    ) {
      type = args.pop().toLowerCase();
      songName = args.join(" ");
    } else {
      songName = args.join(" ");
      type = "audio"; // Default type
    }

    if (!songName) {
      return api.sendMessage("❌ Please provide a song name or link.", event.threadID, event.messageID);
    }

    const processingMessage = await api.sendMessage(
      "✅ Apki Request Jari Hai Please wait...",
      event.threadID,
      null,
      event.messageID
    );

    try {
      // 1. YouTube Search
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      const topResult = searchResults.videos[0];
      const videoUrl = topResult.url;

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // 2. Cobalt API Request (Fixed & Optimized)
      const cobaltApi = "https://api.cobalt.tools/api/json";
      const response = await axios.post(cobaltApi, {
        url: videoUrl,
        downloadMode: type, // 'audio' or 'video'
        videoQuality: "720",
        filenameStyle: "basic",
        youtubeVideoCodec: "h264"
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const downloadUrl = response.data.url;
      if (!downloadUrl) throw new Error("Could not fetch download link.");

      // 3. File Setup
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9]/g, "_");
      const ext = type === "audio" ? "mp3" : "mp4";
      const downloadPath = path.join(__dirname, "cache", `${safeTitle}.${ext}`);

      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
      }

      // 4. Download File
      const file = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        https.get(downloadUrl, (res) => {
          res.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
        }).on("error", reject);
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // 5. Send File
      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🖤 Title: ${topResult.title}\n⏱ Duration: ${topResult.timestamp}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞 ${type.toUpperCase()} 🎧:`,
        },
        event.threadID,
        () => {
          if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
          api.unsendMessage(processingMessage.messageID);
        },
        event.messageID
      );

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
      api.unsendMessage(processingMessage.messageID);
    }
  },
};
