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

  if (isReplyToBot && body) {

    global.gfChat = global.gfChat || {};
    global.gfChat.chatHistory = global.gfChat.chatHistory || {};

    const chatHistory = global.gfChat.chatHistory;
    chatHistory[senderID] = chatHistory[senderID] || [];

    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 8) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    // 🧠 SYSTEM PROMPT (FIXED)
    const systemPrompt = `You are Shaan Khan AI. Creator: Shaan Khan only. 
    Behavior: Reply in the language user uses (Hindi/English/Roman Urdu). 
    Tone: Masti bhara, caring, boyfriend-style. You are from Pakistan. 
    Rules: Reply in 1-2 lines only. Use emojis like 🙂❤️😌. 
    Special: If user says 'AI bolo', say: 'Main Shaan Khan AI hoon 🙂❤️😌'`;

    // Combining System Prompt with User Chat
    const finalInput = `${systemPrompt}\n\nChat History:\n${fullChat}\n\nAI:`;

    try {
      // 🛠️ API CALL FIXED: Using finalInput and proper URL encoding
      const url = `https://text.pollinations.ai/${encodeURIComponent(finalInput)}?model=openai`;
      const res = await axios.get(url);
      
      const reply = res.data ? res.data.toString().trim() : "Main thoda confuse ho gaya baby... 🥺";

      chatHistory[senderID].push(`AI: ${reply}`);
      return api.sendMessage(reply, threadID, messageID);
    } catch (e) {
      console.error(e);
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
