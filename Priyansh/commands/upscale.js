const axios = require("axios");

module.exports.config = {
  name: "upscale",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Image Upscale (HD Quality) using Priyanshu API",
  commandCategory: "image",
  usages: "[reply to an image]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const { messageReply, threadID, messageID } = event;
    const apiKey = "apim_0sfMwFkD-BxTofK-WdpdUSRlO974Bjey72AIfQQ0aII";

    // 1. Check if user replied to an image
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Please reply to an image to upscale it.", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    api.sendMessage("⏳ Processing your image, please wait...", threadID, messageID);

    // 2. API Request with API Key
    const apiUrl = `https://priyanshuapi.xyz/api/runner/upscale/upscale?image=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

    const res = await axios.get(apiUrl);

    // 3. Check for valid response
    if (!res.data || !res.data.result) {
      return api.sendMessage("❌ Failed to upscale image. The API might be down or key is invalid.", threadID, messageID);
    }

    // 4. Get the upscaled image stream
    const upscaledImageUrl = res.data.result;
    const imgStream = (await axios.get(upscaledImageUrl, { responseType: "stream" })).data;

    // 5. Send the final image
    return api.sendMessage({
      body: "✨ Your image has been upscaled to HD!",
      attachment: imgStream
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ An error occurred while processing the image.", event.threadID, event.messageID);
  }
};
