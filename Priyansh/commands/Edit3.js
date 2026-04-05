const axios = require("axios");

module.exports.config = {
  name: "edit3", 
  version: "1.6.0",
  hasPermssion: 0, 
  credits: "Shaan Khan", 
  description: "Official Gemini Vision using Direct API Call",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;
  const apiKey = "AIzaSyDsYQwL5ZUZO9MuetPvDN0vBUhBhiyO8po";

  // 1. Image Check
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Please reply to an image!", threadID, messageID);
  }

  const prompt = args.join(" ") || "Describe this image";
  const waitMsg = await api.sendMessage("🔍 Gemini is processing...", threadID);

  try {
    // 2. Image to Base64
    const imageUrl = messageReply.attachments[0].url;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Data = Buffer.from(imageRes.data).toString('base64');

    // 3. Direct API Call to Google Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }]
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    // 4. Extracting Response
    const resultText = response.data.candidates[0].content.parts[0].text;

    await api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`✨ **Gemini Result**\n\n${resultText}`, threadID, messageID);

  } catch (error) {
    if (waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    console.error(error.response ? error.response.data : error.message);
    
    const errMsg = error.response?.data?.error?.message || error.message;
    return api.sendMessage(`❌ Error: ${errMsg}`, threadID, messageID);
  }
};
