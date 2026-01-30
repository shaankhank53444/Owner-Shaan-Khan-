const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "ytshorts",
  hasPermission: 0,
  version: "1.2.0",
  description: "Automatically download YouTube Shorts videos using Roman Urdu messages",
  credits: "SHAAN",
  commandCategory: "Utility"
};

module.exports.handleEvent = async function ({ api, event }) {
  const message = event.body;
  if (!message) return;

  const youtubeShortsRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/shorts\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = message.match(youtubeShortsRegex);

  if (match) {
    const videoUrl = match[0];
    const findingMessage = await api.sendMessage(`⏳ | SHAAN ki taraf se video process ho rahi hai, thora intezar karen...`, event.threadID);

    try {
      // High-speed Stable API
      const apiUrl = `https://sandipbaruwal.onrender.com/ytdl?url=${encodeURIComponent(videoUrl)}`;
      const response = await axios.get(apiUrl);
      
      const videoData = response.data;
      const downloadUrl = videoData.video || videoData.url;
      const title = videoData.title || "Video";

      if (!downloadUrl) {
        throw new Error("Download link missing");
      }

      const filePath = path.resolve(__dirname, "cache", `${Date.now()}.mp4`);
      
      const videoStream = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const fileStream = fs.createWriteStream(filePath);
      videoStream.data.pipe(fileStream);

      fileStream.on("finish", async () => {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 48) { 
          await api.sendMessage(`❌ | File ka size boht bara hai (${fileSizeInMB.toFixed(2)}MB). Ye download nahi ho sakti.`, event.threadID);
          fs.unlinkSync(filePath);
          return;
        }

        await api.sendMessage({
          body: `✅ | SHAAN! Aap ki video "${title}" ready hai!`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID);

        fs.unlinkSync(filePath);
        api.unsendMessage(findingMessage.messageID);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ | Sorry, video download karne mein masla aya hai. API down ho sakti hai.`, event.threadID);
      api.unsendMessage(findingMessage.messageID);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Ye command event handle karti hai
};
