const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Fixed Safety Issue - Fast AI Girlfriend",
  commandCategory: "ai",
  usages: "Reply to bot's message",
  cooldowns: 1
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, messageReply, senderID } = event;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    if (senderID == api.getCurrentUserID()) return;

    api.setMessageReaction("⌛", messageID, () => {}, true);
    api.sendTypingIndicator(threadID);

    // AAPKA EXACT PROMPT
    const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

    try {
      // Model change kiya hai (flux ya openai ki jagah search use kiya hai for bypass)
      const url = `https://text.pollinations.ai/${encodeURIComponent(body)}?system=${encodeURIComponent(systemPrompt)}&model=search&seed=${Math.floor(Math.random() * 1000)}`;
      
      const res = await axios.get(url);
      let reply = res.data.trim();

      // Agar AI fir bhi mana kare toh fallback message
      if (reply.includes("I'm sorry") || reply.includes("assist") || !reply) {
         reply = "Jaan, mera mood thoda kharab hai... Shaan se kaho mujhe hug kare! ❤️";
      }

      return api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Hey baby! Mujhse baat karni hai toh reply karo. 💖", event.threadID, event.messageID);
};
