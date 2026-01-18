const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Fixed Prompt - Auto Reply with specific rules",
  commandCategory: "ai",
  usages: "Reply to bot's message",
  cooldowns: 1
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, messageReply, senderID } = event;

  // Check: Kya user ne bot ke message par reply kiya hai?
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    if (senderID == api.getCurrentUserID()) return;

    // 1. Loading Reaction (⌛)
    api.setMessageReaction("⌛", messageID, () => {}, true);
    api.sendTypingIndicator(threadID);

    // --- AAPKA EXACT UPDATED PROMPT ---
    const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

    try {
      // API call with the exact instruction
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser: " + body)}`);
      const reply = res.data.trim();

      // 2. Auto message send karna
      return api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          // 3. Success Reaction (✅)
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Jaan! Mujhse baat karne ke liye mere message par reply karein. 💖", event.threadID, event.messageID);
};
