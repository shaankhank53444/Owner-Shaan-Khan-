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

// Yahan apni token/key zaroor confirm kar lena
const PRIYANSHU_API_KEY = "apim_41XuWvpF6tPq90Cvw503EYFY0UFvK53GHsGlIRxJ6hk";

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
      // Priyanshu API ka endpoint (Ensure kar lena ki ye sahi hai)
      let searchURL = `https://priyanshuapi.qzz.io/api/tiktok/search?q=${encodeURIComponent(query)}`;

      try {
        let searchResponse = await axios.get(searchURL, {
          headers: { 'Authorization': `Bearer ${PRIYANSHU_API_KEY}` }
        });

        // Response structure check (data.result ya data.data)
        let videoData = searchResponse.data.result ? searchResponse.data.result[0] : searchResponse.data.data[0];
        
        if (!videoData) {
          api.unsendMessage(searchMsgID);
          return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
        }

        let videoURL = videoData.play; 
        let videoTitle = videoData.title || "TikTok Video";

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
        api.sendMessage("⚠️ Video download karne mein error aaya! API shayad unreachable hai.", event.threadID, event.messageID);
      }
    }, event.messageID);

  } catch (error) {
    api.sendMessage("⚠️ Server mein koi problem hai!", event.threadID, event.messageID);
  }
};
