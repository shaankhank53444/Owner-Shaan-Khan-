const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "mp3",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Kashif Raza",
  description: "Download song/audio/video from YouTube",
  commandCategory: "media",
  usages: ".song despacito [optional: video]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");
  if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

  const wantVideo = query.toLowerCase().endsWith(" video");
  const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
  const format = wantVideo ? "video" : "audio";

  // Normal starting message
  api.sendMessage(`🔍 Searching for **${searchTerm}**...`, threadID, messageID);

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

    api.sendMessage(`🎬 Found: ${title}\n📥 Downloading ${format}...`, threadID);

    // Fetch download URL from API
    let fetchRes;
    try {
      const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
      let apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;
      if (wantVideo) apiUrl += '&quality=360';

      fetchRes = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' }, timeout: 60000 });
    } catch (error) {
      return api.sendMessage(`❌ Failed to fetch download link: ${error.message}`, threadID, messageID);
    }

    if (!fetchRes.data.success || !fetchRes.data.data.result.urls) {
      return api.sendMessage("❌ Failed to get download URL", threadID, messageID);
    }

    const downloadUrl = fetchRes.data.data.result.urls;

    // Download the file
    let downloadRes;
    try {
      downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 180000 });
    } catch (err) {
      return api.sendMessage(`❌ Download failed: ${err.message}`, threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const filePath = path.join(cacheDir, `${Date.now()}.${wantVideo ? "mp4" : "mp3"}`);
    fs.writeFileSync(filePath, downloadRes.data);

    api.sendMessage(`✅ Download complete! Sending your file...`, threadID);

    await api.sendMessage({
      body: `🎶 ${title}\n📺 ${author}\n🔗 ${videoUrl}`,
      attachment: fs.createReadStream(filePath)
    }, threadID);

    // Auto delete
    setTimeout(async () => {
      try { await fs.unlink(filePath); } catch { }
    }, 10000);

  } catch (err) {
    console.error("SONG CMD ERR:", err.message);
    api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};