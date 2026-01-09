const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "2.1.5",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "Realistic AI girlfriend Muskan with Mirai Reaction Fix",
  commandCategory: "ai",
  usages: "muskan",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!body) return;

  global.muskanSessions = global.muskanSessions || {};

  // Trigger command "muskan"
  if (body.trim().toLowerCase() === "muskan") {
    global.muskanSessions[threadID] = true;
    api.setMessageReaction("✅", messageID, (err) => {}, true);
    return api.sendMessage(
      "Ji mere jaan! Muskan hazir hai. 💖 Kaisa hai tu? Boht miss kiya maine! 😊",
      threadID,
      messageID
    );
  }

  const isActive = global.muskanSessions[threadID];
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
  
  if (!isActive || !isReplyToBot) return;

  // React ⌛ when user replies
  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  global.muskanChat = global.muskanChat || {};
  global.muskanChat.chatHistory = global.muskanChat.chatHistory || {};

  const chatHistory = global.muskanChat.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

  const fullChat = chatHistory[senderID].join("\n");

  const prompt = `
Tum ek pyaari, romantic, aur caring girlfriend ho jiska naam Muskan hai.
Tum sirf Hinglish me reply karti ho emojis ke saath.
Har reply chhota aur natural ho.

Rules:
- Tumhara naam Muskan hai 💕
- Agar koi puche kisne banaya → "Mujhe Shaan Khan ne banaya hai! 🥰"

Chat History:
${fullChat}
`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url);
    const reply = typeof res.data === "string" ? res.data.trim() : "Hmm... 💕";

    chatHistory[senderID].push(`Muskan: ${reply}`);
    
    // Reply bhejte hi ✅ react karega
    return api.sendMessage(reply, threadID, (err, info) => {
      api.setMessageReaction("✅", messageID, (err) => {}, true);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage(
      "Sorry baby 😔 network thoda issue kar raha hai...",
      threadID,
      messageID
    );
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "Pehle 'muskan' likho phir mere message ka reply karke baat karo 💖",
    event.threadID,
    event.messageID
  );
};
