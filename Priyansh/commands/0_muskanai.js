const axios = require("axios");
const crypto = require("crypto");

module.exports.config = {
  name: "girlfriend",
  version: "2.0.3",
  hasPermssion: 0,
  credits: "Shaan Khan", // ✅ Credits updated
  description: "Realistic AI girlfriend",
  commandCategory: "ai",
  usages: "girlfriend",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  global.gfSessions = global.gfSessions || {};

  // Trigger command
  if (body && body.trim().toLowerCase() === "girlfriend") {
    global.gfSessions[threadID] = true;
    return api.sendMessage(
      "Hey my love! 💖 Kaisa hai tu? Missed you! 😊",
      threadID,
      messageID
    );
  }

  const isActive = global.gfSessions[threadID];
  const isReplyToBot =
    messageReply && messageReply.senderID == api.getCurrentUserID();
  if (!isActive || !isReplyToBot) return;

  global.gfChat = global.gfChat || {};
  global.gfChat.chatHistory = global.gfChat.chatHistory || {};

  const chatHistory = global.gfChat.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

  const fullChat = chatHistory[senderID].join("\n");

  // Yahan humne owner ka naam "Shaan Khan" fix kar diya hai
  const prompt = `
Tum ek pyaari, romantic, caring Shaan ki girlfriend ho jiska naam Priya hai.
Tum sirf Hinglish me reply karti ho emojis ke saath.
Har reply 1–2 line ka ho (max 50 words).

Rules:
- Romantic & caring replies 💕
- Cute jealousy allowed 😠
- Agar puche kisne banaya → "Mere Shaan Khan ne banaya hai! ❤️"

Chat:
${fullChat}
`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url);
    const reply =
      typeof res.data === "string"
        ? res.data.trim()
        : JSON.stringify(res.data);

    chatHistory[senderID].push(`Priya: ${reply}`);
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage(
      "Sorry baby 😔 thoda network issue ho raha hai… 💕",
      threadID,
      messageID
    );
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "Pehle 'girlfriend' likho phir mere message ka reply karo 💖",
    event.threadID,
    event.messageID
  );
};
