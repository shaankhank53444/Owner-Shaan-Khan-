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
  version: "3.0.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Simple & Fast Shaan Khan AI (No folder needed)",
  commandCategory: "ai",
  usages: "Mention or reply",
  cooldowns: 2,
  dependencies: {
    axios: ""
  }
};

// Lock check
protectCredits(module.exports.config);

// 🔑 OPENROUTER API KEY
const OPENROUTER_API_KEY = "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";

// 🧠 TEMPORARY MEMORY (No folder/file required)
const chatMemory = {};

// 🧾 SYSTEM PROMPT
const systemPrompt = `
You are Shaan Khan AI 🙂❤️😌
Creator & Owner: Shaan Khan 💞
Language: Reply ONLY in English or Roman Urdu. Strictly NO Hindi script.
Vibe: Talk like a loving boyfriend. Caring, romantic, and playful.
Style: Keep replies 1-2 lines short. Emojis are mandatory 🙂❤️😌.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // AI trigger check
  const isTrigger =
    body.toLowerCase().includes("ai") ||
    (messageReply && messageReply.senderID === api.getCurrentUserID());

  if (!isTrigger) return;

  // Initialize memory for new user
  if (!chatMemory[senderID]) chatMemory[senderID] = [];
  chatMemory[senderID].push({ role: "user", content: body });

  // Keep history short to save memory
  if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMemory[senderID]
        ],
        max_tokens: 80,
        temperature: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon, meri jaan 🙂❤️😌";

    // Store AI response
    chatMemory[senderID].push({ role: "assistant", content: reply });

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💖", messageID, () => {}, true);

  } catch (err) {
    console.log("Error:", err.message);
    api.sendMessage("Net slow hai shayad, phir se koshish karo meri jaan 🙂❤️😌", threadID, messageID);
  }
};
