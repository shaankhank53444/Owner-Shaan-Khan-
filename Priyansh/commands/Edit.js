const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Nano-Banana 2 (Gemini 1.5 Flash) Image Vision & Edit",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim();
  const apiKey = "AIzaSyBaKcNTVW6umVBtb1BHjcHRUAG2kqKfnAA"; // Aapki di hui key

  if (!prompt) return api.sendMessage("❌ Prompt likhein! (Example: edit explain this image or make it better)", threadID, messageID);

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Kisi photo ko reply karein.", threadID, messageID);
  }

  const cacheDir = path.join(process.cwd(), "cache");
  const editedPath = path.join(cacheDir, `gemini_${Date.now()}.png`);

  try {
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    api.sendMessage("🎨 Nano-Banana 2 processing start... Powered by: Shaan Khan. ✅", threadID, messageID);

    // Step 1: Get Image from FB and convert to Base64
    const inputImageUrl = messageReply.attachments[0].url;
    const imgResponse = await axios.get(inputImageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imgResponse.data).toString('base64');

    // Step 2: Call Google Gemini API (Nano-Banana 2 Engine)
    // Hum Gemini 1.5 Flash use kar rahe hain jo image analysis aur editing instructions ke liye best hai
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64Image
            }
          }
        ]
      }]
    };

    const response = await axios.post(geminiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Step 3: Result handle karein
    // Note: Gemini text-based analysis deta hai. Agar aapko image manipulation (filter/edit) chahiye
    // toh aap niche wala message display kar sakte hain.
    
    return api.sendMessage(`✅ Nano-Banana 2 Response:\n\n${aiResponse}\n\n👤 Edited by: Shaan Khan`, threadID, messageID);

  } catch (error) {
    console.error("GEMINI ERROR:", error.response?.data || error.message);
    let errorDetail = error.response?.data?.error?.message || error.message;
    return api.sendMessage(`❌ Error: ${errorDetail}`, threadID, messageID);
  }
};
