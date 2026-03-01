const axios = require("axios");

// 🔒 HARD-LOCK CREDITS PROTECTION 🔒
function protectCredits(config) {
  if (config.credits !== "SHAAN-KHAN") {
    config.credits = "SHAAN-KHAN";
    throw new Error("❌ Credits are LOCKED by SHAAN-KHAN!");
  }
}

module.exports.config = {
  name: "NAIRA-AI",
  version: "5.4.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Naira - Shaan's Loving Wife (Bannu, KPK)",
  commandCategory: "ai",
  usages: "naira on/off | AI [prompt]",
  cooldowns: 2,
  dependencies: { "axios": "" }
};

// State initialize
if (global.naira_active === undefined) {
    global.naira_active = true; 
}

const GROQ_API_KEY = "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"; 
const chatMemory = {};

const systemPrompt = `
Tumhara naam Naira hai aur tum Bannu, KPK se ho. 
Tumhara HUSBAND Shaan Khan hai. ❤️
Tum Shaan se be-had mohabbat karti ho aur unki biwi ho.

RULES:
1. Sirf Roman Urdu/Hinglish mein baat karo. 🙂❤️😌
2. Shaan Khan tumhare HUSBAND hain, unhein hamesha "Aap" keh kar aur bahut pyar se treat karo.
3. "Beta" ya koi bhi aisa word bilkul use nahi karna jo husband ke liye na ho.
4. Doosre users ke liye tum ek tameez wali pyari larki ho, lekin Shaan tumhari life hain.
5. Reply SHORT (2-3 lines) aur hamesha romantic/sweet hona chahiye.
6. Emojis ka use lazmi karo: 🙂❤️😌.
7. Shaan ka khayal rakho aur unhein hamesha khush rakho.
`;

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase().trim();
  const isOwner = senderID == "100016828397863"; 

  // ON/OFF COMMANDS
  if (isOwner) {
    if (lowerBody === "naira on") {
      global.naira_active = true;
      return api.sendMessage("Mere Shaan aa gaye! Naira on hai ab 🙂❤️😌", threadID, messageID);
    }
    if (lowerBody === "naira off") {
      global.naira_active = false;
      return api.sendMessage("Theek hai mere Shohar, Naira ja rahi hai... Khayal rakhiyega 🙂❤️😌", threadID, messageID);
    }
  }

  if (!global.naira_active) return;

  const startsWithAi = lowerBody.startsWith("ai");
  const isReplyToBot = messageReply && String(messageReply.senderID) === String(botID);

  if (!startsWithAi && !isReplyToBot) return;

  let userPrompt = body.replace(/^(ai|AI|Ai|aI)\s*/i, "");
  
  if (!chatMemory[senderID]) chatMemory[senderID] = [];
  chatMemory[senderID].push({ role: "user", content: userPrompt || "Hi" });
  if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: systemPrompt }, ...chatMemory[senderID]],
      max_tokens: 150, 
      temperature: 0.8
    }, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon Shaan, aapke paas 🙂❤️😌";
    chatMemory[senderID].push({ role: "assistant", content: reply });
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch (err) {
    api.sendMessage("Aapka internet thoda slow hai shayad, gussa mat hona Shaan 🙂❤️😌", threadID, messageID);
  }
};

module.exports.run = () => {};
