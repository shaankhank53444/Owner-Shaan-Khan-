const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Nano-Banana 2 (Auto-Model Switcher)",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim() || "Describe this image";
  const apiKey = "AIzaSyBaKcNTVW6umVBtb1BHjcHRUAG2kqKfnAA"; 

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Shaan bhai, kisi photo ko reply karein!", threadID, messageID);
  }

  try {
    api.sendMessage("🎨 Nano-Banana 2 (Gemini) processing... ✅", threadID, messageID);

    const inputImageUrl = messageReply.attachments[0].url;
    const imgResponse = await axios.get(inputImageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imgResponse.data).toString('base64');

    // Method to call Gemini API
    const callGemini = async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }]
        }]
      };
      return await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    };

    let response;
    try {
      // Pehle naya model try karein
      response = await callGemini("gemini-1.5-flash");
    } catch (e) {
      // Agar fail ho jaye to purana model try karein
      console.log("Switching to fallback model...");
      response = await callGemini("gemini-pro-vision");
    }

    if (response.data && response.data.candidates && response.data.candidates[0].content) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return api.sendMessage(`✅ Nano-Banana 2 Result:\n\n${aiResponse}\n\n👤 Credits: Shaan Khan`, threadID, messageID);
    } else {
      throw new Error("No valid response from Google.");
    }

  } catch (error) {
    console.error("FINAL ERROR:", error.response?.data || error.message);
    let errorDetail = error.response?.data?.error?.message || error.message;
    return api.sendMessage(`❌ Error: ${errorDetail}\n\nShaan bhai, AI Studio mein ja kar 'Gemini API' enable karein ya naya key banayein.`, threadID, messageID);
  }
};
