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
  try {
    if (args.length === 0) {
      return api.sendMessage("Kripya koi keyword ya TikTok video link dein!", event.threadID, event.messageID);
    }

    // Reaction for searching state
    api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

    // Initial searching message
    api.sendMessage("Apki tiktok video dhond rahi ho please wait...", event.threadID, event.messageID);

    let query = args.join(" ");
    let searchURL = `https://uzairtikdown.dpdns.org/search?q=${encodeURIComponent(query)}`;

    let searchResponse = await axios.get(searchURL);
    
    // Adjust logic based on API output format
    let results = searchResponse.data.result || searchResponse.data.data || searchResponse.data;
    if (!results || results.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
    }

    let videoData = Array.isArray(results) ? results[0] : results;
    let videoURL = videoData.play || videoData.url || videoData.download;
    let videoTitle = videoData.title || "TikTok Video";

    let filePath = `./tiktok_${event.senderID}.mp4`;
    let writer = fs.createWriteStream(filePath);

    let videoStream = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });

    videoStream.data.pipe(writer);

    writer.on("finish", () => {
      // Set success reaction
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
      api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
      api.sendMessage("⚠️ Video file save karne me masla hua!", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    api.sendMessage("⚠️ Video download karne mein samasya hui!", event.threadID, event.messageID);
  }
};
