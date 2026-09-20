const axios = require("axios");

module.exports.config = {
  name: "4kpro",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Upscale image to HD/4K quality",
  commandCategory: "image",
  usages: "[url / reply image]",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  let imageUrl = args[0];

  // Reply message check
  if (!imageUrl && event.type === "message_reply") {
    if (event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      if (event.messageReply.attachments[0].type === "photo") {
        imageUrl = event.messageReply.attachments[0].url;
      }
    }
  }

  if (!imageUrl) {
    return api.sendMessage("⚠️ Please provide an image URL or reply to an image with this command.", event.threadID, event.messageID);
  }

  try {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    const apiUrl = `https://xalman-apis.vercel.app/api/image-upscale?image=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { responseType: "stream" });

    api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    return api.sendMessage({
      body: "✨ Image Upscaled to 4K Quality!",
      attachment: response.data
    }, event.threadID, event.messageID);

  } catch (error) {
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    return api.sendMessage("❌ Failed to upscale image. Please try again later.", event.threadID, event.messageID);
  }
};
