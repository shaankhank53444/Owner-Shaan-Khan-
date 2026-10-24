const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tiktok",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search and download TikTok videos by keyword",
  commandCategory: "utility",
  usages: "[keyword]",
  cooldowns: 10,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const keywords = args.join(" ").trim();
  const prefix = global.config.PREFIX || "/";

  if (!keywords) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Please provide a search keyword.\nExample: ${prefix}tiktok Zoro edit`, threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage(`🔍 Searching for "${keywords}"... Please wait.`, threadID, messageID);

  try {
    // API request
    const response = await axios.post(
      "https://uzairtikdown.dpdns.org/api/downloader",
      {
        keywords: keywords,
        limit: 15
      },
      {
        timeout: 45000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    // Extracting the video array from different possible keys
    let videos = [];
    if (Array.isArray(data.result)) videos = data.result;
    else if (data.result && Array.isArray(data.result.videos)) videos = data.result.videos;
    else if (data.data && Array.isArray(data.data)) videos = data.data;
    else if (Array.isArray(data)) videos = data;

    if (!videos || videos.length === 0) {
      throw new Error("No videos found for this keyword.");
    }

    // Pick a random video from the list
    const videoData = videos[Math.floor(Math.random() * videos.length)];

    // Extract video URL
    const videoUrl = videoData.play || videoData.video || videoData.downloadUrl || videoData.nowm || videoData.videoUrl;
    
    if (!videoUrl) {
      throw new Error("Could not find a valid video URL in the response.");
    }

    const title = videoData.title || videoData.desc || "TikTok Video";
    const author = videoData.author?.nickname || videoData.author?.name || "Unknown";
    const duration = videoData.duration || "N/A";

    // Setup cache path
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const videoPath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

    // Download video as arraybuffer
    const videoRes = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, Buffer.from(videoRes.data));

    const msg = {
      body: `╭━━━━━━━━━━━━╮\n` +
            `🎵 TIKTOK SEARCH\n` +
            `╰━━━━━━━━━━━━╯\n` +
            `🔍 Query: ${keywords}\n` +
            `🎬 Title: ${title}\n` +
            `👤 Creator: ${author}\n` +
            `⏳ Duration: ${duration}s\n\n` +
            `📌 »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉\n` +
            `🎥 TIKTOK-VIDDEO!`,
      attachment: fs.createReadStream(videoPath)
    };

    api.setMessageReaction("✅", messageID, () => {}, true);
    
    return api.sendMessage(msg, threadID, () => {
      // Delete temporary video file after sending
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }, messageID);

  } catch (error) {
    if (global.logger && typeof global.logger.error === "function") {
      global.logger.error(`Error in tiktok command: ${error.message}`);
    } else {
      console.error(`Error in tiktok command: ${error.message}`);
    }

    api.setMessageReaction("❌", messageID, () => {}, true);
    
    let errorMsg = "❌ TikTok search failed.";
    if (error.message.includes("No videos found")) errorMsg = "❌ No videos found for this search.";
    if (error.code === 'ECONNABORTED') errorMsg = "❌ Connection timed out. Try again.";

    return api.sendMessage(`${errorMsg}\nReason: ${error.message}`, threadID, messageID);
  }
};
