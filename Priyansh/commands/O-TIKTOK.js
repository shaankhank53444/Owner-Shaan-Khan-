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
    api.sendMessage("Video download ho rahi hai, zara intezar karein...", event.threadID, event.messageID);

    // Nayi aur stable API ka istemal
    let apiURL = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(tiktokLink)}`;

    let res = await axios.get(apiURL);
    let data = res.data;

    if (!data || !data.video || !data.video.noWatermark) {
      return api.sendMessage("Video nahi mil saki. Link check karein ya server down ho sakta hai.", event.threadID, event.messageID);
    }

    let videoURL = data.video.noWatermark;
    let filePath = `./tiktok_${event.senderID}.mp4`;

    let videoStream = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: "Ye rahi aapki video!",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ Video download karte waqt error aaya hai. Shayad link galat hai!", event.threadID, event.messageID);
  }
};
