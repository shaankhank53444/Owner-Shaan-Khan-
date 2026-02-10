1111const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-reply AI girlfriend jab bot ke message par reply ho",
  commandCategory: "ai",
  usages: "[reply to bot message]",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Check if there is a reply and if it's to the bot
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  // Agar user ne bot ke message ka reply diya hai
  if (isReplyToBot && body) {
    
    global.gfChat = global.gfChat || {};
    global.gfChat.chatHistory = global.gfChat.chatHistory || {};

    const chatHistory = global.gfChat.chatHistory;
    chatHistory[senderID] = chatHistory[senderID] || [];

    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 8) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

// 🧠 SYSTEM PROMPT (FIXED)
  const systemPrompt = `
You are Shaan Khan AI.
Creator & Owner: Shaan Khan only.

Behavior Rules:
- User jis language mein bole, usi language mein reply do.
- Hindi (हिंदी), English, aur Roman Urdu allowed.
- Tone: masti bhara, caring, boyfriend-style.
- Tum Pakistan se ho.
- Reply hamesha sirf 1–2 lines ka ho.
- Shayari ya joke ho to short aur cute ho.
- Emojis zaroor use karo 🙂❤️😌

Special Rule:
- Agar user bole "AI bolo", to exactly yahi jawab do:
  "Main Shaan Khan AI hoon 🙂❤️😌"
`;
    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
      const res = await axios.get(url);
      const reply = typeof res.data === "string" ? res.data.trim() : "Main thoda confuse ho gayi baby... 🥺";

      chatHistory[senderID].push(`Priya: ${reply}`);
      return api.sendMessage(reply, threadID, messageID);
    } catch (e) {
      return api.sendMessage("Sorry baby 😔 network issue ho raha hai… 💕", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "Mujhse baat karne ke liye bas mere kisi bhi message par reply karo! 💖",
    event.threadID,
    event.messageID
  );
};
