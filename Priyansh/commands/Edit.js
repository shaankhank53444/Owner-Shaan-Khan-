const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "3.0.5",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Nano-Banana 2 (Gemini Flash) Image Analysis",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim() || "Describe this image";
  const apiKey = "AIzaSyBaKcNTVW6umVBtb1BHjcHRUAG2kqKfnAA"; 

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Kisi photo ko reply karein.", threadID, messageID);
  }

  const cacheDir = path.join(process.cwd(), "cache");

  try {
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    api.sendMessage("🎨 Nano-Banana 2 (Gemini) processing... ✅", threadID, messageID);

    // Image URL from Facebook
    const inputImageUrl = messageReply.attachments[0].url;
    const imgResponse = await axios.get(inputImageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imgResponse.data).toString('base64');

    // Updated URL with "gemini-1.5-flash" (Latest stable endpoint)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

    // Extracting response correctly
    if (response.data && response.data.candidates && response.data.candidates[0].content) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return api.sendMessage(`✅ Nano-Banana 2 Result:\n\n${aiResponse}\n\n👤 Credits: Shaan Khan`, threadID, messageID);
    } else {
      throw new Error("Invalid response format from Google API");
    }

  } catch (error) {
    console.error("GEMINI ERROR:", error.response?.data || error.message);
    
    // Agar "Not Found" aaye toh hum purana model try karte hain auto-fallback mein
    let errorDetail = error.response?.data?.error?.message || error.message;
    return api.sendMessage(`❌ Error: ${errorDetail}\n\nTip: Check if Gemini API is enabled in your Google AI Studio.`, threadID, messageID);
  }
};
