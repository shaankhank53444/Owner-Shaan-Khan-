const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "music",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Kashif Raza (Updated by Grok)",
  description: "Download song/audio/video from YouTube (New Fast API)",
  commandCategory: "media",
  usages: "[song name] | [song name video]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "yt-search": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Please provide a song name!\n\nExample: song shape of you\n       song shape of you video", threadID, messageID);
  }

  const isVideo = query.toLowerCase().endsWith("video");
  if (isVideo) query = query.replace(/video$/i, "").trim();

  api.sendMessage(`✅ Apki Request Jari Hai Please Wait: "${query}"\n⏳ Please wait...`, threadID, messageID);

  try {
    // Step 1: Search YouTube
    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return api.sendMessage("❌ No results found!", threadID, messageID);

    const title = video.title;
    const url = video.url;
    const author = video.author.name;
    const duration = video.timestamp;

    api.sendMessage(` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞:\n🎵 ${title}\n👤 ${author}\n⏱ ${duration}\n\n📥 Downloading ${isVideo ? "video" : "audio"}...`, threadID, messageID);

    // Step 2: New API Call (yt-tt.onrender.com)
    const apiUrl = isVideo 
      ? `https://yt-tt.onrender.com/api/youtube/video?url=${encodeURIComponent(url)}`
      : `https://yt-tt.onrender.com/api/youtube/audio?url=${encodeURIComponent(url)}`;

    const response = await axios.get(apiUrl, { timeout: 60000 });
    
    if (!response.data || !response.data.download) {
      return api.sendMessage("❌ API returned invalid response. Try again later.", threadID, messageID);
    }

    const downloadLink = response.data.download;

    // Step 3: Download File
    const fileExt = isVideo ? "mp4" : "mp3";
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 9999)}.${fileExt}`;
    const filePath = path.join(__dirname, "cache", fileName);

    await fs.ensureDir(path.join(__dirname, "cache"));

    const fileData = await axios.get(downloadLink, {
      responseType: "arraybuffer",
      timeout: 300000 // 5 min max
    });

    await fs.writeFile(filePath, fileData.data);

    // Step 4: Send File
    await api.sendMessage({
      body: `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞 ${title}\n👤 ${author}\n⏳ Duration: ${duration}\n🔗 ${url}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    // Cleanup
    setTimeout(() => {
      fs.unlink(filePath).catch(() => {});
    }, 10000);

  } catch (err) {
    console.error("Song Command Error:", err.message);
    api.sendMessage(`❌ Error: ${err.message || "Unknown error occurred"}\nTry again later!`, threadID, messageID);
  }
};