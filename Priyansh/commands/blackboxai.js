const axios = require("axios");

module.exports.config = {
  name: "blackai",
  version: "1.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "blackai bot with memory and context-aware conversation.",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {}; 
let isActive = true; // Auto-start active

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!isActive || !body) return;

  const userQuery = body.trim();

  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
    userMemory[senderID].history.push({ role: "user", content: userQuery });
  } else if (body.toLowerCase().includes("blackai")) {
    const cleanedQuery = body.toLowerCase().replace("blackai", "").trim();
    userMemory[senderID].history.push({ role: "user", content: cleanedQuery });
  } else {
    return;
  }

  const messages = userMemory[senderID].history.slice(-10);

  try {
    const response = await axios.post("https://text.pollinations.ai/", {
      messages: messages,
      model: "openai"
    });

    const botReply = response.data;
    userMemory[senderID].history.push({ role: "assistant", content: botReply });
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    return api.sendMessage("❌ API se jawab lane mein masla hua. Baad mein try karen.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Blackai bot ab active hai.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Blackai bot ab off kar diya gaya hai.", threadID, messageID);
  } else if (command === "clear") {
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {}; 
      return api.sendMessage("🧹 Sabhi users ki history clear kar di gayi hai.", threadID, messageID);
    }

    if (userMemory[senderID]) {
      delete userMemory[senderID];
      return api.sendMessage("🧹 Aapki history clear kar di gayi hai.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Aapki koi history nahi mili.", threadID, messageID);
    }
  }

  const userQuery = args.join(" ");

  if (!userQuery) {
    return api.sendMessage("❓ Please apna sawal puche! Example: blackai kaise ho?", threadID, messageID);
  }

  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };
  userMemory[senderID].history.push({ role: "user", content: userQuery });

  const messages = userMemory[senderID].history.slice(-10);

  try {
    const response = await axios.post("https://text.pollinations.ai/", {
      messages: messages,
      model: "openai"
    });

    const botReply = response.data;
    userMemory[senderID].history.push({ role: "assistant", content: botReply });
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    return api.sendMessage("❌ API se jawab lane mein masla hua. Baad mein try karen.", threadID, messageID);
  }
};
