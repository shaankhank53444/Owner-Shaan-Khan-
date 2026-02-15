const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "tiktok",
  credits: "PRINCE MALHOTRA",
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

    // Reaction dena jab search shuru ho
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    // Searching message
    api.sendMessage("🔍 Aapki TikTok video search ho rahi hai, thoda intezar karein...", event.threadID, async (err, info) => {
      let searchMsgID = info.messageID;

      let query = args.join(" ");
      let searchURL = `https://prince-sir-all-in-one-api.vercel.app/api/search/tiktoksearch?q=${encodeURIComponent(query)}`;

      try {
        let searchResponse = await axios.get(searchURL);
        
        if (!searchResponse.data.result || searchResponse.data.result.length === 0) {
          api.unsendMessage(searchMsgID);
          return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
        }

        let videoData = searchResponse.data.result[0]; 
        let videoURL = videoData.play; 
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
          // Purana message delete karke video bhejna
          api.unsendMessage(searchMsgID);
          
          api.sendMessage({
            body: `✅  »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉𝑻𝑰𝑲𝑻𝑶𝑲-𝑽𝑰𝑫𝑬𝑶:\n🎥 ${videoTitle}`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            api.setMessageReaction("✅", event.messageID, () => {}, true);
          }, event.messageID);
        });

      } catch (e) {
        api.unsendMessage(searchMsgID);
        api.sendMessage("⚠️ Video download karne mein error aaya!", event.threadID, event.messageID);
      }
    }, event.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ Server mein koi problem hai!", event.threadID, event.messageID);
  }
};
