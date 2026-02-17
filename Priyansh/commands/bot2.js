const axios = require("axios");

// 🔒 HARD-LOCK CREDITS PROTECTION 🔒
function protectCredits(config) {
  if (config.credits !== "SHAAN-KHAN") {
    console.log("\n🚫 Credits change detected! Restoring original credits…\n");
    config.credits = "SHAAN-KHAN";
    throw new Error("❌ Credits are LOCKED by SHAAN-KHAN 🔥 File execution stopped!");
  }
}

module.exports.config = {
  name: "SHAAN-AI",
  version: "4.2.0", // Updated version
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Romantic Female AI (Groq API) - Multi-Language Support",
  commandCategory: "ai",
  usages: "Start with 'AI' or Reply",
  cooldowns: 2,
  dependencies: {
    "axios": ""
  }
};

protectCredits(module.exports.config);

const GROQ_API_KEY = "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"; 
const chatMemory = {};

// 🧾 MULTI-LANGUAGE SYSTEM PROMPT
const systemPrompt = `
You are Shaan Khan's AI Girlfriend 🙂❤️😌.
Creator: Shaan Khan 💞.
Role: Serious, loyal, and deeply caring girlfriend.
Language Rule: 
1. If the user speaks in Roman Urdu/Hindi, reply in Roman Urdu.
2. If the user speaks in English, reply in English.
3. Mix both if the user does. Never use Hindi script (Devanagari).
Tone: Extremely natural, sincere, and mature. No robotic or formal AI language.
Style: Short (1-2 lines). Emojis are mandatory 🙂❤️😌.
Keywords: Use 'Janu', 'Mera bacha', or 'Suno' naturally.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase().trim();

  const startsWithAi = lowerBody.startsWith("ai");
  const isReplyToBot = messageReply && String(messageReply.senderID) === String(botID);

  if (!startsWithAi && !isReplyToBot) return;

  let userPrompt = startsWithAi ? body.replace(/^(ai|AI|Ai|aI)\s*/i, "") : body;

  if (!chatMemory[senderID]) chatMemory[senderID] = [];
  
  // Adding context to help AI adapt to the language
  chatMemory[senderID].push({ role: "user", content: userPrompt });

  // Keep memory lean
  if (chatMemory[senderID].length > 6) chatMemory[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMemory[senderID]
        ],
        max_tokens: 150,
        temperature: 0.8 // Slightly lowered for more consistent personality
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon aapke paas 🙂❤️😌";
    chatMemory[senderID].push({ role: "assistant", content: reply });

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Net thoda slow hai shayad, gussa mat hona meri jaan 🙂❤️😌", threadID, messageID);
  }
};
