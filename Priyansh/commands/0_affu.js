const axios = require("axios");

module.exports.config = {
  name: "affu",
  version: "3.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani AI - Reply based with status symbols",
  commandCategory: "ai",
  usages: "reply to message",
  cooldowns: 1
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!body) return;

  // Activation command
  if (body.trim().toLowerCase() === "dewani") {
    return api.sendMessage("HAn ji Shaan Babu? Dewani haazir hai.. ✨😘", threadID, messageID);
  }

  // Sirf tab jawab degi jab user bot ke message par REPLY karega
  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot) {
    // Sanding (Processing) Status
    // Hum ek "⌛" reaction bhej dete hain taaki user ko pata chale bot soch raha hai
    api.setMessageReaction("⌛", messageID, (err) => {}, true);

    global.affu = global.affu || {};
    global.affu.chatHistory = global.affu.chatHistory || {};
    const chatHistory = global.affu.chatHistory;

    chatHistory[senderID] = chatHistory[senderID] || [];
    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 5) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    const systemPrompt = `Tumhara naam Dewani hai. Shaan Khan ne banaya hai. Tum cute aur naughty ho. Har sentence me cute emojis use karo. Jawab 1-2 line me do. Done ✅ ka touch rakho. \nHistory:\n${fullChat}\nDewani:`;

    try {
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
      let botReply = res.data.trim();
      
      botReply = botReply.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '');

      // Reply bhejte waqt Done reaction
      api.setMessageReaction("✅", messageID, (err) => {}, true);

      chatHistory[senderID].push(`dewani: ${botReply}`);
      return api.sendMessage(botReply, threadID, messageID);
    } catch (err) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
    }
  }
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage("Dewani se baatein karne ke liye uske message par 'Reply' karein! ⌛✅", event.threadID, event.messageID);
};
