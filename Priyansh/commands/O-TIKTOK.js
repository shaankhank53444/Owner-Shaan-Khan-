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
  if (args.length === 0) return api.sendMessage("Kripya koi keyword ya TikTok video link dein!", event.threadID, event.messageID);

  api.setMessageReaction("⌛", event.messageID, () => {}, true);
  
  let searchMsgID;
  api.sendMessage("🔍 Searching...", event.threadID, (err, info) => { searchMsgID = info.messageID; }, event.messageID);

  try {
    let query = args.join(" ");
    let searchURL = `https://prince-sir-all-in-one-api.vercel.app/api/search/tiktoksearch?q=${encodeURIComponent(query)}`;
    
    let { data: searchResponse } = await axios.get(searchURL);
    if (!searchResponse.result || searchResponse.result.length === 0) {
      api.unsendMessage(searchMsgID);
      return api.sendMessage("Koi video nahi mila!", event.threadID, event.messageID);
    }

    let videoData = searchResponse.result[0];
    let videoURL = videoData.play;
    let videoTitle = videoData.title || "TikTok Video";

    // Path fix: File temporary folder mein save hogi
    let fileName = `tiktok_${Date.now()}.mp4`;
    let filePath = path.join(__dirname, 'cache', fileName);
    
    // Cache folder check
    if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));

    const writer = fs.createWriteStream(filePath);
    const response = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });

    response.data.pipe(writer);

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
      api.sendMessage("⚠️ Video download mein error aaya!", event.threadID, event.messageID);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

  } catch (e) {
    api.unsendMessage(searchMsgID);
    api.sendMessage("⚠️ Server error: " + e.message, event.threadID, event.messageID);
  }
};
