const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "MP4",
  version: "4.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download videos using Priyansh API",
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
  if (this.config.credits !== "Shaan Khan") {
    return api.sendMessage("❌ [PROTECTION] Credit Warning: File creator name changed.", event.threadID);
  }

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name, Baby!", threadID, messageID);

  try {
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 6);

    if (videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 YouTube Search Results:\n\n";
    let attachments = [];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp}]\n\n`;

      const imgPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
      try {
        const imgRes = await axios.get(videos[i].image, { responseType: 'arraybuffer' });
        fs.writeFileSync(imgPth, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      } catch (e) { /* skip thumbnail error */ }
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
  if (this.config.credits !== "Shaan Khan") return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
    return api.sendMessage("❌ Galat choice! 1-6 ke beech reply dein.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);

  const downloadWait = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

  try {
    // Fixed with your provided Priyansh API Key
    const apiKey = "apim_ui5FZw6pIHZkXzBLWDndM5_I-a9tppVFe9Et7yLsQWw";
    const apiUrl = `https://api.priyansh.my.id/api/download/video?url=${encodeURIComponent(selectedVideo.url)}&apikey=${apiKey}`;
    
    const res = await axios.get(apiUrl);
    
    // Priyansh API structure usually returns the link in res.data.result.download_url
    const downloadUrl = res.data.result.download_url || res.data.result.url;

    if (!downloadUrl) throw new Error("Could not fetch download link.");

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    const videoStream = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    fs.outputFileSync(cachePath, Buffer.from(videoStream.data));

    const msg = {
      body: `🎬 Title: ${selectedVideo.title}\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉MUSIC-VIDEO`,
      attachment: fs.createReadStream(cachePath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.unsendMessage(downloadWait.messageID);
    }, messageID);

  } catch (err) {
    if (downloadWait) api.unsendMessage(downloadWait.messageID);
    return api.sendMessage(`❌ API Error: Downloader server busy or invalid API key.`, threadID, messageID);
  }
};
