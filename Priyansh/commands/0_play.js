const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "play",
    version: "1.2.0", // Version updated
    hasPermssion: 0,
    // Creator Credit Changed
    credits: "Shan", 
    description: "Search and download songs by reply with thumbnails", // Description updated
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
      await fs.ensureDir(cacheDir); // Ensure cache directory exists

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        const thumbnailPath = path.join(cacheDir, `thumbnail_${video.videoId}.jpg`);

        // Download thumbnail
        try {
          const thumbResponse = await axios.get(video.thumbnail, { responseType: 'arraybuffer' });
          fs.writeFileSync(thumbnailPath, Buffer.from(thumbResponse.data));
          attachments.push(fs.createReadStream(thumbnailPath));
        } catch (thumbError) {
          console.error("Error downloading thumbnail:", thumbError);
          // Agar thumbnail download na ho paye to bhi process continue rakhein
          attachments.push(null); // Placeholder for failed thumbnail
        }
        
        msg += `${i + 1}. ${video.title}\n⏱️ Duration: ${video.timestamp}\n\n`;
      }
      msg += `✨ *Please reply with a number (1-6) to download.*`;

      // Filter out null attachments (failed downloads)
      const validAttachments = attachments.filter(att => att !== null);

      return api.sendMessage({
        body: msg,
        attachment: validAttachments.length > 0 ? validAttachments : null
      }, threadID, (err, info) => {
        // Clean up downloaded thumbnails after sending
        validAttachments.forEach(att => {
          if (att && typeof att.path === 'string' && fs.existsSync(att.path)) {
            fs.unlinkSync(att.path);
          }
        });

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          results: results,
          // Save the original search query thumbnail to use later
          thumbnailUrl: results.map(video => video.thumbnail) 
        });
      }, messageID);

    } catch (error) {
      console.error("Search or thumbnail download error:", error);
      return api.sendMessage("Search error: " + error.message, threadID, messageID);
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
      const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(selectedVideo.url)}`;
      const res = await axios.get(apiUrl);

      if (!res.data || res.data.status !== 200) {
        throw new Error("API failed to generate link.");
      }

      const downloadUrl = res.data.result.download.url;
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      
      const fileData = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });

      fs.writeFileSync(filePath, Buffer.from(fileData.data));

      // Download thumbnail for the final song
      let finalAttachments = [fs.createReadStream(filePath)];
      const finalThumbnailPath = path.join(cacheDir, `final_thumbnail_${selectedVideo.videoId}.jpg`);
      
      try {
        const thumbResponse = await axios.get(selectedVideo.thumbnail, { responseType: 'arraybuffer' });
        fs.writeFileSync(finalThumbnailPath, Buffer.from(thumbResponse.data));
        finalAttachments.push(fs.createReadStream(finalThumbnailPath));
      } catch (thumbError) {
        console.error("Error downloading final thumbnail:", thumbError);
      }

      await api.sendMessage({
        body: `✅ **Success**\n🎵 Title: ${selectedVideo.title}\n🔗 [Original Video Link](${selectedVideo.url})`,
        attachment: finalAttachments
      }, threadID, () => {
        // Clean up all files
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(finalThumbnailPath)) fs.unlinkSync(finalThumbnailPath);
        api.unsendMessage(waitMsg.messageID);
      }, messageID);

    } catch (err) {
      console.error("Download error:", err);
      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ Error: " + (err.response?.status === 403 ? "Server blocked the request (403). Try again later." : err.message), threadID, messageID);
    }
  }
};
