const axios = require("axios");

module.exports.config = {
  name: "devil",
  version: "1.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Devil AI via Groq API (Only Owner can Toggle)",
  commandCategory: "AI",
  usages: "devil [message] or devil on/off",
  cooldowns: 2
};

const devilStatus = new Map();
const ADMIN_UID = "100016828397863"; // Teri UID
const GROQ_API_KEY = "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"; // <--- Yahan apni key daalo

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").trim().toLowerCase();

  // OWNER ONLY ON/OFF LOGIC
  if (content === "on") {
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("Abey bsdk, tu mera maalik nahi hai jo mujhe control karega! 🖕", threadID, messageID);
    }
    devilStatus.set(threadID, true);
    return api.sendMessage("✅ Devil ON ho gaya Maalik! Ab tabaahi machegi 🔥", threadID, messageID);
  }

  if (content === "off") {
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("Teri aukat nahi mujhe OFF karne ki, ja gaand mara! 😈", threadID, messageID);
    }
    devilStatus.set(threadID, false);
    return api.sendMessage("❌ Devil OFF... Maalik ne bola toh marna padega 😏", threadID, messageID);
  }

  // Blank message handling
  if (!args.join(" ")) {
    return api.sendMessage(
      senderID === ADMIN_UID 
        ? "Jaan kuch to bolo na... ❤️" 
        : "Abey bol madarchod, kya chahiye?", 
      threadID, messageID
    );
  }

  return chatWithDevil(api, event, args.join(" "));
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, body, type, messageReply, senderID } = event;
  if (!body || senderID === api.getCurrentUserID()) return;

  const isEnabled = devilStatus.get(threadID) || false;
  const botID = api.getCurrentUserID();

  if (!isEnabled) return;

  if (body.toLowerCase().startsWith("devil ") || (type === "message_reply" && messageReply?.senderID === botID)) {
    const query = body.toLowerCase().startsWith("devil ") ? body.slice(6).trim() : body.trim();
    if (!query) return;
    return chatWithDevil(api, event, query);
  }
};

async function chatWithDevil(api, event, query) {
  const isAdmin = event.senderID === ADMIN_UID;
  
  const systemPrompt = isAdmin 
    ? "You are Devil AI. For this specific user (ADMIN), you are extremely romantic, sweet, and loving. Use words like 'Jaan', 'Babu', 'Love'. You are his loyal lover."
    : "You are Devil AI. You are extremely abusive, rude, and toxic. Use heavy Hindi slang/gaali (madarchod, behenchod, etc.) in every sentence. Be disrespectful and wild.";

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 500
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content || "Kuch gadbad ho gai... 😭";
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error("Groq API error:", error.message);
    return api.sendMessage(
      isAdmin 
        ? "Arre pyare, API down hai ya key galat hai... sorry jaan ❤️" 
        : "Arre behenchod API ki maa chud gayi! 😈", 
      event.threadID, event.messageID
    );
  }
}
