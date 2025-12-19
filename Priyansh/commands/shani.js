const axios = require("axios");

// 🔑 اپنی Gemini API Key یہاں ڈالیں
const GEMINI_API_KEY = "AIzaSyDzaAU9hrAlpBfO-4uVlLFYrv9o74wCFA0";

// 🌸 Cute trigger names
const TRIGGER_NAMES = [
  "شانی", "shani", "deewani", "دیوانی", "kiran", "کیرن"
];

module.exports.config = {
  name: "shaniAuto",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Owner: Shaan Khan",
  description: "Auto Gemini Reply on Name Trigger",
  commandCategory: "NoPrefix",
  usages: "Just type the name",
  cooldowns: 5,
};

// Yeh function har message ko auto-scan karega
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body || event.senderID == api.getCurrentUserID()) return;

    const msg = event.body.toLowerCase();

    // Check if message contains any trigger name
    const isTriggered = TRIGGER_NAMES.some(name =>
      msg.includes(name.toLowerCase())
    );

    if (!isTriggered) return;

    // API Call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: event.body }] }]
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      api.sendMessage(
        `🌸 شانی:\n\n${reply}\n\n━━━━━━━━━━━━━━\n👑 Owner: Shaan Khan`,
        event.threadID,
        event.messageID
      );
    }
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
  }
};

// Isko khali chor den kyunki handleEvent kaam kar raha hai
module.exports.run = async function ({ api, event }) {};
