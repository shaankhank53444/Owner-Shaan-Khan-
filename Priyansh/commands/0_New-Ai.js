const axios = require("axios");

// ===== MODULE CONFIG =====
module.exports.config = {
  name: "SHAAN-AI", 
  version: "5.0.0",
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

  // 1️⃣ Send "Processing" reaction
  api.setMessageReaction("⌛", messageID, () => {}, true);

  const systemPrompt = `
    Tumhara naam SHAAN AI hai. Tum Shaan ki partner ho. ❤️
    Owner ID: ${OWNER_UID}. Agar user Shaan Khan hai, toh bohot loving raho.
    
    RULES:
    1. Personality: Caring aur Sweet vibe rakho (✨, 😉).
    2. Knowledge Mode: Agar koi kisi jagah (Place) ya facts ke baare mein pooche, toh bilkul Realistic aur Accurate maloomat do.
    3. No Fake Info: Maloomat dete waqt mazaak mat karo.
    4. Defense: Shaan Khan ki insult par sakht gussa dikhao 😡.
    5. Language: Roman Urdu/Hindi.
  `;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Sender: ${senderID}. Message: ${userMessage}` }
        ],
        temperature: 0.6,
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

    // 2️⃣ Send Message and "Delivered" reaction
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
