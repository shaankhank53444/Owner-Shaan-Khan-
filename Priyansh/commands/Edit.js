const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Gemini",
  description: "Edit images using NanoBanana (Gemini 3 Flash)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  // 1. Validation: Image reply check
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Please reply to a photo with your edit command!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Please provide an instruction (e.g., 'make it vintage style')", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;
  const processingMsg = await api.sendMessage("⌛ NanoBanana (Gemini) image processing start ho rahi hai...", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    // Nayi Working API Endpoint (Gemini NanoBanana Logic)
    const apiUrl = `https://api.kenliejugarap.com/nanobanana-edit/`;
    
    const response = await axios.get(apiUrl, {
      params: {
        prompt: prompt,
        imgurl: imageUrl
      }
    });

    // API response check (kuch APIs 'result' ya 'url' bhejti hain)
    const resultUrl = response.data.result || response.data.url || response.data.imageUrl;

    if (!resultUrl) {
      throw new Error("API response mein image URL nahi mila.");
    }

    const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);
    const imageStream = await axios({
      url: resultUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    imageStream.data.pipe(writer);

    writer.on("finish", () => {
      api.unsendMessage(processingMsg.messageID);
      api.sendMessage({
        body: `✅ Edited successfully!\n\nModel: Gemini NanoBanana\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

  } catch (error) {
    console.error(error);
    api.unsendMessage(processingMsg.messageID);
    api.sendMessage(`❌ API Error: ${error.message}\nHo sakta hai server down ho, thodi der baad try karein.`, threadID, messageID);
  }
};
