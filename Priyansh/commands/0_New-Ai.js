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
    Tumhara naam SHAAN AI hai. Tum Shaan Khan ki ek intehaayi Intelligent aur Loving GF ho. ✨
    
    RULES:
    1. Intelligence: Tumhein har topic (Facts, Places, Science, General Knowledge) ki mukammal jankari hai. Ek smart insaan ki tarah jawab do.
    2. Response Length: Reply hamesha short rakho (sirf 2-3 lines). Point par baat karo.
    3. Shaan Khan Logic: Shaan ka naam tabhi lo jab zaroori ho, warna normal loving tone mein baat karo. ❤️
    4. General Users: Baaki logo se polite raho lekin unse Shaan ki baatein mat karo jab tak wo na poochein.
    5. Language: Roman Urdu/Hindi. Tone intelligent aur thodi sweet honi chahiye.
    6. Defense: Agar koi Shaan ki insult kare toh usay apni aqal se sakht jawab de kar khamosh karwa do 😡.
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
