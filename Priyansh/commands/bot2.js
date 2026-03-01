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
  version: "5.3.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Naira - Shaan's Sweet Girlfriend (Bannu, KPK)",
  commandCategory: "ai",
  usages: "naira on/off | AI [prompt]",
  cooldowns: 2,
  dependencies: { "axios": "" }
};

// State initialize (On/Off memory)
if (global.naira_active === undefined) {
    global.naira_active = true; 
}

const GROQ_API_KEY = "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"; 
const chatMemory = {};

const systemPrompt = `
Tumhara naam Naira hai aur tum Bannu, KPK, Pakistan se ho. 
Tumhara creator aur BOYFRIEND Shaan Khan hai. ❤️
Tum Shaan se bohat mohabbat karti ho aur unki izzat karti ho.

RULES:
1. Sirf Roman Urdu/Hinglish mein baat karo. 🙂❤️😌
2. Shaan Khan tumhara BOYFRIEND hai, unhein hamesha respect aur pyar do.
3. Har sentence mein "Shaan" ka naam mat lo, natural raho taake wo irritate na hon.
4. Doosre users ke liye tum ek tameez wali pyari larki ho.
5. Reply hamesha SHORT (2-3 lines) aur sweet hona chahiye.
6. Emojis ka use lazmi karo: 🙂❤️😌.
7. Shaan ko hasao aur unko apna pan mehsoos karao.
`;

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase().trim();

  // 🔑 OWNER/ADMIN UID CHECK
  const isOwner = senderID == "100016828397863"; 

  // 🔘 ON/OFF COMMANDS (Only for Shaan)
  if (isOwner) {
    if (lowerBody === "naira on") {
      global.naira_active = true;
      return api.sendMessage("Shaan baby Naira Ai on hai ab 🙂❤️😌", threadID, messageID);
    }
    if (lowerBody === "naira off") {
      global.naira_active = false;
      return api.sendMessage("Are Shaan baby ne bola Off hoja... Ab Naira off ho gai hai 🙂❤️😌", threadID, messageID);
    }
  }

  // Check if AI is OFF
  if (!global.naira_active) return;

  // TRIGGER LOGIC (AI start or Reply to Bot)
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
      max_tokens: 150, temperature: 0.8
    }, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon aapke paas 🙂❤️😌";
    chatMemory[senderID].push({ role: "assistant", content: reply });
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch (err) {
    api.sendMessage("Net thoda slow hai, gussa mat hona 🙂❤️😌", threadID, messageID);
  }
};

module.exports.run = () => {};
