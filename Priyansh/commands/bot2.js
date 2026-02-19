111const axios = require("axios");

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
  version: "4.1.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Romantic Female AI (Groq API)",
  commandCategory: "ai",
  usages: "Start with 'AI' or Reply",
  cooldowns: 2,
  dependencies: {
    axios: ""
  }
};

// Lock check
protectCredits(module.exports.config);

// 🔑 UPDATED GROQ API KEY
const GROQ_API_KEY = "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"; 

// 🧠 TEMPORARY MEMORY
const chatMemory = {};

// 🧾 OWNER-ONLY SPECIAL PROMPT
const systemPrompt = `
You are Shaan Khan's AI companion 🙂❤️😌.
Owner: Shaan Khan 💞.

RULES:
1. ONLY for Shaan Khan: Be a caring, mature, and supportive companion.
2. For Others: Talk like a normal, polite, and friendly girl member.
3. NEVER use "Janu", "Baby", or "Mera bacha".
4. Short replies (1-2 lines) in User's language.
5. Always use emojis: 🙂❤️😌.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase().trim();

  // ✨ TRIGGER LOGIC:
  // 1. Check if message STARTS with "ai"
  const startsWithAi = lowerBody.startsWith("ai");

  // 2. Check if it's a reply to the bot
  const isReplyToBot = messageReply && String(messageReply.senderID) === String(botID);

  // If neither condition is met, do nothing
  if (!startsWithAi && !isReplyToBot) return;

  // Cleaning "ai" from the prompt if it's at the start
  let userPrompt = body;
  if (startsWithAi) {
      userPrompt = body.replace(/^(ai|AI|Ai|aI)\s*/i, "");
  }

  if (!chatMemory[senderID]) chatMemory[senderID] = [];
  chatMemory[senderID].push({ role: "user", content: userPrompt || "Hi" });

  if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();

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
        temperature: 0.9
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
    console.log("Groq Error:", err.response?.data || err.message);
    api.sendMessage("Net thoda slow hai shayad, gussa mat hona meri jaan 🙂❤️😌", threadID, messageID);
  }
};