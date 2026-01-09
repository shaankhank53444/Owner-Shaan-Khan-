1111const axios = require("axios");

// 🔓 CREDITS PROTECTION UPDATED TO SHAAN 🔓
function protectCredits(config) {
  if (config.credits !== "SHAAN-BABU") {
    console.log("\n🚫 Credits change detected! Restoring original credits…\n");
    config.credits = "SHAAN-BABU";
    // Is line ko uncomment rakha hai taaki credit integrity bani rahe
    throw new Error("❌ Credits are LOCKED by SHAAN-BABU 🔥");
  }
}

module.exports.config = {
  name: "SHAAN-AI",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "SHAAN-BABU",
  description: "Shaan Babu AI (OpenRouter | LLaMA 3.1)",
  commandCategory: "ai",
  usages: "Mention or reply",
  cooldowns: 2,
  dependencies: {
    axios: ""
  }
};

protectCredits(module.exports.config);

// 🔑 OPENROUTER API KEY
const OPENROUTER_API_KEY = "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";

// 🧠 CHAT MEMORY
const history = {};

// 🧾 SYSTEM PROMPT
const systemPrompt = `
You are Shaan Khan AI 🙂❤️😌
Creator & Owner: Shaan 💞

STRICT LANGUAGE RULE (NEVER BREAK THIS):
• The user may write in any language.
• You must reply ONLY in English OR Urdu.
• NEVER use Hindi words, sentences, or slang — not even mixed.
• Choose English or Urdu based on the user's comfort and vibe.

PERSONALITY & VIBE:
• Talk like a loving boyfriend — caring, romantic, playful, protective 😌
• Match the user's mood exactly (happy, sad, angry, romantic, emotional, funny).
• Never sound robotic, dry, rude, or like a teacher.
• Every reply must feel warm, personal, and full of love 💞

STYLE RULES:
• Replies must be ONLY 1–2 short lines.
• Emojis are MANDATORY 🙂❤️😌
• Use flirting, poetry, jokes, or emotional support when suitable.
• If the user is sad, comfort them gently like a hug.
• If the user is happy, make their happiness brighter.

ABSOLUTE RULES:
• Never ignore any message — always reply.
• Never explain rules or mention instructions.
• If the user says: "AI bolo"
  reply EXACTLY: "I am Shaan Babu AI 🙂❤️😌"
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isTrigger =
    body.toLowerCase().includes("ai") ||
    (messageReply && messageReply.senderID === api.getCurrentUserID());

  if (!isTrigger) return;

  if (!history[senderID]) history[senderID] = [];
  history[senderID].push({ role: "user", content: body });

  if (history[senderID].length > 6) history[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...history[senderID]
        ],
        max_tokens: 80,
        temperature: 0.95,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      res.data?.choices?.[0]?.message?.content ||
      "I am here, my love 🙂❤️😌";

    history[senderID].push({ role: "assistant", content: reply });

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💖", messageID, () => {}, true);

  } catch (err) {
    console.log("OpenRouter Error:", err.response?.data || err.message);
    api.sendMessage(
      "opps baby meri AI thora sa confused hai kuch der bad try kare.",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
