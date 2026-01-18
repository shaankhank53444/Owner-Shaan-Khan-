const axios = require("axios");

module.exports.config = {
  name: "dewani",
  version: "1.6.5",
  hasPermission: 0,
  credits: "uzairrajput",
  description: "Fixed Priyanshu API Dewani Bot",
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

const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys.";

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!isActive || !body) return;

  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMentioningDewani && !isReplyToBot) return;

  if (!userMemory[senderID]) userMemory[senderID] = [];

  api.setMessageReaction('⌛', messageID, () => {}, true);

  try {
    // API ko bhejne ke liye messages array taiyar karein
    // Priyanshu API aksar 'system' role accept nahi karti, isliye hum personality ko pehle message me bhejenge
    let messagesForApi = [];
    
    // Pehla message hamesha instructions honge
    messagesForApi.push({ role: "user", content: `Instructions: ${systemPrompt}` });
    messagesForApi.push({ role: "assistant", content: "Theek hai baby, main samajh gayi! 😉" });

    // Purani history add karein
    messagesForApi = [...messagesForApi, ...userMemory[senderID]];

    // Current query add karein
    messagesForApi.push({ role: "user", content: body });

    const response = await axios.post("https://priyanshuapi.xyz/api/runner/priyanshu-ai", {
      prompt: body,
      model: "priyansh-ai",
      messages: messagesForApi,
      persona: "friendly"
    }, {
      headers: {
        'Authorization': 'Bearer Priyanshu-f1k7-6p5y-3e9r',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    // API ka response path aksar ye hota hai: data.choices[0].message.content
    // Lekin hum check laga dete hain taaki crash na ho
    let botReply = response.data?.choices?.[0]?.message?.content || 
                   response.data?.data?.choices?.[0]?.message?.content || 
                   "Uff! Baby network issue ho gaya hai.. 😕";

    // Memory update (Max 6 messages rakhein taaki API limit cross na ho)
    userMemory[senderID].push({ role: "user", content: body });
    userMemory[senderID].push({ role: "assistant", content: botReply });

    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction('✅', messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.error("API ERROR:", error.response?.data || error.message);
    api.setMessageReaction('❌', messageID, () => {}, true);
    return api.sendMessage("Jaan, API down hai ya key expire ho gayi hai! 😔", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Dewani active ho gayi!", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Dewani off ho gayi.", threadID, messageID);
  } else if (command === "clear") {
    userMemory[senderID] = [];
    return api.sendMessage("🧹 Memory clear kar di baby!", threadID, messageID);
  }
};
