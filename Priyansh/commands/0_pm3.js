const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp3",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download song/video from YouTube with custom signature",
  commandCategory: "Media",
  usages: "[song name] [video]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "yt-search": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

  const wantVideo = query.toLowerCase().endsWith(" video");
  const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
  const format = wantVideo ? "video" : "audio";

  const frames = [
    "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
    "💙▰▰▱▱▱▱▱▱▱▱ 25%",
    "💜▰▰▰▰▱▱▱▱▱▱ 45%",
    "💖▰▰▰▰▰▰▱▱▱▱ 70%",
    "💗▰▰▰▰▰▰▰▰▰▰ 100%"
  ];

  let loadingMsgData = await api.sendMessage(`✅ Apki Request Jari Hai Please wait..."${searchTerm}"...\n${frames[0]}`, threadID);

  try {
    const yts = require("yt-search");
    const searchResults = await yts(searchTerm);
    const videos = searchResults.videos;

    if (!videos || videos.length === 0) {
      return api.sendMessage("❌ No results found.", threadID, messageID);
    }

    const first = videos[0];
    const { title, url: videoUrl, author } = first;

    const updateStatus = async (msg) => {
      try {
        await api.editMessage(msg, loadingMsgData.messageID);
      } catch (e) {}
    };

    await updateStatus(`🎬 Found: ${title}\n\n${frames[1]}`);
    await updateStatus(`📥 Downloading ${format}...\n\n${frames[2]}`);

    const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
    let apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;
    if (wantVideo) apiUrl += '&quality=360';

    const fetchRes = await axios.get(apiUrl, { timeout: 60000 });

    if (!fetchRes.data.success || !fetchRes.data.data.result.urls) {
      throw new Error("Server error or file too large.");
    }

    const downloadUrl = fetchRes.data.data.result.urls;
    await updateStatus(`🎵 Processing File...\n\n${frames[3]}`);

    const downloadRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 180000
    });

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${Date.now()}.${wantVideo ? "mp4" : "mp3"}`);
    fs.writeFileSync(filePath, Buffer.from(downloadRes.data));

    await updateStatus(`${frames[4]}\n✅ Complete! Sending now...`);

    // Yahan aapka custom message format hai
    const customMessage = `🏷️ Title: ${title}\n` +
                          ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉\n\n` +
                          `👤 Channel: ${author.name}\n` +
                          `🔗 Link: ${videoUrl}`;

    const msg = {
      body: customMessage,
      attachment: fs.createReadStream(filePath)
    };

    return api.sendMessage(msg, threadID, async (err) => {
      if (err) api.sendMessage("❌ Error sending file. It might be too large for Messenger.", threadID);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      setTimeout(() => api.unsendMessage(loadingMsgData.messageID), 5000);
    }, messageID);

  } catch (err) {
    console.error("MP3 ERROR:", err);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
