const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports.config = {
  name: "edit", // Command name 'edit' rakha hai
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Edit images using Gemini AI with Username",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type, senderID } = event;

  // 1. Check if replying to an image
  if (type !== "message_reply" || !messageReply) {
    return api.sendMessage(
      `⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: .edit [prompt]\n\nExample: .edit make the cat blue\n\n✨ Powered by: Shaan Khan`,
      threadID,
      messageID
    );
  }

  if (!messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage(
      `❌ Please reply to a valid image!`,
      threadID,
      messageID
    );
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage(`❌ Please provide an edit prompt!`, threadID, messageID);
  }

  // User Name extraction logic
  let senderName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    senderName = userInfo[senderID].name;
  } catch (err) {
    console.log("Error getting user name:", err);
  }

  const processingMsg = await api.sendMessage(
    `🎨 Processing your image request...\n⏳ Shaan Khan's AI is analyzing...\n\n👤 Requested by: ${senderName}`,
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    // Using your provided API Key
    const genAI = new GoogleGenerativeAI("AIzaSyBIkaNEcZLektmSx5a1ewKjpdnUE-PjK7w");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageUrl = messageReply.attachments[0].url;
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    const imagePart = {
      inlineData: {
        data: Buffer.from(imgRes.data).toString("base64"),
        mimeType: "image/jpeg"
      }
    };

    // Calling Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    api.unsendMessage(processingMsg.messageID);

    return api.sendMessage(
      `✨ Image Processed!\n\n📝 AI Response: ${text}\n\n👤 Requested by: ${senderName}\n🎨 Credits: Shaan Khan`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error(error);
    if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
    api.sendMessage(`❌ Error: ${error.message}\n\n✨ Powered by: Shaan Khan`, threadID, messageID);
  }
};
