const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "video2",
  version: "2.7.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search 1-10 videos with image and custom reply download",
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
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

  // Initial wait message
  const waitMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID);

  try {
    const yts = require("yt-search");
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 10);

    if (videos.length === 0) {
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ No results found.", threadID, messageID);
    }

    let searchList = "🔍 **YouTube Search Results:**\n\n";
    videos.forEach((video, index) => {
      searchList += `${index + 1}. ${video.title} [${video.timestamp}]\n\n`;
    });
    
    // Aapka requested owner signature
    searchList += `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO LIST`;

    const imgUrl = videos[0].image;
    const imgPath = path.join(__dirname, "cache", `thumb_${Date.now()}.jpg`);
    
    const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    fs.outputFileSync(imgPath, Buffer.from(imgRes.data));

    // Remove "wait" message before sending the list
    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage({
      body: searchList,
      attachment: fs.createReadStream(imgPath)
    }, threadID, (err, info) => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      
      // Store info for reply handling
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        videos: videos
      });
    }, messageID);

  } catch (err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;

  // Only the person who searched can reply
  if (handleReply.author !== senderID) return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > 10) {
    return api.sendMessage("❌ Invalid choice. Please reply with a number (1-10).", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  
  // Remove the list message to keep chat clean
  api.unsendMessage(handleReply.messageID);
  
  const downloadWait = await api.sendMessage(`✅ Downloading: ${selectedVideo.title}\nPlease wait...`, threadID);

  try {
    // API endpoint for Video download
    const apiUrl = `https://anabot.my.id/api/download/ytmp4?url=${encodeURIComponent(selectedVideo.url)}&quality=360&apikey=freeApikey`;
    const fetchRes = await axios.get(apiUrl);

    if (!fetchRes.data.success) throw new Error("Download server is currently busy.");

    const downloadUrl = fetchRes.data.data.result.urls;
    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    fs.outputFileSync(cachePath, Buffer.from(downloadRes.data));

    const msg = {
      body: `🏷️ Title: ${selectedVideo.title}\n👤 Channel: ${selectedVideo.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 YOUR VIDEO`,
      attachment: fs.createReadStream(cachePath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.unsendMessage(downloadWait.messageID);
    }, messageID);

  } catch (err) {
    api.unsendMessage(downloadWait.messageID);
    return api.sendMessage(`❌ Download Error: ${err.message}`, threadID, messageID);
  }
};
