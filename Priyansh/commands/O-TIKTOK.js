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

    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    api.sendMessage("🔍 Aapki TikTok video search ho rahi hai, thoda intezar karein...", event.threadID, async (err, info) => {
      if (err) return;
      let searchMsgID = info.messageID;

      let query = args.join(" ");
      // Naya API Endpoint integration
      let searchURL = `https://uzair-rajput-mtx-dev-tiktok-downloader.onrender.com/tiktok?url=${encodeURIComponent(query)}`;

      try {
        let searchResponse = await axios.get(searchURL);
        let resData = searchResponse.data;

        // Response structure check (Direct link ya result array/object)
        let videoURL = resData.noWatermark || resData.watermark || resData.play || (resData.data && resData.data.play);
        let videoTitle = resData.title || resData.caption || "TikTok Video";

        if (!videoURL) {
          api.unsendMessage(searchMsgID);
          return api.sendMessage("⚠️ Video ka download link nahi mil saka!", event.threadID, event.messageID);
        }

        let filePath = `./tiktok_${event.senderID}_${Date.now()}.mp4`;
        let writer = fs.createWriteStream(filePath);

        let videoStream = await axios({
          url: videoURL,
          method: "GET",
          responseType: "stream"
        });

        videoStream.data.pipe(writer);

        writer.on("finish", () => {
          api.unsendMessage(searchMsgID);

          api.sendMessage({
            body: `✅ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇👇👇𝑻𝑰𝑲𝑻𝑶𝑲-𝑽𝑰𝑫𝑬𝑶:\n\n🎥 ${videoTitle}`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            api.setMessageReaction("✅", event.messageID, () => {}, true);
          }, event.messageID);
        });

        writer.on("error", (err) => {
          api.unsendMessage(searchMsgID);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          api.sendMessage("⚠️ File save karne mein koi masala aaya!", event.threadID, event.messageID);
        });

      } catch (e) {
        api.unsendMessage(searchMsgID);
        api.sendMessage("⚠️ Video download karne mein error aaya! API server down ya unreachable hai.", event.threadID, event.messageID);
      }
    }, event.messageID);

  } catch (error) {
    api.sendMessage("⚠️ Server mein koi problem hai!", event.threadID, event.messageID);
  }
};
