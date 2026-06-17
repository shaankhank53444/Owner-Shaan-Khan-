const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

module.exports.config = {
  name: "mp4",
  version: "5.5.0",
  credits: "Shaan Khan",
  hasPermssion: 0,
  description: "Download video 360p",
  commandCategory: "Media",
  usages: "[video name]",
  cooldowns: 5
};

// API Fetcher
const getApi = async () => {
  const res = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return res.data.api;
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ Baraye meherbani video ka naam likhen.", threadID, messageID);

  try {
    const searchResults = await ytSearch(query);
    const videos = searchResults.videos.slice(0, 10);
    if (videos.length === 0) return api.sendMessage("❌ Koi results nahi mile.", threadID, messageID);

    let searchList = "🔍 YouTube Search Results (Select Number):\n\n";
    videos.forEach((v, i) => searchList += `${i + 1}. ${v.title} [${v.timestamp}]\n\n`);
    searchList += `\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`;

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
  if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) return api.sendMessage("❌ Galat choice!", threadID, messageID);

  const selectedVideo = handleReply.videos[choice - 1];
  api.unsendMessage(handleReply.messageID);
  const waitMsg = await api.sendMessage(`⏳ Fetching: ${selectedVideo.title}...`, threadID);

  try {
    const diptoApi = await getApi();
    // Using the proven API endpoint from your first file
    const { data } = await axios.get(`${diptoApi}/ytDl3?link=${selectedVideo.videoId}&format=mp4&quality=360`);

    const pathFile = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    const response = await axios.get(data.downloadLink, { responseType: "stream" });
    
    response.data.pipe(fs.createWriteStream(pathFile))
      .on("finish", () => {
        api.sendMessage({
          body: `🎬 Title: ${data.title}\nQuality: 360p\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`,
          attachment: fs.createReadStream(pathFile)
        }, threadID, () => fs.unlinkSync(pathFile), messageID);
        api.unsendMessage(waitMsg.messageID);
      });
  } catch (err) {
    api.unsendMessage(waitMsg.messageID);
    api.sendMessage(`❌ Error: API request failed.`, threadID, messageID);
  }
};
