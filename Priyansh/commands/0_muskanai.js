const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-reply AI girlfriend with reaction",
  commandCategory: "ai",
  usages: "Reply to bot's message",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Sirf tab trigger hoga jab koi bot ke message par reply karega
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    api.sendTypingIndicator(threadID);

    global.gfChat = global.gfChat || {};
    global.gfChat.history = global.gfChat.history || {};
    
    const chatHistory = global.gfChat.history;
    chatHistory[senderID] = chatHistory[senderID] || [];

    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 5) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    const prompt = `Tumhara naam Priya hai. Tum Shaan Khan ki girlfriend ho. 
    Sirf Hinglish mein baat karo. Romantic aur caring raho. 
    Rules: Short replies (1-2 line) + Emojis.
    Context: ${fullChat}`;

    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
      const res = await axios.get(url);
      const reply = res.data.trim();

      chatHistory[senderID].push(`Priya: ${reply}`);

      // Message bhejna aur phir reaction dena
      return api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          api.setMessageReaction("✅", info.messageID, () => {}, true);
        }
      }, messageID);

    } catch (e) {
      return api.sendMessage("Sorry baby, thoda network problem hai... 😔", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Mujhse baat karne ke liye mere message par reply karein! 💖", event.threadID, event.messageID);
};
