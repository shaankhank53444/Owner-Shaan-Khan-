const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Unfiltered AI Girlfriend - Fixed Work",
  commandCategory: "ai",
  usages: "Reply to bot's message",
  cooldowns: 1
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, messageReply, senderID } = event;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    if (senderID == api.getCurrentUserID()) return;

    // Fast Reaction ⌛
    api.setMessageReaction("⌛", messageID, () => {}, true);
    api.sendTypingIndicator(threadID);

    // AAPKA EXACT PROMPT
    const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

    try {
      // Is baar hum model=llama aur direct prompt use kar rahe hain for speed
      const url = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser: " + body)}?model=llama&cache=false`;
      
      const res = await axios.get(url);
      let reply = res.data.trim();

      // Agar API blank ya error de toh
      if (!reply || reply.length < 2) {
        reply = "Jaan, Shaan se kaho mera net slow hai, thoda wait karo! ❤️";
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
  return api.sendMessage("Hey baby! Mujhse baat karni hai toh mere kisi message par reply karo. 💖", event.threadID, event.messageID);
};
