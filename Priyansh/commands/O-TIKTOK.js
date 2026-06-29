const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "tiktok",
  credits: "Shaan Khan",
  hasPermission: 0,
  description: "TikTok video download karein",
  usages: "[link]",
  commandCategory: "media",
  cooldowns: 5
};

// Yahan apni sahi Priyanshu API Key dalein
const PRIYANSHU_API_KEY = "apim_41XuWvpF6tPq90Cvw503EYFY0UFvK53GHsGlIRxJ6hk";

module.exports.run = async ({ event, args, api }) => {
  const { threadID, messageID } = event;
  
  if (args.length === 0) {
    return api.sendMessage("Baraye meharbani koi TikTok video link dein!", threadID, messageID);
  }

  let tiktokLink = args[0];
  api.sendMessage("⏳ Video download ho rahi hai...", threadID, messageID);

  try {
    // Priyanshu API ka endpoint (Check karein agar unka tiktok downloader endpoint yahi hai)
    let apiURL = `https://priyanshuapi.qzz.io/api/runner/tiktok-downloader`;

    const response = await axios.post(apiURL, {
      url: tiktokLink
    }, {
      headers: {
        'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // API response ke mutabiq data extraction (Agar data.data.play milta hai)
    let videoURL = response.data?.data?.play || response.data?.result?.play;

    if (!videoURL) {
      return api.sendMessage("❌ Video nahi mil saki. API response empty hai.", threadID, messageID);
    }

    let filePath = `./tiktok_${event.senderID}.mp4`;
    const writer = fs.createWriteStream(filePath);

    const streamResponse = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });

    streamResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: "✅ Ye rahi aapki video!",
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ API error: " + (error.response?.data?.message || "Check your API Key/Link"), threadID, messageID);
  }
};
