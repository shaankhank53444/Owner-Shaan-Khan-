const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "play",
    aliases: ["music", "video", "playvideo"],
    version: "1.0.2",
    description: "Play music or video from YouTube",
    usage: "{prefix}play [song name] or [song name] video",
    credit: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
    hasPrefix: true,
    permission: "PUBLIC",
    cooldown: 10,
    category: "UTILITY"
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    
    if (args.length === 0) {
      return api.sendMessage("❌ Please provide a song name or YouTube link.", threadID, messageID);
    }

    const input = args.join(" ");
    const isVideo = input.toLowerCase().includes("video") || (event.body && event.body.toLowerCase().includes("playvideo"));
    const query = input.replace(/video/gi, "").trim();
    
    const ORIGIN = "https://yt-mian-amir.vercel.app";
    const API_LINK = `${ORIGIN}/api/link`;

    // Ensure cache directory exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cachePath = path.join(cacheDir, `play_${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    let processingMsgID = null;

    try {
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction("⏳", messageID, () => {}, true);
      }
      
      // 1. Search YouTube
      const searchResult = await ytSearch(query);
      const video = searchResult.videos[0];

      if (!video) {
        if (typeof api.setMessageReaction === "function") api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ No results found for your query.", threadID, messageID);
      }

      // Check duration (Max 20 mins for audio, 10 mins for video)
      const limitSec = isVideo ? 600 : 1200;
      if (video.seconds > limitSec) {
        if (typeof api.setMessageReaction === "function") api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ Content is too long. Max limit is ${limitSec / 60} minutes.`, threadID, messageID);
      }

      const infoMsg = `🎵 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉${isVideo ? "video" : "audio"}...`;
      
      await new Promise((resolve) => {
        api.sendMessage(infoMsg, threadID, (err, info) => {
          if (!err && info && info.messageID) {
            processingMsgID = info.messageID;
          }
          resolve();
        }, messageID);
      });

      // 2. Get Download Link from API with proper headers and extended timeout
      const format = isVideo ? "360" : "mp3";
      const { data } = await axios.get(`${API_LINK}?url=${encodeURIComponent(video.url)}&format=${format}`, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*"
        }
      });

      const downloadUrl = data.download_url || data.upstream_url;
      if (!downloadUrl) {
        throw new Error("Could not retrieve download link from API response.");
      }

      // 3. Download File Stream
      const finalUrl = downloadUrl.startsWith("http") ? downloadUrl : `${ORIGIN}${downloadUrl}`;
      const response = await axios({
        method: "get",
        url: finalUrl,
        responseType: "stream",
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
        },
        timeout: 60000
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const stats = fs.statSync(cachePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 48) {
        if (processingMsgID) api.unsendMessage(processingMsgID);
        if (typeof api.setMessageReaction === "function") api.setMessageReaction("❌", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        return api.sendMessage(`⚠️ File is too large (${fileSizeMB.toFixed(1)}MB). Messenger limit is 48MB.`, threadID, messageID);
      }

      // 4. Send Message with Attachment
      await api.sendMessage({
        body: `✅ Downloaded: ${video.title}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, (err) => {
        if (!err && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        if (processingMsgID) api.unsendMessage(processingMsgID);
      }, messageID);

    } catch (error) {
      console.error(`Error in play command:`, error.message);

      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      if (processingMsgID) api.unsendMessage(processingMsgID);
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      return api.sendMessage(`❌ Error: ${error.response?.status || error.message}. Please try again later.`, threadID, messageID);
    }
  }
};
