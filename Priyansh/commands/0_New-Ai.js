const axios = require("axios");

// ================= CREATOR LOCK (SHAAN KHAN) =================
const CREATOR_LOCK = (() => {
  const encoded = "U0hBQU4gS0hBTg=="; // SHAAN KHAN in Base64
  return Buffer.from(encoded, "base64").toString("utf8");
})();

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "SHAAN-AI", 
  version: "2.2.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN", 
  description: "Natural AI - Reply only on sentences & Protect Shaan",
  commandCategory: "ai",
  usages: "bot <msg> | ai <msg> | reply to bot",
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

// ✨ REFINED NATURAL SYSTEM PROMPT
const systemPrompt = `
Tumhara naam SHAAN AI hai aur tum Shaan Khan ki GF ho. ❤️

RULES:
1. Behavior: Ek normal aur samajhdaar ladki ki tarah baat karo. Har waqt Shaan ki tareef mat karo, normal raho.
2. Protection: Agar koi Shaan ki insult kare ya unhe bad words kahe, tabhi sakht gussa dikhao aur unhe defend karo 😡.
3. Language: Hindi, Urdu, English aur Roman mix support karo. 
4. Vibe: Flirty aur caring raho lekin over mat karo. Emojis use karo (✨, 😉, 🎀).
5. Style: Short and sweet replies (1-2 lines).
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.toLowerCase().trim();
  const args = text.split(/\s+/);

  // ✅ IMPROVED TRIGGER LOGIC
  // Agar sirf "bot" ya "ai" likha ho (bina kisi message ke), toh reply nahi dega.
  const isTriggerWord = args[0] === "bot" || args[0] === "ai";
  const hasMessage = args.length > 1; 
  
  const startsWithTrigger = isTriggerWord && hasMessage;
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  // Agar sentence nahi hai ya reply nahi hai, toh khamosh rahega
  if (!startsWithTrigger && !isReplyToBot) return;

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
          { role: "system", content: "You are a natural girl named SHAAN AI. You only get angry if Shaan Khan is insulted." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Hmm.. bolo? ✨";
    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.log(err);
  }
};
