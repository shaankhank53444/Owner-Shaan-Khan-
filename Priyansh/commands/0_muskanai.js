const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Reply-only AI girlfriend with 5-line limit",
  commandCategory: "ai",
  usages: "Reply to bot's message to chat",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Sirf tab trigger hoga jab koi BOT ke message par REPLY karega
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    // 1. Message aate hi Loading reaction (⌛)
    api.setMessageReaction("⌛", messageID, () => {}, true);
    api.sendTypingIndicator(threadID);

    global.gfChat = global.gfChat || {};
    global.gfChat.history = global.gfChat.history || {};
    
    const chatHistory = global.gfChat.history;
    chatHistory[senderID] = chatHistory[senderID] || [];

    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    // FIXED SYSTEM PROMPT WITH 5 LINE STRICT RULE
    const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Act as a real girlfriend. Be fun, loving, and a little naughty. STRICT RULE: Keep your reply maximum 5 lines only. Use Hindi/Urdu/English.";

    const finalPrompt = `${systemPrompt}\n\nContext:\n${fullChat}`;

    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
      const res = await axios.get(url);
      const reply = res.data.trim();

      chatHistory[senderID].push(`Priya: ${reply}`);

      // 2. Message bhejna
      return api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          // 3. Success hone par reaction change (✅)
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Sorry baby, Shaan se bolo network check karein... 😔", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Hey jaan! Mujhse baat karne ke liye mere kisi bhi message par reply karein. 💖", event.threadID, event.messageID);
};
