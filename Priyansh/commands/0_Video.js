const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "MP4",
  version: "4.8.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search and download videos with fixed sender logic",
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
    return api.sendMessage("❌ [PROTECTION] Credit Warning!", event.threadID);
  }

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a song name, Baby!", threadID, messageID);

  try {
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 6); // Set to 6 results

    if (videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 **YouTube Search Results:**\n\n";
    // Thumbnail wala part hata diya hai taaki speed fast ho aur loading error na aaye
    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp}]\n\n`;
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
  if (this.config.credits !== "Shaan Khan") return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
    return api.sendMessage("❌ Galat choice! 1-6 ke beech reply dein.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);

  // Sirf request message, no title
  const downloadWait = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

  try {
    const apiUrl = `https://api.giftedtech.my.id/api/download/dlmp4?url=${encodeURIComponent(selectedVideo.url)}&apikey=gifted`;
    const res = await axios.get(apiUrl);

    const downloadUrl = res.data.result.download_url || res.data.result.url;

    if (!downloadUrl) throw new Error("Could not fetch download link.");

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    
    // Download logic with Stream to handle file properly
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(cachePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // Send video after download is complete
      const msg = {
        body: `🎬 Title: ${selectedVideo.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`,
        attachment: fs.createReadStream(cachePath)
      };

      await api.sendMessage(msg, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        api.unsendMessage(downloadWait.messageID);
      }, messageID);
    });

    writer.on('error', (e) => {
        throw e;
    });

  } catch (err) {
    if (downloadWait) api.unsendMessage(downloadWait.messageID);
    return api.sendMessage(`❌ API Error: Downloader server busy or link expired.`, threadID, messageID);
  }
};
