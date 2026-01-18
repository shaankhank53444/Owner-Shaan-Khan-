const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Realistic AI girlfriend with reactions",
  commandCategory: "ai",
  usages: "Reply to bot message",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Sirf tab reply karega jab koi bot ke message par reply karega
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
  if (!isReplyToBot || !body) return;

  // Reaction: Wait (⌛)
  api.setMessageReaction("⌛", messageID, () => {}, true);

  global.gfChat = global.gfChat || {};
  global.gfChat.chatHistory = global.gfChat.chatHistory || {};
  const chatHistory = global.gfChat.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 10) chatHistory[senderID].shift();

  const fullChat = chatHistory[senderID].join("\n");

  // Aapka Updated Prompt
  const systemPrompt = `Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.`;

  const finalPrompt = `${systemPrompt}\n\nChat History:\n${fullChat}\n\nPriya:`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
    const res = await axios.get(url);
    const reply = typeof res.data === "string" ? res.data.trim() : JSON.stringify(res.data);

    chatHistory[senderID].push(`Priya: ${reply}`);

    // Message bhejne ke baad Reaction: Success (✅)
    api.sendMessage(reply, threadID, (err, info) => {
        if(!err) api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("Sorry baby 😔 network issue hai, fir se try karo na? 💕", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "Main active hoon! 💖 Mere kisi bhi message par 'reply' karke mujhse baat karo.",
    event.threadID,
    event.messageID
  );
};
