const axios = require("axios");

module.exports.config = {
  name: "upscale",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Image Upscale (HD Quality)",
  commandCategory: "image",
  usages: "[reply image]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const { messageReply, threadID, messageID } = event;

    // Check image reply
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length == 0) {
      return api.sendMessage("⚠️ Reply to an image to upscale.", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;

    // API request
    const apiUrl = `https://priyanshuapi.xyz/api/runner/upscale/upscale?image=${encodeURIComponent(imageUrl)}`;

    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.result) {
      return api.sendMessage("❌ Failed to upscale image.", threadID, messageID);
    }

    // Send result image
    const img = (await axios.get(res.data.result, { responseType: "stream" })).data;

    return api.sendMessage({
      body: "✨ Image Upscaled Successfully!",
      attachment: img
    }, threadID, messageID);

  } catch (err) {
    console.log(err);
    return api.sendMessage("❌ Error while processing.", event.threadID, event.messageID);
  }
};