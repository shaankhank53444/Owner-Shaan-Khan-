const axios = require("axios");

module.exports.config = {
  name: "dewani",
  version: "1.6.1",
  hasPermission: 0,
  credits: "uzairrajput",
  description: "Priyanshu API se chalti AI Dewani bot",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein ya 'dewani' likhein]",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

let userMemory = {};
let isActive = true;

// **System Prompt (Personality Setting)**
const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

// **Priyanshu API Settings**
const API_URL = "https://priyanshuapi.xyz/api/runner/priyanshu-ai";
const API_KEY = "Priyanshu-f1k7-6p5y-3e9r"; // Agar aapke paas apni key hai to yahan change karein

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!isActive || !body) return;

  // Check agar 'dewani' likha ho ya bot ko reply kiya ho
  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMentioningDewani && !isReplyToBot) return;

  // User Memory initialize (History for API)
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const userQuery = body.trim();

  // Reaction send karein
  api.setMessageReaction('⌛', messageID, () => {}, true);

  try {
    // Priyanshu API Payload
    const payload = {
      prompt: userQuery,
      model: "priyansh-ai",
      messages: [
        { role: "system", content: systemPrompt },
        ...userMemory[senderID],
        { role: "user", content: userQuery }
      ],
      persona: "friendly"
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Response extract karna
    let botReply = response.data?.data?.choices?.[0]?.message?.content || "Uff! Mujhe samajh nahi ai baby! 😕";
    botReply = botReply.trim();

    // Memory update karein (Role-based for next call)
    userMemory[senderID].push({ role: "user", content: userQuery });
    userMemory[senderID].push({ role: "assistant", content: botReply });

    // History limit (Keep last 8 messages)
    if (userMemory[senderID].length > 8) userMemory[senderID].splice(0, 2);

    api.setMessageReaction('✅', messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.error("Priyanshu API Error:", error.response?.data || error.message);
    api.setMessageReaction('❌', messageID, () => {}, true);
    return api.sendMessage("Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Dewani bot ab active hai!", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Dewani bot ab off hai.", threadID, messageID);
  } else if (command === "clear") {
    userMemory[senderID] = [];
    return api.sendMessage("🧹 Baby, maine hamari purani baatein bhula di hain! naya start karte hain. 😉", threadID, messageID);
  }
};
