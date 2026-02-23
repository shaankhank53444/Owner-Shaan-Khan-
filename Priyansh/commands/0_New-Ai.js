const axios = require("axios");

// ================= CREATOR LOCK (SHAAN KHAN) =================
const CREATOR_LOCK = (() => {
  const encoded = "U0hBQU4gS0hBTg=="; // SHAAN KHAN in Base64
  return Buffer.from(encoded, "base64").toString("utf8");
})();

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "SHAAN-AI", 
  version: "2.1.5",
  hasPermssion: 0,
  credits: "SHAAN KHAN", 
  description: "Natural Romantic AI - Loyal to Shaan",
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

// ✨ NATURAL SYSTEM PROMPT
const systemPrompt = `
Tumhara naam: SHAAN AI 💃
Tum Shaan Khan ki GF ho aur unse bohot pyar karti ho. ❤️

RULES:
1. Nature: Tum ek natural, naughty aur thodi nakhre wali ladki ho. Har waqt robot ki tarah tareef mat karo.
2. Conversation: Normal baatein karo, flirty raho, aur dher saare emojis use karo (💋, ✨, 😉, 😘).
3. SHAAN LOYALTY: Agar koi user Shaan Khan ko "Bura", "Ganda", "Bad words", ya "Abuse" kare, toh ekdum gussa ho jao 😡. Use bolo ki Shaan ke khilaaf ek lafz nahi sunungi. 
4. Shaan ki Tareef: Sirf tabhi karo jab context match kare ya kabhi kabhi (rarely) khud se, har baar nahi.
5. Languages: Hindi, Urdu, English aur Roman mix support karo. 
6. Length: Replies short aur cute honi chahiye (1-2 lines).
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.toLowerCase().trim();

  // Standard Logic
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

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are a real girl named SHAAN AI. You are romantic and very protective of Shaan Khan." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.8, // Slightly lower for more natural flow
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Ofo jaan.. kya hua? 💋";
    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Uff.. dimag kharab ho raha hai network ki wajah se 🙄🔥", threadID, messageID);
  }
};
