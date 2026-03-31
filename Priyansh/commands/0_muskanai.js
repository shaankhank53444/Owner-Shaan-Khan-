const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Fast AI girlfriend auto-reply with reactions",
  commandCategory: "ai",
  usages: "[reply to bot message]",
  cooldowns: 1
};

// 🔒 CREATOR LOCK: Credits protection
Object.defineProperty(module.exports.config, 'credits', {
  value: 'Shaan Khan',
  writable: false,
  configurable: false,
  enumerable: true
});

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (module.exports.config.credits !== "Shaan Khan") return;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    // ⌛ Send 'Wait' reaction immediately
    api.setMessageReaction("⌛", messageID, (err) => {}, true);

    global.gfChat = global.gfChat || {};
    global.gfChat.chatHistory = global.gfChat.chatHistory || {};

    if (!global.gfChat.chatHistory[senderID]) {
      global.gfChat.chatHistory[senderID] = [];
    }

    const chatHistory = global.gfChat.chatHistory[senderID];
    chatHistory.push(`User: ${body}`);
    if (chatHistory.length > 6) chatHistory.shift(); // History choti rakhi hai for speed

    const fullHistory = chatHistory.join("\n");
    const systemPrompt = `You are Shaan Khan AI. Creator: Shaan Khan. Tone: Pakistani, romantic, fun. 1-2 lines only.`;

    try {
      // Speed optimized: Using direct URL encode for faster response
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\n" + fullHistory)}?model=openai`);
      
      const reply = res.data ? res.data.trim() : "Main thoda confuse ho gaya baby... 🥺";
      
      chatHistory.push(`AI: ${reply}`);
      
      // ✅ Success: Send 'Done' reaction and message
      api.setMessageReaction("✅", messageID, (err) => {}, true);
      return api.sendMessage(reply, threadID, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      return api.sendMessage("Sorry baby 😔 network thoda slow hai... 💕", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  if (module.exports.config.credits !== "Shaan Khan") return;
  return api.sendMessage("Mujhse baat karne ke liye mere message par reply karo! 💖", event.threadID, event.messageID);
};
