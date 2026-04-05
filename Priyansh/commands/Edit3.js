const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit3", 
  version: "1.5.0",
  hasPermssion: 0, 
  credits: "Shaan Khan", // Aapka naam set kar diya hai
  description: "Official Gemini AI Image Vision (Fixed Key)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  // 1. Validation: Check if it's a reply to an image
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "⚠️ Please reply to an image with your prompt!\n\nExample: edit3 what is in this photo?",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Please reply to an image file!", threadID, messageID);
  }

  const prompt = args.join(" ") || "Describe this image";
  const processingMsg = await api.sendMessage("🔍 Gemini is processing your image...", threadID);

  try {
    // 2. Official Gemini Setup with your Key
    const genAI = new GoogleGenerativeAI("AIzaSyDsYQwL5ZUZO9MuetPvDN0vBUhBhiyO8po");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Image Download & Base64 conversion
    const imageUrl = attachment.url;
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Data = Buffer.from(response.data).toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    // 4. Content Generation
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    // 5. Output result
    await api.unsendMessage(processingMsg.messageID);
    return api.sendMessage(`✨ **Gemini Vision Result**\n\n${text}`, threadID, messageID);

  } catch (error) {
    console.error("Gemini Fixed Error:", error);
    if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
    
    let errorMsg = "❌ An error occurred while processing the image.";
    if (error.message.includes("API_KEY_INVALID")) errorMsg = "❌ Your Gemini API Key is invalid or expired.";
    
    return api.sendMessage(errorMsg, threadID, messageID);
  }
};
