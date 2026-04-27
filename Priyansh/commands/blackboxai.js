const axios = require("axios");

module.exports.config = {
  name: "blackbox",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Blackbox AI - Fast & No Key Needed",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (isReplyToBot || body.toLowerCase().startsWith("blackbox")) {
    const query = body.toLowerCase().startsWith("blackbox") ? body.slice(8).trim() : body.trim();
    if (!query) return;
    return await callBlackbox(api, threadID, messageID, senderID, query);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  if (query.toLowerCase() === "clear") {
    userMemory[senderID] = { history: [] };
    return api.sendMessage("🧹 History saaf kar di gayi hai!", threadID, messageID);
  }

  if (!query) return api.sendMessage("❓ Kuch likhiye!", threadID, messageID);
  return await callBlackbox(api, threadID, messageID, senderID, query);
};

async function callBlackbox(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  try {
    // Blackbox AI API endpoint
    const url = "https://api.blackbox.ai/api/chat";
    
    const data = {
      messages: [
        { role: "user", content: query }
      ],
      model: "deepseek-v3", // Aap isse change bhi kar sakte hain
      max_tokens: 500
    };

    const res = await axios.post(url, data);
    
    // Blackbox aksar direct text response deta hai
    const reply = res.data;

    if (reply) {
      return api.sendMessage(reply, threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Blackbox ne koi jawab nahi diya.", threadID, messageID);
    }
  } catch (err) {
    console.error("Blackbox Error:", err.message);
    return api.sendMessage("❌ Connection fail. Server down ho sakta hai.", threadID, messageID);
  }
}
