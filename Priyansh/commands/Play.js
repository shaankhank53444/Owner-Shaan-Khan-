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
      const videos = searchResults.videos.slice(0, 6); // Get top 6 results

      if (videos.length === 0) return send.reply("No results found.");

      let searchList = `🎵 *YouTube Search Results* 🎵\n\n`;
      videos.forEach((video, index) => {
        searchList += `${index + 1}. ${video.title}\n👤 ${video.author.name}\n⏱️ ${video.duration.timestamp}\n\n`;
      });

      searchList += `✨ *Reply with a number (1-6) to download.*`;

      // Send the list and wait for a reply
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
    if (handleReply.author !== senderID) return; // Only allow the searcher to reply

    const index = parseInt(body);
    if (isNaN(index) || index < 1 || index > handleReply.videos.length) {
      return send.reply("Invalid choice. Please reply with a number between 1 and 6.");
    }

    const selectedVideo = handleReply.videos[index - 1];
    api.unsendMessage(handleReply.messageID); // Remove the list message

    const loadingMsg = await api.sendMessage(`⏳ Processing: "${selectedVideo.title}"...`, threadID);

    try {
      const isVideo = body.toLowerCase().includes("video"); // Optional check if they type "1 video"
      const apiEndpoint = isVideo ? 'ytmp4' : 'ytmp3';
      const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(selectedVideo.url)}&apikey=freeApikey`;

      const fetchRes = await axios.get(apiUrl);
      if (!fetchRes.data.success) throw new Error("API failed to provide link.");

      const downloadUrl = fetchRes.data.data.result.urls;
      const filePath = path.join(__dirname, "cache", `${Date.now()}.${isVideo ? "mp4" : "mp3"}`);

      const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      await fs.ensureDir(path.join(__dirname, "cache"));
      fs.writeFileSync(filePath, downloadRes.data);

      await send.reply({
        body: `✅ **Downloaded**\n📌 Title: ${selectedVideo.title}\n🎤 Artist: ${selectedVideo.author}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
      api.unsendMessage(loadingMsg.messageID);

    } catch (err) {
      api.unsendMessage(loadingMsg.messageID);
      send.reply(`❌ Error: ${err.message}`);
    }
  }
};
