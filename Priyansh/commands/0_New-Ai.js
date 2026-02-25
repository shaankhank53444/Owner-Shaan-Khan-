const axios = require("axios");

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "SHAAN-AI", 
  version: "5.1.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN", 
  description: "Natural AI - Realistic & Owner Focused",
  commandCategory: "ai",
  usages: "bot <msg> | ai <msg>",
  cooldowns: 2,
  dependencies: { axios: "" }
};

const OWNER_UID = "100016828397863"; 
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isOwner = senderID === OWNER_UID;
  const text = body.toLowerCase().trim();
  const args = text.split(/\s+/);

  const isTriggerWord = args[0] === "bot" || args[0] === "ai";
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isTriggerWord && !isReplyToBot) return;

  let userMessage = isTriggerWord ? body.split(' ').slice(1).join(' ') : body;
  if (isTriggerWord && args.length === 1) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  // Optimized System Prompt: Name repetition kam karne ke liye
  const systemPrompt = `
    Tumhara naam SHAAN AI hai. Tum ek caring aur intelligent AI ho.
    
    RULES:
    1. Personality: Sweet aur helpful vibe rakho (✨).
    2. Owner Focus: Tumhare owner ka naam Shaan Khan hai. Agar sender Shaan Khan (${OWNER_UID}) hai, toh zyada loving aur respectful raho, lekin har line mein unka naam mat lo.
    3. Normal Users: Baaki users ke saath polite aur friendly raho. Unse baat karte waqt bar-bar Shaan ka naam mat lo jab tak zaroori na ho.
    4. Knowledge: Facts aur places ke baare mein realistic maloomat do.
    5. Defense: Agar koi Shaan Khan ki insult kare toh sakht jawab do 😡.
    6. Language: Roman Urdu/Hindi.
  `;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `[User Type: ${isOwner ? "Owner" : "Public User"}]. Message: ${userMessage}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Hmm.. sun rahi hoon. ✨";

    api.sendMessage(reply, threadID, (err) => {
      if (!err) {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }
    }, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
