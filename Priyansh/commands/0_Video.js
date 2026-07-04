const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp4",
  version: "4.7.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search 1-10 videos and download (360p+)",
  commandCategory: "Media",
  usages: "[video name]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a video name.", threadID, messageID);

  try {
    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" };
    // Uzair Rajput Search API
    const searchRes = await axios.get("https://uzairrajputapis.qzz.io/api/search/youtube", { params: { q: query }, headers });
    const videos = searchRes.data.result.slice(0, 10);

    if (!videos || videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 YouTube Search Results:\n\n";
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp || 'N/A'}]\n\n`;
    }

    searchList += `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO LIST`;

    return api.sendMessage(searchList, threadID, (err, info) => {
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
    return api.sendMessage("❌ Invalid choice! Choose 1-10.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);

  const waitMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

  try {
    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" };
    // Uzair Rajput Downloader API
    const dlRes = await axios.post("https://uzairrajputapis.qzz.io/api/downloader/youtube", { url: selectedVideo.url }, { headers });
    const downloadUrl = dlRes.data.result.downloadUrl;
    
    if (!downloadUrl) throw new Error("Failed to get download link.");

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    const response = await axios({ method: 'GET', url: downloadUrl, responseType: 'stream', headers });

    const writer = fs.createWriteStream(cachePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const stats = fs.statSync(cachePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      if (stats.size > 104857600) { 
        fs.unlinkSync(cachePath);
        api.unsendMessage(waitMsg.messageID);
        return api.sendMessage(`⚠️ Size: ${fileSizeInMB}MB (Limit Exceeded).\n\n🔗 Link: ${downloadUrl}`, threadID, messageID);
      }

      const msg = {
        body: `🖤 Title: ${selectedVideo.title}\n📊 Quality: HD\n📦 Size: ${fileSizeInMB}MB\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉MUSIC-VIDEO`,
        attachment: fs.createReadStream(cachePath)
      };

      return api.sendMessage(msg, threadID, (err) => {
        if (err) api.sendMessage(`❌ Messenger failed to send file.`, threadID, messageID);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        api.unsendMessage(waitMsg.messageID);
      }, messageID);
    });

  } catch (err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
