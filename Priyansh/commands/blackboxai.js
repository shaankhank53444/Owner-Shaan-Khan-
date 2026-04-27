const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "1.4.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Gemini AI with optimized memory and auto-reply.",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {}; 
let isActive = true; 

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!isActive || !body || senderID == api.getCurrentUserID()) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  const isKeyword = body.toLowerCase().startsWith("hercai");

  if (isReplyToBot || isKeyword) {
    const userQuery = isKeyword ? body.slice(6).trim() : body.trim();
    if (!userQuery) return;

    await getAIResponse(api, threadID, messageID, senderID, userQuery);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Bot auto-reply active ho gaya.", threadID, messageID);
  } 
  
  if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Bot auto-reply off kar diya gaya.", threadID, messageID);
  } 
  
  if (command === "clear") {
    userMemory[senderID] = { history: [] };
    return api.sendMessage("🧹 Aapki history reset kar di gayi.", threadID, messageID);
  }

  const userQuery = args.join(" ");
  if (!userQuery) return api.sendMessage("❓ Sawal likhen! Example: blackboxai hello", threadID, messageID);

  await getAIResponse(api, threadID, messageID, senderID, userQuery);
};

async function getAIResponse(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };
  
  // Memory limit (Keep last 10 exchanges)
  if (userMemory[senderID].history.length > 20) {
    userMemory[senderID].history.shift();
  }

  userMemory[senderID].history.push({ role: "user", content: query });

  const context = userMemory[senderID].history
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const apiURL = `https://uzairrajputapis.qzz.io/api/ai/gemini?question=${encodeURIComponent(context)}`;

  try {
    const res = await axios.get(apiURL);
    const reply = res.data.answer || res.data.reply; // Checking both common keys

    if (reply) {
      userMemory[senderID].history.push({ role: "bot", content: reply });
      return api.sendMessage(reply, threadID, messageID);
    } else {
      return api.sendMessage("⚠️ API se khali jawab mila.", threadID, messageID);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ API offline hai ya response nahi de rahi.", threadID, messageID);
  }
}
