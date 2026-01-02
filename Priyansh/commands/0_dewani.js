const axios = require("axios");

module.exports.config = {
  name: "dewani",
  version: "1.6.1",
  hasPermission: 0,
  credits: "uzairrajput",
  description: "AI bot jo har user ki conversation yaad rakh kar jawab dega",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein ya 'dewani' likhein]",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

let userMemory = {};
let isActive = true;

// **System Prompt (Personality Setting)**
const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  
  if (!isActive || !body) return;

  // Check agar 'dewani' likha ho ya bot ko reply kiya ho
  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMentioningDewani && !isReplyToBot) return;

  // User Memory initialize karein
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const userQuery = body.trim();
  const conversationHistory = userMemory[senderID].join("\n");
  
  // Shankar GPT API ka use
  const fullQuery = `${systemPrompt}\n${conversationHistory}\nUser: ${userQuery}\nBot:`;
  const apiURL = `https://shankar-gpt-3-api.vercel.app/api?message=${encodeURIComponent(fullQuery)}`;

  // Reaction send karein
  api.setMessageReaction('⌛', messageID, () => {}, true);

  try {
    const response = await axios.get(apiURL);
    let botReply = response.data.response || "Uff! Mujhe samajh nahi ai baby! 😕";

    // Memory update karein (Max 10 messages)
    userMemory[senderID].push(`User: ${userQuery}`);
    userMemory[senderID].push(`Bot: ${botReply}`);
    if (userMemory[senderID].length > 10) userMemory[senderID].splice(0, 2);

    api.setMessageReaction('✅', messageID, () => {}, true);
    
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.error("API Error:", error.message);
    api.setMessageReaction('❌', messageID, () => {}, true);
    return api.sendMessage("Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Dewani bot ab active hai!", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Dewani bot ab off hai.", threadID, messageID);
  } else if (command === "clear") {
    userMemory[senderID] = [];
    return api.sendMessage("🧹 Baby, maine hamari purani baatein bhula di hain! naya start karte hain. 😉", threadID, messageID);
  }
};
