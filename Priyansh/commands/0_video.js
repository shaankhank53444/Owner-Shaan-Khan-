const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mp4",
  version: "5.2.0",
  credits: "Shaan Khan",
  hasPermssion: 0,
  description: "Download video using Priyansh API Key from config.json",
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
  if (this.config.credits !== "Shaan Khan") {
    return api.sendMessage(`❌ [SYSTEM ERROR] : Credit violation detected.`, event.threadID);
  }

  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Baraye meherbani video ka naam likhen.", threadID, messageID);

  try {
    const yts = require("yt-search");
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 10);

    if (videos.length === 0) return api.sendMessage("❌ Koi results nahi mile.", threadID, messageID);

    let searchList = "🔍 YouTube Search Results (360p):\n\n";
    for (let i = 0; i < videos.length; i++) {
      searchList += `${i + 1}. ${videos[i].title} [${videos[i].timestamp}]\n\n`;
    }

    searchList += `\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO LIST`;

    return api.sendMessage(searchList, threadID, (err, info) => {
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
  if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
    return api.sendMessage("❌ Galat choice! 1-10 ke darmiyan koi number chunein.", threadID, messageID);
  }

  const selectedVideo = handleReply.videos[choice - 1];
  if (handleReply.messageID) api.unsendMessage(handleReply.messageID);

  const waitMsg = await api.sendMessage(`⏳ Aapki video fetch ho rahi hai...`, threadID);

  try {
    // config.json se key uthana
    const apiKey = global.config.Priyansh; 

    if (!apiKey) {
        api.unsendMessage(waitMsg.messageID);
        return api.sendMessage("❌ Error: config.json mein 'Priyansh' key missing hai!", threadID, messageID);
    }
    
    // API URL fetch karna
    const apiConfig = await axios.get(nix);
    const nixtubeApi = apiConfig.data.nixtube;

    // API Call with config key
    const res = await axios.get(nixtubeApi, {
        params: {
            url: selectedVideo.url,
            apikey: apiKey,
            type: "video",
            quality: "360"
        }
    });

    const downloadUrl = res.data.downloadUrl || (res.data.data && res.data.data.downloadUrl);
    
    if (!downloadUrl) {
        throw new Error("API ne link nahi diya. Key expire ho sakti hai.");
    }

    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    const response = await axios({ method: 'GET', url: downloadUrl, responseType: 'stream' });

    const writer = fs.createWriteStream(cachePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      const stats = fs.statSync(cachePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      api.sendMessage({
        body: `🖤 Title: ${selectedVideo.title}\n📊 Quality: 360p\n📦 Size: ${fileSizeInMB}MB\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        api.unsendMessage(waitMsg.messageID);
      }, messageID);
    });

    writer.on('error', (e) => { throw e; });

  } catch (err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    const errorDetail = err.response ? `API Error ${err.response.status}` : err.message;
    return api.sendMessage(`❌ Error: ${errorDetail}`, threadID, messageID);
  }
};
