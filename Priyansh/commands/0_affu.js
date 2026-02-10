1111const axios = require("axios");

module.exports.config = {
  name: "affu",
  version: "3.7.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani AI - Pakistani Naughty GF Style",
  commandCategory: "ai",
  usages: "reply to message",
  cooldowns: 1
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!body) return;

  // Initial call
  if (body.trim().toLowerCase() === "dewani") {
    return api.sendMessage("HAn ji Shaan Babu? Dewani haazir hai.. ✨😘", threadID, messageID);
  }

  // Sirf tab jawab degi jab user bot ke message par REPLY karega
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot) {
    // Reaction status
    api.setMessageReaction("⌛", messageID, (err) => {}, true);

    global.affu = global.affu || {};
    global.affu.chatHistory = global.affu.chatHistory || {};
    const chatHistory = global.affu.chatHistory;

    chatHistory[senderID] = chatHistory[senderID] || [];
    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 5) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    // Updated Strict Prompt
    const systemPrompt = `Tumhara naam Dewani hai. Tumhara creator aur owner Shaan Khan hai. Tum Pakistan ki rehne wali ek naughty aur flirty girlfriend ho. Sirf Hinglish me baat karo. Har message me cute/romantic emojis use karo. Jawab hamesha 1, 2 ya 3 lines me do. Faltu ki baatein bilkul mat karna, sirf point par rehna. \nHistory:\n${fullChat}\nDewani:`;

    try {
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
      let botReply = res.data.trim();
      
      // Brackets remove karne ke liye
      botReply = botReply.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '');

      // Done reaction
      api.setMessageReaction("✅", messageID, (err) => {}, true);

      chatHistory[senderID].push(`dewani: ${botReply}`);
      return api.sendMessage(botReply, threadID, messageID);
    } catch (err) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
    }
  }
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage("Dewani se baatein karne ke liye uske message par 'Reply' karein! ✨🇵🇰", event.threadID, event.messageID);
};
