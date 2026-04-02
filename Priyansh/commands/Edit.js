const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Nano-Banana 2 (Gemini 1.5 Flash Latest)",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim() || "Describe this image in detail";
  // Aapki Gemini API Key
  const apiKey = "AIzaSyBaKcNTVW6umVBtb1BHjcHRUAG2kqKfnAA"; 

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Shaan bhai, kisi photo ko reply karein!", threadID, messageID);
  }

  try {
    api.sendMessage("🎨 Nano-Banana 2 (Gemini) processing... ✅", threadID, messageID);

    // Step 1: Get Image and convert to Base64
    const inputImageUrl = messageReply.attachments[0].url;
    const imgResponse = await axios.get(inputImageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imgResponse.data).toString('base64');

    // Step 2: Use Stable v1 Endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
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

    const response = await axios.post(geminiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Step 3: Handle Final Response
    if (response.data && response.data.candidates && response.data.candidates[0].content) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return api.sendMessage(`✅ Nano-Banana 2 Result:\n\n${aiResponse}\n\n👤 Credits: Shaan Khan`, threadID, messageID);
    } else {
      return api.sendMessage("❌ Model respond nahi kar raha, AI Studio mein quota check karein.", threadID, messageID);
    }

  } catch (error) {
    console.error("GEMINI ERROR:", error.response?.data || error.message);
    
    // Agar phir bhi error aaye toh user ko detail dikhayein
    let errorDetail = error.response?.data?.error?.message || error.message;
    
    // Special check for "Model Not Found"
    if (errorDetail.includes("not found")) {
        return api.sendMessage("❌ Model name issue! Script mein 'gemini-1.5-flash' ko 'gemini-pro-vision' likh kar check karein.", threadID, messageID);
    }

    return api.sendMessage(`❌ Error: ${errorDetail}`, threadID, messageID);
  }
};
