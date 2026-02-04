const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "MP4",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan", // Isko change karne par file error degi
  description: "Search 1-10 videos with images and anti-edit protection",
  commandCategory: "Media",
  usages: "[song name]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "yt-search": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  // --- Anti-Edit/Credit Protection ---
  if (global.config.name !== "MP4" || this.config.credits !== "Shaan Khan") {
    return api.sendMessage("❌ [PROTECTION] Credit Warning: File creator name changed. Command disabled.", event.threadID);
  }
  // -----------------------------------

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

  try {
    const yts = require("yt-search");
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 10);

    if (videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 **YouTube Search Results:**\n\n";
    let attachments = [];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp}]\n\n`;
      
      const imgPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
      const imgRes = await axios.get(videos[i].image, { responseType: 'arraybuffer' });
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
      attachments.push(fs.createReadStream(imgPath));
    }
    
    searchList += `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO LIST`;

    return api.sendMessage({
      body: searchList,
      attachment: attachments
    }, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        videos: videos
      });
    }, messageID);

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;

  if (handleReply.author !== senderID) return;

  // Re-check protection on reply
  if (this.config.credits !== "Shaan Khan") return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > 10) {
    return api.sendMessage("❌ Galat choice! 1-10 ke beech reply dein.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);
  
  const downloadWait = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

  try {
    const apiUrl = `https://anabot.my.id/api/download/ytmp4?url=${encodeURIComponent(selectedVideo.url)}&quality=360&apikey=freeApikey`;
    const fetchRes = await axios.get(apiUrl);

    if (!fetchRes.data.success) throw new Error("Server busy.");

    const downloadUrl = fetchRes.data.data.result.urls;
    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    fs.outputFileSync(cachePath, Buffer.from(downloadRes.data));

    const msg = {
      body: `🏷️ Title: ${selectedVideo.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉VIDEO-LIST`,
      attachment: fs.createReadStream(cachePath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.unsendMessage(downloadWait.messageID);
    }, messageID);

  } catch (err) {
    if (downloadWait) api.unsendMessage(downloadWait.messageID);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
