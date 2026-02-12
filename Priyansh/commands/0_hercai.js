const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "1.6.5",
  hasPermission: 0,
  credits: "SHANKAR SIR",
  description: "AI bot jo har language samajhta hai magar Roman Urdu mein baat karta hai",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein]",
  cooldowns: 5,
};

let userMemory = {};
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  // Sirf bot ke message par reply karne par trigger hoga
  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  // 1. Reaction dena (⌛)
  api.setMessageReaction("⌛", messageID, (err) => {}, true);
  
  // 2. Typing indicator on karna
  api.sendTypingIndicator(threadID);

  const userQuery = body.trim();
  if (!userMemory[senderID]) userMemory[senderID] = [];

  // Memory ko format karna
  const conversationHistory = userMemory[senderID].join("\n");
  
  // Stronger instruction for Roman Urdu
  const promptInstruction = `User Language: Any. Response Language: STRICTLY ROMAN URDU/HINDI. Context:\n${conversationHistory}\nUser: ${userQuery}\nBot:`;

  const apiURL = `https://shankar-gpt-3-api.vercel.app/api?message=${encodeURIComponent(promptInstruction)}`;

  try {
    const response = await axios.get(apiURL);
    let botReply = response.data.response || "Maaf kijiyega, mujhe samajh nahi aaya.";

    // History update (Limit to 15)
    userMemory[senderID].push(`User: ${userQuery}`);
    userMemory[senderID].push(`Bot: ${botReply}`);
    if (userMemory[senderID].length > 15) userMemory[senderID].splice(0, 2);

    // 3. Success reaction (✅)
    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage(botReply, threadID, messageID);
  } catch (error) {
    console.error("API Error:", error.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Server busy hai, thodi der baad try karein.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Hercai bot active hai.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Hercai bot off kar diya gaya.", threadID, messageID);
  } else if (command === "clear") {
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {};
      return api.sendMessage("🧹 Sabki history saaf kar di gayi.", threadID, messageID);
    }
    delete userMemory[senderID];
    return api.sendMessage("🧹 Aapki chat history clear ho gayi.", threadID, messageID);
  }
};
