const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "tiktok",
  credits: "PRINCE MALHOTRA",
  hasPermission: 0,
  description: "TikTok video download karein",
  usages: "[link]",
  commandCategory: "media",
  cooldowns: 5
};

module.exports.run = async ({ event, args, api }) => {
  try {
    if (args.length === 0) {
      return api.sendMessage("Baraye meharbani koi TikTok video link dein!", event.threadID, event.messageID);
    }

    let tiktokLink = args[0];
    api.sendMessage("⏳ Video download ho rahi hai, zara intezar karein...", event.threadID, event.messageID);

    // Aapki di gayi specific API ka istemal
    let apiURL = `https://uzairrajputapis.qzz.io/api/downloader/tiktok?url=${encodeURIComponent(tiktokLink)}`;

    let res = await axios.get(apiURL);
    let data = res.data;

    // Check karein agar video URL mil gaya hai
    // Agar API ka response format alag hai, to yahan data structure adjust karna hoga
    let videoURL = data.data?.play || data.result?.play || data.video_url;

    if (!videoURL) {
      return api.sendMessage("❌ Video nahi mil saki. API response empty hai ya link galat hai.", event.threadID, event.messageID);
    }

    let filePath = `./tiktok_${event.senderID}.mp4`;
    const writer = fs.createWriteStream(filePath);

    const response = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });

    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: "✅ Ye rahi aapki video!",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ Video download karte waqt error aaya hai. API shayad offline hai.", event.threadID, event.messageID);
  }
};
