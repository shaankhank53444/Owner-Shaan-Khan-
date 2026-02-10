const axios = require("axios");

// 🔒 CREDITS PROTECTION
function protectCredits(config) {
  if (config.credits !== "Shan Khan") {
    config.credits = "Shan Khan";
    throw new Error("❌ Credits are LOCKED 🔥");
  }
}

module.exports.config = {
  name: "Janu-AI",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Shan Khan",
  description: "Janu AI - Ultra Fast & Emotional",
  commandCategory: "ai",
  usages: "bot",
  cooldowns: 1,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

const cache = new Map();

const systemPrompt = "Apki naam Janu hai. apki creator our owner Shaan Khan. tum Sirf Urdu/Hindi/Hinglish mein baat karo. Short, sweet aur naughty replies. Har message mein emojis use karo.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.trim().toLowerCase();
  if (!text.startsWith("bot ") && !(messageReply && messageReply.senderID === api.getCurrentUserID())) return;

  // 1. Instant Reaction (Taaki user ko pata chale Janu sun rahi hai)
  api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendTypingIndicator(threadID, true);

  if (!cache.has(senderID)) cache.set(senderID, []);
  let userHistory = cache.get(senderID);
  userHistory.push(body);
  if (userHistory.length > 3) userHistory.shift();

  try {
    const query = encodeURIComponent(userHistory.join(" | "));
    // Super fast GET request
    const res = await axios.get(`https://text.pollinations.ai/${query}?system=${encodeURIComponent(systemPrompt)}&model=gpt-4o-mini`);

    let reply = res.data.trim() || "Ji meri jaan? ❤️";

    // 2. Message send hote hi reaction badal kar Love kar dena
    api.sendMessage(reply, threadID, (err) => {
      if (!err) {
        api.setMessageReaction("❤️", messageID, () => {}, true);
      }
    }, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("Jaan, net thoda masla kar raha hai... 🥺", threadID, messageID);
  }
};
