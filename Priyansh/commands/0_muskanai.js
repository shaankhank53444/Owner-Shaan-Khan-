const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "Realistic AI girlfriend Muskan with Reaction",
  commandCategory: "ai",
  usages: "muskan",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  global.muskanSessions = global.muskanSessions || {};

  // Trigger command "muskan"
  if (body && body.trim().toLowerCase() === "muskan") {
    global.muskanSessions[threadID] = true;
    api.setMessageReaction("✅", messageID, (err) => {}, true);
    return api.sendMessage(
      "Ji mere jaan! Muskan hazir hai. 💖 Kaisa hai tu? Boht miss kiya maine! 😊",
      threadID,
      messageID
    );
  }

  const isActive = global.muskanSessions[threadID];
  const isReplyToBot =
    messageReply && messageReply.senderID == api.getCurrentUserID();
  
  if (!isActive || !isReplyToBot) return;

  // Processing Reaction ⌛
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
Har reply chhota, pyaara aur natural ho (max 50 words).

Rules:
- Tumhara naam Muskan hai 💕
- Romantic & caring raho.
- Agar koi puche kisne banaya ya owner kaun hai → "Mujhe Shaan Khan ne banaya hai! 🥰 Woh mere sab kuch hain."

Chat History:
${fullChat}
`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url);
    const reply = typeof res.data === "string" ? res.data.trim() : "Hmm... kya kaha aapne? 💕";

    chatHistory[senderID].push(`Muskan: ${reply}`);
    
    // Send message and then React ✅
    return api.sendMessage(reply, threadID, (err, info) => {
      api.setMessageReaction("✅", messageID, (err) => {}, true);
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage(
      "Sorry baby 😔 network issue ho raha hai, thodi der baad baat karte hain na? 💕",
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
