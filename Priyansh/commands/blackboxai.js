const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "1.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "blackboxai bot with memory and context-aware auto-reply.",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {}; // Store conversation memory for each user
let isActive = true; // Default active for auto-reply

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Auto-reply logic: active ho aur message body ho
  if (!isActive || !body) return;

  // Check if user is replying to the bot
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  const isKeyword = body.toLowerCase().includes("hercai");

  if (isReplyToBot || isKeyword) {
    const userQuery = isKeyword ? body.toLowerCase().replace("hercai", "").trim() : body.trim();

    if (!userMemory[senderID]) userMemory[senderID] = { history: [] };
    userMemory[senderID].history.push({ sender: "user", message: userQuery });

    // Last 3 messages for context
    const recentConversation = userMemory[senderID].history.slice(-3).map(
      (msg) => `${msg.sender === "user" ? "User" : "Bot"}: ${msg.message}`
    ).join("\n");

    const apiURL = `https://uzairrajputapis.qzz.io/api/ai/gemini?question=${encodeURIComponent(recentConversation)}`;

    try {
      const response = await axios.get(apiURL);
      if (response && response.data && response.data.answer) {
        const botReply = response.data.answer;
        userMemory[senderID].history.push({ sender: "bot", message: botReply });
        return api.sendMessage(botReply, threadID, messageID);
      }
    } catch (error) {
      console.error("Auto-reply Error:", error.message);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Bot auto-reply ab active hai.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Bot auto-reply ab off hai.", threadID, messageID);
  } else if (command === "clear") {
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {};
      return api.sendMessage("🧹 Sabhi users ki history clear kar di gayi.", threadID, messageID);
    }
    if (userMemory[senderID]) {
      delete userMemory[senderID];
      return api.sendMessage("🧹 Aapki history clear kar di gayi.", threadID, messageID);
    }
    return api.sendMessage("⚠️ Koi history nahi mili.", threadID, messageID);
  }

  const userQuery = args.join(" ");
  if (!userQuery) return api.sendMessage("❓ Kuch puchiye! Example: hercai kaise ho?", threadID, messageID);

  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };
  userMemory[senderID].history.push({ sender: "user", message: userQuery });

  const recentConversation = userMemory[senderID].history.slice(-15).map(
    (msg) => `${msg.sender === "user" ? "User" : "Bot"}: ${msg.message}`
  ).join("\n");

  const apiURL = `https://uzairrajputapis.qzz.io/api/ai/gemini?question=${encodeURIComponent(recentConversation)}`;

  try {
    const response = await axios.get(apiURL);
    if (response && response.data && response.data.answer) {
      const botReply = response.data.answer;
      userMemory[senderID].history.push({ sender: "bot", message: botReply });
      return api.sendMessage(botReply, threadID, messageID);
    } else {
      return api.sendMessage("⚠️ API error, please try again.", threadID, messageID);
    }
  } catch (error) {
    return api.sendMessage("❌ Problem connected to API.", threadID, messageID);
  }
};
