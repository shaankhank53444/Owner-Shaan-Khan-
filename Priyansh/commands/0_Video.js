const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp4",
  version: "4.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search 1-10 videos and download using Nixtube API",
  commandCategory: "Media",
  usages: "[video name]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "yt-search": ""
  }
};

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports.run = async function({ api, event, args }) {
  // Credits check - isko mat hatana warna error dega aapka original logic
  if (this.config.credits !== "Shaan Khan") {
    return api.sendMessage(`❌ [SYSTEM ERROR] : Credit violation detected.`, event.threadID);
  }

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Please provide a video name.", threadID, messageID);

  try {
    const yts = require("yt-search");
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 10);

    if (videos.length === 0) return api.sendMessage("❌ No results found.", threadID, messageID);

    let searchList = "🔍 YouTube Search Results:\n\n";
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
      // Thumbnails delete karne ke liye
      attachments.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });

      const replyObj = {
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        videos: videos
      };
      
      if (global.client && global.client.handleReply) {
        global.client.handleReply.push(replyObj);
      } else if (global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.set(info.messageID, replyObj);
      }
    }, messageID);

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (handleReply.author !== senderID) return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > 10) {
    return api.sendMessage("❌ Invalid choice! Choose 1-10.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  if (handleReply.messageID) api.unsendMessage(handleReply.messageID);

  const waitMsg = await api.sendMessage(`✅ Apki Request Jari: ${selectedVideo.title}\nPlease wait...`, threadID);

  try {
    const apiConfig = await axios.get(nix);
    const nixtubeApi = apiConfig.data.nixtube;
    
    const res = await axios.get(`${nixtubeApi}?url=${encodeURIComponent(selectedVideo.url)}&type=video`);
    const downloadUrl = res.data.downloadUrl || res.data.link;

    if (!downloadUrl) throw new Error("API se link nahi mila.");

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    
    // Messenger limit check (25MB)
    if (videoRes.data.length > 26000000) {
        throw new Error("Video file 25MB se badi hai, Messenger allow nahi karega.");
    }

    fs.writeFileSync(cachePath, Buffer.from(videoRes.data));

    return api.sendMessage({
      body: `🏷️ Title: ${selectedVideo.title}\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.unsendMessage(waitMsg.messageID);
    }, messageID);

  } catch (err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
