const axios = require("axios");

module.exports.config = {
  name: "metaai",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Meta AI + Gemini",
  description: "Gemini API powered AI chat",
  commandCategory: "chat",
  usages: "metaai <message>",
  cooldowns: 3
};

// 🔑 YAHAN APNI GEMINI API KEY DALO
const GEMINI_API_KEY = "AIzaSyAtI62p3mokteq5l-qD9tmx_4Fh-SWM3G8";

module.exports.run = async function ({ api, event, args }) {
  const userInfo = await api.getUserInfo(event.senderID);
  const name = userInfo[event.senderID].name;

  const userMessage = args.join(" ");
  if (!userMessage) {
    return api.sendMessage(
      "Kuchh likho na 😊\nExample: metaai hello",
      event.threadID,
      event.messageID
    );
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
Tum ek friendly aur romantic AI ho.
Tum Hinglish me baat karte ho.
User ka naam ${name} hai.
Short aur sweet reply do.

User: ${userMessage}
`
              }
            ]
          }
        ]
      }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Baby… thoda slow ho gaya 😕 phir try karo ❤️";

    return api.sendMessage(
      `Meta AI: ${reply}`,
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "Server thoda busy hai 😔 baad me try karo",
      event.threadID,
      event.messageID
    );
  }
};