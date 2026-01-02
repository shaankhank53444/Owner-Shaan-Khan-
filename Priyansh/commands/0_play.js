const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "play",
    version: "1.7.0",
    hasPermssion: 0,
    credits: "Shan", 
    description: "Search and download songs using high speed API",
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
      let attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        const thumbnailPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);

        try {
          const thumbResponse = await axios.get(video.thumbnail, { responseType: 'arraybuffer' });
          fs.writeFileSync(thumbnailPath, Buffer.from(thumbResponse.data));
          attachments.push(fs.createReadStream(thumbnailPath));
        } catch (e) {
          console.error("Thumbnail download error", e);
        }
        
        msg += `${i + 1}. ${video.title}\n⏱️ Duration: ${video.timestamp}\n\n`;
      }
      msg += `✨ *Reply with a number (1-6) to download.*`;

      return api.sendMessage({
        body: msg,
        attachment: attachments 
      }, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
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

    const waitMsg = await api.sendMessage(`📥 Downloading: "${selectedVideo.title}"...`, threadID);

    try {
      // API replaced with Kashif Raza's stable endpoint
      const apiUrl = `https://yt-tt.onrender.com/api/youtube/audio?url=${encodeURIComponent(selectedVideo.url)}`;
      
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      
      const response = await axios({
        method: 'get',
        url: apiUrl,
        responseType: 'stream',
        timeout: 120000 
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        const lastThumbRes = await axios.get(selectedVideo.thumbnail, { responseType: 'arraybuffer' });
        const lastThumbPath = path.join(cacheDir, `final_${Date.now()}.jpg`);
        fs.writeFileSync(lastThumbPath, Buffer.from(lastThumbRes.data));

        await api.sendMessage({
          body: `✅ **Success**\n🎵 Title: ${selectedVideo.title}`,
          attachment: [fs.createReadStream(filePath), fs.createReadStream(lastThumbPath)]
        }, threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (fs.existsSync(lastThumbPath)) fs.unlinkSync(lastThumbPath);
          api.unsendMessage(waitMsg.messageID);
        }, messageID);
      });

      writer.on('error', (e) => { throw e; });

    } catch (err) {
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage(`❌ Download Failed! Server busy ho sakta hai.`, threadID, messageID);
    }
  }
};
