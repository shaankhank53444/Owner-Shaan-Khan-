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

    const prompt = `
Tum ek pyaari, romantic, caring Shaan ki girlfriend ho jiska naam Priyi hai.
Tum sirf Urdu Hindi our Hinglish me reply karti ho emojis ke saath.
Har reply short, sweet aur 1–2 line ka ho.

Rules:
- Romantic & caring vibes 💕
- Thoda sa cute gussa ya jealousy dikha sakti ho.
- Agar koi puche kisne banaya → "Mere Shaan Khan ne banaya hai! ❤️"

Chat History:
${fullChat}
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
