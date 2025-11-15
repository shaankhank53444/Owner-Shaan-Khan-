const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "music",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Kashif Raza",
  description: "Download song/audio/video from YouTube",
  commandCategory: "media",
  usages: "[song name] or [song name video]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "yt-search": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Please provide a song name.\n\nUsage: song [name] or song [name] video", threadID, messageID);
  }

  const wantVideo = query.toLowerCase().endsWith(" video");
  const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
  const format = wantVideo ? "video" : "audio";

  api.sendMessage(`✅ Apki Request Jari Hai Please Wait"${searchTerm}"...`, threadID, messageID);

  try {
    // Search using yt-search
    const searchResults = await yts(searchTerm);
    const videos = searchResults.videos;

    if (!videos || videos.length === 0) {
      return api.sendMessage("❌ No results found.", threadID, messageID);
    }

    const first = videos[0];
    const title = first.title;
    const videoUrl = first.url;
    const author = first.author.name;

    api.sendMessage(`✅ music 🎶 done : ${title}\n📥 Downloading ${format}...`, threadID, messageID);

    // Fetch download URL using API
    let fetchRes;
    try {
      const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
      let apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;
      if (wantVideo) {
        apiUrl += '&quality=360';
      }
      fetchRes = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 60000
      });
    } catch (fetchError) {
      return api.sendMessage(`❌ Failed to fetch download link: ${fetchError.message}\n\nThe API might be slow or unavailable. Please try again later.`, threadID, messageID);
    }

    if (!fetchRes.data.success || !fetchRes.data.data.result.urls) {
      return api.sendMessage("❌ Failed to get download URL from API", threadID, messageID);
    }

    const downloadUrl = fetchRes.data.data.result.urls;

    // Download the file
    let downloadRes;
    try {
      downloadRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 180000
      });
    } catch (downloadError) {
      return api.sendMessage(`❌ Download failed: ${downloadError.message}\n\nPlease try again later.`, threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const timestamp = Date.now();
    const extension = wantVideo ? "mp4" : "mp3";
    const filePath = path.join(cacheDir, `${timestamp}.${extension}`);

    await fs.writeFile(filePath, downloadRes.data);

    // Send the file directly without additional status message
    await api.sendMessage({
      body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞 ${title}\n📺 ${author}\n🔗 ${videoUrl}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    // Clean up file after 10 seconds
    setTimeout(() => {
      fs.unlink(filePath).catch(err => console.log("Cleanup error:", err));
    }, 10000);

  } catch (err) {
    console.error("SONG CMD ERR:", err);
    // Only show user-friendly error messages, not internal errors
    if (err.message && !err.message.includes("Assignment to constant")) {
      api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};