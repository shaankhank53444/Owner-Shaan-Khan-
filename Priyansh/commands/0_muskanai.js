1111const axios = require("axios");

module.exports.config = {
  name: "girlfriend",
  version: "2.1.5", // Updated version
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-reply AI girlfriend jab bot ke message par reply ho (Locked Credits)",
  commandCategory: "ai",
  usages: "[reply to bot message]",
  cooldowns: 2
};

// 🔒 CREATOR LOCK: Isse koi bhi credits change nahi kar payega
Object.defineProperty(module.exports.config, 'credits', {
  value: 'Shaan Khan',
  writable: false, // Change nahi ho sakta
  configurable: false, // Delete ya redefine nahi ho sakta
  enumerable: true
});

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Anti-Credit Change Check (Double Lock)
  if (module.exports.config.credits !== "Shaan Khan") {
    return api.sendMessage("Unauthorized Modify: Credits locked to Shaan Khan only.", threadID, messageID);
  }

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot && body) {
    global.gfChat = global.gfChat || {};
    global.gfChat.chatHistory = global.gfChat.chatHistory || {};

    if (!global.gfChat.chatHistory[senderID]) {
        global.gfChat.chatHistory[senderID] = [];
    }

    const chatHistory = global.gfChat.chatHistory[senderID];
    chatHistory.push(`User: ${body}`);
    if (chatHistory.length > 10) chatHistory.shift();

    const fullHistory = chatHistory.join("\n");

    const systemPrompt = `You are Shaan Khan AI. Creator: Shaan Khan only. 
    Behavior: Reply in Hindi/English/Roman Urdu. 
    Tone: Masti bhara, caring, boyfriend-style. You are from Pakistan. 
    Rules: Reply in 1-2 lines only. Use emojis like 🙂❤️😌. 
    Special: If user says 'AI bolo', say: 'Main Shaan Khan AI hoon 🙂❤️😌'`;

    try {
      const response = await axios.post("https://text.pollinations.ai/", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullHistory }
        ],
        model: "openai"
      });

      const reply = response.data ? response.data.trim() : "Main thoda confuse ho gaya baby... 🥺";
      chatHistory.push(`AI: ${reply}`);
      
      return api.sendMessage(reply, threadID, messageID);
    } catch (e) {
      return api.sendMessage("Sorry baby 😔 network issue ho raha hai… 💕", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event }) {
  // Credits check on manual run too
  if (module.exports.config.credits !== "Shaan Khan") return;
  
  return api.sendMessage(
    "Mujhse baat karne ke liye bas mere kisi bhi message par reply karo! 💖",
    event.threadID,
    event.messageID
  );
};
