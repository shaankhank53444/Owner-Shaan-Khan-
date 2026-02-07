const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "MP4",
  version: "4.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search and download videos with better handling",
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
  if (this.config.credits !== "Shaan Khan") {
    return api.sendMessage("❌ [PROTECTION] Credit Warning: File creator name changed.", event.threadID);
  }

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name, Baby!", threadID, messageID);

  try {
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 6); // Sirf 6 results

    if (videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 **YouTube Search Results:**\n\n";
    let attachments = [];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp}]\n\n`;
      const imgPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
      try {
        const imgRes = await axios.get(videos[i].image, { responseType: 'arraybuffer' });
        fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      } catch (e) {}
    }

    searchList += `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO LIST`;

    return api.sendMessage({ body: searchList, attachment: attachments }, threadID, (err, info) => {
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

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
    return api.sendMessage("❌ Galat choice! 1-6 ke beech reply dein.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);

  const downloadWait = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

  try {
    // Try First API
    const res = await axios.get(`https://api.giftedtech.my.id/api/download/dlmp4?url=${encodeURIComponent(selectedVideo.url)}&apikey=gifted`);
    const downloadUrl = res.data.result.download_url || res.data.result.url;

    if (!downloadUrl) throw new Error("Link not found");

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    
    // Download video buffer
    const videoData = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    
    // Check if file is too large for Facebook (Approx 25MB)
    if (videoData.data.length > 26214400) {
        return api.sendMessage("❌ Video size is too large (more than 25MB). Messenger won't allow sending it.", threadID, messageID);
    }

    fs.writeFileSync(cachePath, Buffer.from(videoData.data));

    await api.sendMessage({
      body: `🎬 Title: ${selectedVideo.title}\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉MUSIC-VIDEO`,
      attachment: fs.createReadStream(cachePath)
    }, threadID);

    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    api.unsendMessage(downloadWait.messageID);

  } catch (err) {
    console.log(err);
    api.unsendMessage(downloadWait.messageID);
    return api.sendMessage(`❌ Downloader Error: File download nahi ho saki. Ho sakta hai file bohot badi ho ya server busy ho.`, threadID, messageID);
  }
};
