const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "tiktok",
  credits: "Shaan Khan",
  hasPermission: 0,
  description: "TikTok se video download karein",
  usages: "[keyword/link]",
  commandCategory: "media",
  cooldowns: 5
};

module.exports.run = async ({ event, args, api }) => {
  const filePath = `./tiktok_${event.senderID}_${Date.now()}.mp4`;

  try {
    if (args.length === 0) {
      return api.sendMessage("Kripya koi keyword ya TikTok video link dein!", event.threadID, event.messageID);
    }

    // Reaction for searching state
    api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

    // Initial searching message
    api.sendMessage("Apki tiktok video dhond rahi ho please wait...", event.threadID, event.messageID);

    let query = args.join(" ");
    let searchURL = `https://uzair-rajput-mtx-dev-tiktok-downloader.onrender.com/api/search?q=${encodeURIComponent(query)}`;

    let searchResponse = await axios.get(searchURL, { timeout: 15000 });
    let resData = searchResponse.data;

    // Extracting video data dynamically across common API response key patterns
    let videoData = null;

    if (resData && Array.isArray(resData.result) && resData.result.length > 0) {
      videoData = resData.result[0];
    } else if (resData && Array.isArray(resData.data) && resData.data.length > 0) {
      videoData = resData.data[0];
    } else if (resData && resData.result) {
      videoData = resData.result;
    } else if (resData && resData.data) {
      videoData = resData.data;
    } else if (resData && (resData.play || resData.url || resData.download)) {
      videoData = resData;
    }

    if (!videoData) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
    }

    let videoURL = videoData.play || videoData.url || videoData.download || videoData.nowm || videoData.noWatermark;
    let videoTitle = videoData.title || videoData.caption || "TikTok Video";

    if (!videoURL) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("Video ka download link nahi mil saka!", event.threadID, event.messageID);
    }

    let writer = fs.createWriteStream(filePath);

    let videoStream = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      }
    });

    videoStream.data.pipe(writer);

    writer.on("finish", () => {
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      let customMessage = `🎥 ${videoTitle}\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉TIKTOK-VIDEO`;

      api.sendMessage({
        body: customMessage,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, event.messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
      api.sendMessage("⚠️ Video file save karne mein masla hua!", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error("TikTok Downloader Error:", error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    api.sendMessage("⚠️ Video download karne mein samasya hui!", event.threadID, event.messageID);
  }
};
