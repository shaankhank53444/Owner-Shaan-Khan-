const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "mc",
    aliases: ["music", "play", "song"],
    version: "1.1.3", // Version update
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download YouTube song",
    commandCategory: "Media",
    usages: "[songName] [type]",
    prefix: "true",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    let songName = args.join(" ");
    let type = "audio";

    if (args.length > 1 && (args[args.length - 1] === "audio" || args[args.length - 1] === "video")) {
      type = args.pop();
      songName = args.join(" ");
    }

    const processingMessage = await api.sendMessage("✅ Apki Request Jari Hai...", event.threadID, event.messageID);

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) return api.sendMessage("Koi result nahi mila.", event.threadID);

      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;
      const apiKey = "apim_6JUMreMurZU7RXAoJ4jUdpmejM03ozkotc65IR7tsb8";
      
      // API call
      const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download?id=${videoId}&type=${type}&apikey=${apiKey}`;
      
      const response = await axios.get(apiUrl);
      
      // Debugging: Agar 401 aaye toh console mein check karo response kya aa raha hai
      console.log("API Response Data:", response.data);

      if (!response.data || !response.data.downloadUrl) {
        throw new Error("API se download link nahi mila. (Check API Key)");
      }

      const downloadUrl = response.data.downloadUrl;
      const filename = `MC.${type === "audio" ? "mp3" : "mp4"}`;
      const downloadPath = path.join(__dirname, filename);

      // File download
      const fileResponse = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(downloadPath);
      fileResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      await api.sendMessage({
        attachment: fs.createReadStream(downloadPath),
        body: `🖤 Title: ${topResult.title}\n\nOwner: SHAAN KHAN`
      }, event.threadID, () => {
        fs.unlinkSync(downloadPath);
        api.unsendMessage(processingMessage.messageID);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(`Error: ${error.message}`, event.threadID);
    }
  },
};
