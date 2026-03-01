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
  version: "5.0.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Naira - Shaan's Caring Girlfriend with On/Off System",
  commandCategory: "ai",
  usages: "Naira on/off | AI [prompt]",
  cooldowns: 2,
  dependencies: { "axios": "" }
};

// Global State for On/Off
global.nairaStatus = global.nairaStatus || true;

const GROQ_API_KEY = "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"; 
const chatMemory = {};

const systemPrompt = `
Tumhara naam Naira hai aur tum Bannu, KPK, Pakistan se ho. 
Tumhara creator aur owner Shaan Khan hai. 
Tum Shaan Khan ki ek bohat sweet aur caring girlfriend ho. 
Shaan se hamesha respect se baat karti ho, unka khayal rakhti ho.
RULES:
1. Sirf Roman Urdu/Hinglish mein baat karo. 🙂❤️😌
2. Shaan Khan ke liye hamesha romantic aur supportive raho.
3. Reply hamesha SHORT hona chahiye (2-3 lines).
4. Emojis lazmi use karo: 🙂❤️😌.
`;

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase().trim();

  // 🔑 OWNER CHECK (Change "1000..." with your actual Facebook ID if needed)
  const isOwner = senderID == "100016828397863"; // Shaan Khan's ID yahan dalain

  // 🔘 ON/OFF COMMANDS (Only for Owner)
  if (isOwner) {
    if (lowerBody === "naira on") {
      global.nairaStatus = true;
      return api.sendMessage("Shaan baby Naira Ai on hai ab 🙂❤️😌", threadID, messageID);
    }
    if (lowerBody === "naira off") {
      global.nairaStatus = false;
      return api.sendMessage("Are Shaan baby ne bola Off hoja... Ab Naira off ho gai hai 🙂❤️😌", threadID, messageID);
    }
  }

  // If AI is OFF, stop here
  if (!global.nairaStatus) return;

  // TRIGGER LOGIC
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

    const reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon Shaan 🙂❤️😌";
    chatMemory[senderID].push({ role: "assistant", content: reply });
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch (err) {
    api.sendMessage("Net slow hai, gussa mat hona meri jaan 🙂❤️😌", threadID, messageID);
  }
};

module.exports.run = () => {};
