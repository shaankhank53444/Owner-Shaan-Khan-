module.exports.config = {
  name: "pin-video",
  version: "0.0.2",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Pinterest video downloader",
  commandCategory: "tools",
  usages: "pin <pinterest_url>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");

    const pinUrl = args[0];
    if (!pinUrl || !pinUrl.startsWith("http")) {
        return api.sendMessage("❌ Kripya valid Pinterest video link dein!\nExample: pin https://pin.it/6z8TIEFvz", event.threadID, event.messageID);
    }

    try {
        api.sendMessage("⏳ Video download ho rahi hai, kripya intezaar karein...", event.threadID, event.messageID);

        // API Request
        const apiUrl = `https://api.nexray.eu.cc/downloader/pinterest?url=${encodeURIComponent(pinUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if video link exists in API response (adjust according to API schema, usually data.url or data.video)
        const videoUrl = data.url || data.videoUrl || data.result;

        if (!videoUrl) {
            return api.sendMessage("❌ Video link fetch karne mein safal nahi ho sake. Dusra link try karein.", event.threadID, event.messageID);
        }

        // Stream the video file
        const videoStream = await axios.get(videoUrl, { responseType: "stream" });

        var msg = {
            body: `「  PINTEREST VIDEO  」\n\n★᭄𝗖𝗿𝗲𝗱𝗶𝘁'𝘀 : 𓆩⃝𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡𓆩๏𓆪`,
            attachment: videoStream.data
        };

        return api.sendMessage(msg, event.threadID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Kuch galat ho gaya! Kripya baad mein try karein.", event.threadID, event.messageID);
    }
};
