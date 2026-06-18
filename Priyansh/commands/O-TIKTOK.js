const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

      try {
        let query = args.join(" ");
        let searchURL = `https://prince-sir-all-in-one-api.vercel.app/api/search/tiktoksearch?q=${encodeURIComponent(query)}`;

        let searchResponse = await axios.get(searchURL);

        if (!searchResponse.data || !searchResponse.data.result || searchResponse.data.result.length === 0) {
          api.unsendMessage(searchMsgID);
          return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
        }

        let videoData = searchResponse.data.result[0];
        let videoURL = videoData.play;
        let videoTitle = videoData.title || "TikTok Video";

        if (!videoURL) {
          api.unsendMessage(searchMsgID);
          return api.sendMessage("⚠️ Video ka download link nahi mil saka!", event.threadID, event.messageID);
        }

        // Fix: Folder path aur unique file name
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        let filePath = path.join(cacheDir, `tiktok_${event.senderID}_${Date.now()}.mp4`);
        
        const writer = fs.createWriteStream(filePath);

        const videoStream = await axios({
          url: videoURL,
          method: "GET",
          responseType: "stream",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
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
          });
        });

        writer.on("error", (err) => {
          api.unsendMessage(searchMsgID);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          api.sendMessage("⚠️ File save karte waqt error aaya!", event.threadID, event.messageID);
        });

      } catch (e) {
        api.unsendMessage(searchMsgID);
        api.sendMessage("⚠️ Video download karne mein error aaya! Link ya server down ho sakta hai.", event.threadID, event.messageID);
      }
    }, event.messageID);

  } catch (error) {
    api.sendMessage("⚠️ Server mein koi problem hai!", event.threadID, event.messageID);
  }
};
