const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");

module.exports.config = {
  name: "tiktok",
  credits: "SHAAN KHAN",
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

    let query = args.join(" ");
    let searchURL = `https://prince-sir-all-in-one-api.vercel.app/api/search/tiktoksearch?q=${encodeURIComponent(query)}`;

    let searchResponse = await axios.get(searchURL);
    if (!searchResponse.data.result || searchResponse.data.result.length === 0) {
      return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
    }

    let videoData = searchResponse.data.result[0]; // Pehla video chunein
    let videoURL = videoData.play; // Bina watermark wala link
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
      api.sendMessage({
        body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉𝑻𝑰𝑲𝑻𝑶𝑲 𝑽𝑰𝑫𝑬𝑶 ${videoTitle}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ Video download karne mein samasya hui!", event.threadID, event.messageID);
  }
};