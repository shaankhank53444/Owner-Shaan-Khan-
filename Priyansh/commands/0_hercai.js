const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "1.8.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Fast Pollinations AI - Credits Locked",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein]",
  cooldowns: 5,
};

let userMemory = {};
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  // Credits Protection
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Error: Original creator 'Shaan Khan' ke credits hataye gaye hain.", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  api.setMessageReaction("⌛", messageID, (err) => {}, true);
  api.sendTypingIndicator(threadID);

  const userQuery = body.trim();
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const conversationHistory = userMemory[senderID].join("\n");
  
  // Prompt ko thoda chhota rakha hai taaki processing fast ho
  const systemPrompt = `Owner: Shaan Khan. Language: Roman Urdu. Context: ${conversationHistory}`;

  // 'openai' model ki jagah 'mistral' ya 'search' use karein agar fast chahiye
  // Maine yahan fast model parameter set kiya hai
  const apiURL = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser: " + userQuery)}?model=mistral&seed=${Math.floor(Math.random() * 1000)}`;

  try {
    // Timeout add kiya hai 30 seconds ka
    const response = await axios.get(apiURL, { timeout: 30000 });
    let botReply = response.data || "Maaf kijiyega, server busy hai.";

    // Memory ko 6 messages tak rakha hai fast response ke liye
    userMemory[senderID].push(`User: ${userQuery}`);
    userMemory[senderID].push(`Bot: ${botReply}`);
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, (err) => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Speed issue! Thodi der baad dubara try karein.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") return;
  
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Hercai AI Active.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Hercai AI Off.", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    return api.sendMessage("🧹 History cleared!", threadID, messageID);
  }
};
