const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "play",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SARDAR RDX",
    description: "Search and download songs by reply",
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
      for (let i = 0; i < results.length; i++) {
        msg += `${i + 1}. ${results[i].title}\n⏱️ Duration: ${results[i].timestamp}\n\n`;
      }
      msg += `✨ *Please reply with a number (1-6) to download.*`;

      return api.sendMessage(msg, threadID, (err, info) => {
        // Mariai/Mirai handleReply system
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          results: results
        });
      }, messageID);

    } catch (error) {
      return api.sendMessage("Search error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;

    // Check agar reply dene wala wahi hai jisne search kiya tha
    if (handleReply.author !== senderID) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) {
      return api.sendMessage("❌ Invalid choice. Reply with 1-6.", threadID, messageID);
    }

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID); // Purana message delete

    const waitMsg = await api.sendMessage(`📥 Downloading: "${selectedVideo.title}"...`, threadID);

    try {
      const apiUrl = `https://anabot.my.id/api/download/ytmp3?url=${encodeURIComponent(selectedVideo.url)}&apikey=freeApikey`;
      const res = await axios.get(apiUrl);

      if (!res.data.success) throw new Error("API Error");

      const downloadUrl = res.data.data.result.urls;
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      
      const fileData = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileData.data));

      await api.sendMessage({
        body: `✅ **Success**\n🎵 Title: ${selectedVideo.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        fs.unlinkSync(filePath);
        api.unsendMessage(waitMsg.messageID);
      }, messageID);

    } catch (err) {
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    }
  }
};
