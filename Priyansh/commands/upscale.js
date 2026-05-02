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
  const { messageReply, threadID, messageID } = event;

  try {
    // 1. Validation: Check if reply contains an image
    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("⚠️ Please reply to an image to upscale it.", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    api.sendMessage("⏳ Processing your image, please wait...", threadID, messageID);

    // 2. API Configuration
    const apiKey = "apim_0sfMwFkD-BxTofK-WdpdUSRlO974Bjey72AIfQQ0aII";
    const apiUrl = `https://priyanshuapi.xyz/api/runner/upscale/upscale?image=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

    // 3. Fetching the upscaled image
    // Note: Agar API directly image return karti hai, toh responseType 'stream' hona chahiye
    const response = await axios.get(apiUrl, { responseType: "stream" });

    // 4. Send the stream directly as attachment
    return api.sendMessage({
      body: "✨ Your image has been upscaled to HD!",
      attachment: response.data
    }, threadID, messageID);

  } catch (err) {
    // Console mein error print hoga taaki aap dekh sakein kya masla hai
    console.error("Upscale Error:", err.message);
    
    let errorMessage = "❌ An error occurred while processing the image.";
    if (err.response && err.response.status === 403) {
      errorMessage = "❌ API Key invalid hai ya limit khatam ho gayi hai.";
    } else if (err.response && err.response.status === 404) {
      errorMessage = "❌ API link kaam nahi kar raha.";
    }

    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
