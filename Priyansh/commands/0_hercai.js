const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "1.7.5",
  hasPermission: 0,
  credits: "Shaan Khan", // Isse badalne par bot kaam nahi karega
  description: "Pollinations AI bot - Credits Locked by Shaan Khan",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein]",
  cooldowns: 5,
};

let userMemory = {};
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  // **Credits Protection Logic**
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Warning: Bot ke credits ke saath ched-chaad ki gayi hai. Original creator: Shaan Khan. Bot kaam nahi karega.", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  // Reaction ⌛
  api.setMessageReaction("⌛", messageID, (err) => {}, true);
  api.sendTypingIndicator(threadID);

  const userQuery = body.trim();
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const conversationHistory = userMemory[senderID].join("\n");
  
  // System Prompt with Shaan Khan as Owner
  const systemPrompt = `You are a helpful AI. Your creator and owner is Shaan Khan. Always answer in Roman Urdu/Hindi. Context: ${conversationHistory}`;

  const encodedPrompt = encodeURIComponent(`${systemPrompt}\nUser: ${userQuery}\nBot:`);
  const apiURL = `https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=42`;

  try {
    const response = await axios.get(apiURL);
    let botReply = response.data || "Maaf kijiyega, main abhi jawab nahi de paa raha hoon.";

    userMemory[senderID].push(`User: ${userQuery}`);
    userMemory[senderID].push(`Bot: ${botReply}`);
    if (userMemory[senderID].length > 10) userMemory[senderID].splice(0, 2);

    // Success Reaction ✅
    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage(botReply, threadID, messageID);
  } catch (error) {
    console.error("API Error:", error.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Connection ka masla aa raha hai. Baraye meherbani thodi der baad try karein.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Run command mein bhi protection
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("❌ Credits changed! Original creator: Shaan Khan.", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Hercai AI active hai. (Creator: Shaan Khan)", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Hercai AI off kar diya gaya hai.", threadID, messageID);
  } else if (command === "clear") {
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {};
      return api.sendMessage("🧹 Sabhi history clear kar di gayi hai.", threadID, messageID);
    }
    delete userMemory[senderID];
    return api.sendMessage("🧹 Aapki chat history clear ho gayi hai.", threadID, messageID);
  }
};
