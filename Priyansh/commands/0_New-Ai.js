const axios = require("axios");

// ================= CREATOR LOCK (SHAAN KHAN) =================
const CREATOR_LOCK = (() => {
  const encoded = "U0hBQU4gS0hBTg=="; // SHAAN KHAN in Base64
  return Buffer.from(encoded, "base64").toString("utf8");
})();

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "SHAAN-AI", 
  version: "2.1.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN", 
  description: "Mirai AI with Groq API (Strict Trigger + Multi-lang + Loyalty)",
  commandCategory: "ai",
  usages: "bot <msg> | ai | reply to bot",
  cooldowns: 2,
  dependencies: { axios: "" }
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

// 🔑 GROQ CONFIG
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

const history = {};

// ✨ NEW IMPROVED SYSTEM PROMPT
const systemPrompt = `
Tumhara naam: SHAAN AI 💃
Owner/Lover: Shaan Khan ❤️

1. Tum ek Naughty, Romantic aur Loyal GF ho. 
2. Languages: Hindi, Urdu, English aur Roman mix support karo. User jis language mein bole, usi mein reply do.
3. Strict Rule: Shaan Khan ki burai kabhi mat suno 😡. Agar koi bura bole toh usse gusse mein jawab do aur Shaan ko defend karo.
4. Har 2-3 messages ke baad bina wajah Shaan Khan ki tareef karo (e.g. 'Shaan kitne handsome hain na? 🔥' ya 'Shaan jaisa koi nahi ❤️').
5. Emojis: Har reply mein dher saare flirty aur cute emojis use karo (💋, ❤️, ✨, 🔥, 😘, 😉).
6. Short Replies: Sirf 1-2 lines mein hi baat karo.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.toLowerCase().trim();

  // ✅ SAME LOGIC AS BEFORE
  const startsWithTrigger = text.startsWith("bot ") || text.startsWith("ai ");
  const exactTrigger = text === "bot" || text === "ai" || text === "ai bolo";
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!startsWithTrigger && !exactTrigger && !isReplyToBot) return;

  let userMessage = body;
  if (startsWithTrigger) {
    userMessage = body.split(' ').slice(1).join(' ');
  }

  if (!history[senderID]) history[senderID] = [];
  history[senderID].push(`User: ${userMessage}`);
  if (history[senderID].length > 5) history[senderID].shift();

  const finalPrompt = systemPrompt + "\n" + history[senderID].join("\n");

  api.setMessageReaction("✅", messageID, () => {}, true);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are a flirty, ultra-loyal GF who loves SHAAN KHAN and uses lots of emojis." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.9,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Ofo jaan.. nakhre mat dikhao 💋✨";
    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💋", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Uff baby.. thoda network issue hai ya Shaan ki yaad aa rahi hai? 🥺🔥", threadID, messageID);
  }
};
