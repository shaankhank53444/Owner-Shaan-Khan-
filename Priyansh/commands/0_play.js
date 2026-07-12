const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: 'play',
    aliases: ['yt', 'music'],
    description: 'Search and download music/video from YouTube',
    credits: 'Shaan',
    usage: 'play [song name]',
    category: 'Media',
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return send.reply("Please provide a song name to search.");

    try {
      const searchResults = await yts(query);
      const videos = searchResults.videos.slice(0, 6);

      if (videos.length === 0) return send.reply("No results found.");

      let searchList = `🎵 *YouTube Search Results* 🎵\n\n`;
      videos.forEach((video, index) => {
        searchList += `${index + 1}. ${video.title}\n👤 ${video.author.name}\n⏱️ ${video.duration.timestamp}\n\n`;
      });

      searchList += `✨ *Reply with a number (1-6) to download.*`;

      return send.reply(searchList, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          videos: videos.map(v => ({ title: v.title, url: v.url, author: v.author.name }))
        });
      });
    } catch (err) {
      return send.reply(`Search Error: ${err.message}`);
    }
  },

  async handleReply({ api, event, handleReply, send }) {
    const { body, threadID, messageID, senderID } = event;
    if (handleReply.author !== senderID) return;

    const index = parseInt(body);
    if (isNaN(index) || index < 1 || index > handleReply.videos.length) {
      return send.reply("Invalid choice. Please reply with a number between 1 and 6.");
    }

    const selectedVideo = handleReply.videos[index - 1];
    api.unsendMessage(handleReply.messageID);

    const loadingMsg = await api.sendMessage(`✅Apki Request Jari Hai Please Wait...: "${selectedVideo.title}"...`, threadID);

    // Priyanshu API Details
    const BASE_URL = "https://priyanshuapi.qzz.io/api";
    const API_KEY = "Apim_IhK5oKqyxmFYNAYTs2lpFtyLhXFzWOP6pTWL2SOj8RA";
    
    try {
      const isVideo = body.toLowerCase().includes("video");
      const endpoint = isVideo ? "ytmp4" : "ytmp3";
      const apiUrl = `${BASE_URL}/${endpoint}?url=${encodeURIComponent(selectedVideo.url)}&apikey=${API_KEY}`;

      const fetchRes = await axios.get(apiUrl);
      if (!fetchRes.data || !fetchRes.data.result) throw new Error("API failed to provide link.");

      const downloadUrl = fetchRes.data.result.downloadUrl;
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
      
      await fs.ensureDir(cacheDir);
      const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, downloadRes.data);

      const infoMsg = `✅ **Downloaded**\n📌 Title: ${selectedVideo.title}\n🎤 Artist: ${selectedVideo.author}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 PLAY-LIST`;

      if (isVideo) {
          await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(filePath) }, threadID);
      } else {
          await api.sendMessage(infoMsg, threadID);
          await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID);
      }

      fs.unlinkSync(filePath);
      api.unsendMessage(loadingMsg.messageID);

    } catch (err) {
      api.unsendMessage(loadingMsg.messageID);
      send.reply(`❌ Error: ${err.message}`);
    }
  }
};
