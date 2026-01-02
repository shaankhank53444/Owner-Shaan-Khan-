const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "play",
    version: "1.4.0",
    hasPermssion: 0,
    credits: "Shan", 
    description: "Search and download songs using Anabot API",
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("❌ Please provide a song name!", threadID, messageID);

    try {
      const search = await yts(query);
      const results = search.videos.slice(0, 6);

      if (results.length === 0) return api.sendMessage("No results found.", threadID, messageID);

      let msg = `🎵 *YouTube Search Results* 🎵\n\n`;
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        msg += `${i + 1}. ${results[i].title}\n⏱️ Duration: ${results[i].timestamp}\n\n`;
      }
      msg += `✨ *Reply with a number (1-6) to download.*`;

      // Thumbnail for preview
      const thumbRes = await axios.get(results[0].thumbnail, { responseType: 'arraybuffer' });
      const thumbPath = path.join(cacheDir, `thumb_${senderID}.jpg`);
      fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(thumbPath)
      }, threadID, (err, info) => {
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          results: results
        });
      }, messageID);

    } catch (error) {
      return api.sendMessage("❌ Search error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (handleReply.author !== senderID) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) {
      return api.sendMessage("❌ Invalid choice. Reply with 1-6.", threadID, messageID);
    }

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID); 

    const waitMsg = await api.sendMessage(`📥 Downloading: "${selectedVideo.title}"...\nThis may take a few seconds.`, threadID);

    try {
      // --- Anabot API Integration ---
      const apiUrl = `https://api.anjann.me/api/ytmp3?url=${encodeURIComponent(selectedVideo.url)}`;
      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.download_url) {
        throw new Error("API did not return a valid download link.");
      }

      const downloadUrl = res.data.download_url;
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      
      const fileData = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      fs.writeFileSync(filePath, Buffer.from(fileData.data));

      await api.sendMessage({
        body: `✅ **Success**\n🎵 Title: ${selectedVideo.title}\n⏱️ Duration: ${selectedVideo.timestamp}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waitMsg.messageID);
      }, messageID);

    } catch (err) {
      console.error(err);
      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ Download failed. The file might be too large or the API is busy.", threadID, messageID);
    }
  }
};
