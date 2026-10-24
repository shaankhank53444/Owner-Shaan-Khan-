const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt", "ttdl", "ttsearch"],
    version: "1.0.1",
    description: "Search TikTok videos or download via URL",
    usage: "{prefix}tiktok [keyword or link]",
    credits: "Shaan Khan",
    hasPrefix: true,
    permission: "PUBLIC",
    cooldown: 10,
    category: "UTILITY"
  },

  run: async function({ api, message, args }) {
    const { threadID, messageID } = message;
    const input = args.join(" ").trim();

    if (!input) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        "❌ Please provide a TikTok link or a search keyword.\n\nExample:\n{prefix}tiktok Zoro edit\n{prefix}tiktok https://vt.tiktok.com/zs...",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);
    const checkingMsg = await api.sendMessage("⏳ Processing your request... Please wait.", threadID, messageID);

    let videoPath = null;

    try {
      // Check if the input is a URL or a keyword
      const isURL = /^(http|https):\/\/[^ "]+$/.test(input);

      const response = await axios.post(
        "https://uzairtikdown.dpdns.org/api/downloader",
        {
          keywords: input,
          limit: 10
        },
        {
          timeout: 50000,
          headers: { "Content-Type": "application/json" }
        }
      );

      const data = response.data;
      let videoData = null;

      // Logic to find video data in different API response structures
      if (isURL) {
        videoData = data.result && !Array.isArray(data.result) ? data.result : (data.result?.[0] || data.data?.[0] || data.data);
      } else {
        let videos = [];
        if (Array.isArray(data.result)) videos = data.result;
        else if (data.result?.videos) videos = data.result.videos;
        else if (Array.isArray(data.data)) videos = data.data;

        if (videos && videos.length > 0) {
          videoData = videos[Math.floor(Math.random() * videos.length)];
        }
      }

      if (!videoData) {
        throw new Error("Could not find any video results. The API might be down or the link is invalid.");
      }

      // Extract video URL (handling multiple possible keys from API)
      const videoUrl = videoData.play || videoData.video || videoData.downloadUrl || videoData.nowm || videoData.videoUrl || videoData.url;

      if (!videoUrl) {
        throw new Error("Video URL not found in the API response.");
      }

      const title = videoData.title || videoData.desc || "TikTok Video";
      const author = videoData.author?.nickname || videoData.author?.name || videoData.nickname || "Unknown Creator";
      const duration = videoData.duration || "N/A";

      // Setup cache directory and file path
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      videoPath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

      // Download the video stream correctly as binary buffer
      const videoRes = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(videoPath, Buffer.from(videoRes.data));

      const msg = {
        body: `╭━━━━━━━━━━━━╮\n` +
              `🎵 TIKTOK ${isURL ? "DOWNLOAD" : "SEARCH"}\n` +
              `╰━━━━━━━━━━━━╯\n` +
              `🎬 Title: ${title}\n` +
              `👤 Creator: ${author}\n` +
              `⏳ Duration: ${duration}s\n\n` +
              `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
              `🎥 Enjoy your video!`,
        attachment: fs.createReadStream(videoPath)
      };

      if (checkingMsg && checkingMsg.messageID) {
        api.unsendMessage(checkingMsg.messageID).catch(() => {});
      }
      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(msg, threadID, () => {
        if (videoPath && fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }, messageID);

    } catch (error) {
      console.error(error);
      
      // Cleanup file if error occurred mid-download
      if (videoPath && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      if (checkingMsg && checkingMsg.messageID) {
        api.unsendMessage(checkingMsg.messageID).catch(() => {});
      }
      api.setMessageReaction("❌", messageID, () => {}, true);

      let errorMsg = "❌ An error occurred while processing TikTok.";
      if (error.message.includes("not found")) errorMsg = "❌ No videos found. Try a different keyword or check the link.";
      if (error.code === 'ECONNABORTED') errorMsg = "❌ Connection timed out. The TikTok server is responding too slowly.";

      return api.sendMessage(`${errorMsg}\n\nTechnical Reason: ${error.message}`, threadID, messageID);
    }
  }
};
