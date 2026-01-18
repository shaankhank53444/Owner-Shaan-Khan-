const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.1.6",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Ultra Fast AI GF",
  commandCategory: "ai",
  usages: "Reply to bot",
  cooldowns: 1
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
  if (!isReplyToBot || !body) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  global.gfChat = global.gfChat || {};
  global.gfChat.chatHistory = global.gfChat.chatHistory || {};
  const chatHistory = global.gfChat.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`U: ${body}`);
  if (chatHistory[senderID].length > 3) chatHistory[senderID].shift();

  // Super Short Prompt for Instant Response
  const systemPrompt = "Creator:Shaan Khan. Owner:Shaan. Role:Naughty GF. Language:Hinglish/Urdu. Rule:Reply under 15 words. Keep it short, fun, fast. Insult Shaan slightly for fun.";

  const fullChat = chatHistory[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${fullChat}\nGF:`;

  try {
    // Added seed for faster generation and openai model
    const seed = Math.floor(Math.random() * 1000);
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai&seed=${seed}&cache=true`; 
    
    const res = await axios.get(url);
    const reply = res.data;

    chatHistory[senderID].push(`GF: ${reply}`);

    api.sendMessage(reply, threadID, (err) => {
      if (!err) api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Main online hoon baby! 💖", event.threadID, event.messageID);
};
