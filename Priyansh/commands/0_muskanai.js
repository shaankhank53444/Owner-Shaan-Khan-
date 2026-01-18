const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-reply AI girlfriend (Fixed Prompt)",
  commandCategory: "ai",
  usages: "Just send a message",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;

  // Bot apne khud ke message ya khali message par trigger nahi hoga
  if (senderID == api.getCurrentUserID() || !body) return;

  // 1. Loading reaction (⌛) jab message receive ho
  api.setMessageReaction("⌛", messageID, () => {}, true);
  api.sendTypingIndicator(threadID);

  global.gfChat = global.gfChat || {};
  global.gfChat.history = global.gfChat.history || {};
  
  const chatHistory = global.gfChat.history;
  chatHistory[senderID] = chatHistory[senderID] || [];

  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

  const fullChat = chatHistory[senderID].join("\n");

  // --- FIXED PROMPT START ---
  const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Act as a real girlfriend. Be fun, loving, and a little naughty. Keep reply maximum 5 lines only. Use Hindi/Urdu/English.";
  // --- FIXED PROMPT END ---

  // Final Prompt for API
  const finalPrompt = `${systemPrompt}\n\nChat Context:\n${fullChat}`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
    const res = await axios.get(url);
    const reply = res.data.trim();

    chatHistory[senderID].push(`Priya: ${reply}`);

    // 2. Message send karna
    return api.sendMessage(reply, threadID, (err, info) => {
      if (!err) {
        // 3. Success reaction (✅) message deliver hone par
        api.setMessageReaction("✅", messageID, () => {}, true);
      }
    }, messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("Sorry baby, Shaan se bolo network check karein... 😔", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Main har waqt tumhare liye online hoon jaan! Bas message karo. 💖", event.threadID, event.messageID);
};
