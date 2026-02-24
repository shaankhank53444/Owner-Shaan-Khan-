const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Gemini AI",
  description: "Image analysis or edit instructions using Gemini",
  commandCategory: "AI",
  usages: "reply [prompt]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Bhai image pe reply karo!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("✏️ Prompt likho, jaise: 'Is image ko describe karo'", threadID, messageID);
  }

  // 🔥 APNA REAL API KEY YAHAN DAALO 🔥
  const API_KEY = "AIzaSyDqqWL-0NpI9iQ7ACuwZlYYj3nMsiB6qkc"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    api.sendMessage("⏳ Gemini AI soch raha hai...", threadID, messageID);

    const imgUrl = messageReply.attachments[0].url;
    const responseImg = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(responseImg.data).toString('base64');

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    return api.sendMessage(`🤖 **Gemini AI:**\n\n${aiResponse}`, threadID, messageID);

  } catch (error) {
    console.error(error);
    const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    return api.sendMessage(`❌ Error: ${errMsg}`, threadID, messageID);
  }
};
