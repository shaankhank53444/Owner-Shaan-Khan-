const axios = require("axios");

// 🔑 اپنی Gemini API Key یہاں ڈالیں
const GEMINI_API_KEY = "AIzaSyDzaAU9hrAlpBfO-4uVlLFYrv9o74wCFA0";

// 🌸 Cute trigger names (جو بھی یہ بولے گا bot reply کرے گا)
const TRIGGER_NAMES = [
  "شانی",
  "shani",
  "deewani",
  "دیوانی",
  "kiran",
  "کیرن"
];

module.exports.config = {
  name: "shaniAuto",
  version: "1.0.0",
  credits: "Owner: Shaan Khan",
  description: "Auto Gemini Reply on Cute Name"
};

module.exports.run = async function ({ api, event }) {
  try {
    if (!event.body) return;

    const msg = event.body.toLowerCase();

    // check trigger name
    const isTriggered = TRIGGER_NAMES.some(name =>
      msg.includes(name.toLowerCase())
    );

    if (!isTriggered) return;

    // typing indicator
    api.sendMessage("🌸 شانی سوچ رہی ہے...", event.threadID);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: event.body
              }
            ]
          }
        ]
      }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤍 شانی ابھی خاموش ہے...";

    api.sendMessage(
      `🌸 شانی:\n\n${reply}\n\n━━━━━━━━━━━━━━\n👑 Owner: Shaan Khan`,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.log("Gemini Error:", err);
  }
};