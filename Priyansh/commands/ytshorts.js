const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "ytshorts",
  hasPermission: 0,
  version: "1.3.0",
  description: "SHAAN - YouTube Shorts Downloader (Stable API)",
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
    const findingMessage = await api.sendMessage(`⏳ | SHAAN ki taraf se video download ho rahi hai...`, event.threadID);

    try {
      // New Stable API (Faster and 100% Working)
      const apiUrl = `https://api.giftedtech.my.id/api/download/dl-ytdl?url=${encodeURIComponent(videoUrl)}`;
      const response = await axios.get(apiUrl);
      
      const resData = response.data;

      // API check (Success handling)
      if (!resData || resData.status !== 200 || !resData.result) {
        throw new Error("API Response Error");
      }

      const downloadUrl = resData.result.video_url || resData.result.download_url;
      const title = resData.result.title || "YouTube Video";

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

        if (fileSizeInMB > 25) { 
          await api.sendMessage(`❌ | File boht bari hai (${fileSizeInMB.toFixed(2)}MB). Ye limit 25MB se zyada hai.`, event.threadID);
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

      videoStream.data.on("error", (e) => {
        throw e;
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ | Sorry, video link nikalne mein masla aya. SHAAN, API change karke check karein.`, event.threadID);
      api.unsendMessage(findingMessage.messageID);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Event handled command
};
