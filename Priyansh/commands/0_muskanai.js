const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.1.5",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Fast AI girlfriend with quick response",
  commandCategory: "ai",
  usages: "Reply to bot",
  cooldowns: 1 // Cooldown kam kar diya taaki fast reply ho
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
  if (!isReplyToBot || !body) return;

  // Reaction: Loading
  api.setMessageReaction("⌛", messageID, () => {}, true);

  // Short history for speed (sirf last 4 chats)
  global.gfChat = global.gfChat || {};
  global.gfChat.chatHistory = global.gfChat.chatHistory || {};
  const chatHistory = global.gfChat.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 4) chatHistory[senderID].shift();

  // Optimized Short Prompt for Speed
  const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi,Shaan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 3 lines only.";

  const fullChat = chatHistory[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${fullChat}\nGF:`;

  try {
    // Pollinations ki fast API use ho rahi hai
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai&cache=true`; 
    const res = await axios.get(url);
    const reply = res.data;

    chatHistory[senderID].push(`GF: ${reply}`);

    // Message sending with Success Reaction
    api.sendMessage(reply, threadID, (err) => {
      if (!err) api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Main online hoon! 💖 Reply me 'hi' to start.", event.threadID, event.messageID);
};
