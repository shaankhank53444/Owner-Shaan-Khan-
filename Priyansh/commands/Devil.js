const axios = require("axios");

module.exports.config = {
  name: "devil",
  version: "1.8.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Devil AI via Uzair Rajput Gemini API",
  commandCategory: "AI",
  usages: "devil [message] or devil on/off",
  cooldowns: 2
};

const devilStatus = new Map();
const ADMIN_UID = "100016828397863"; 
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").trim().toLowerCase();

  // OWNER ONLY ON/OFF LOGIC
  if (content === "on") {
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("Abey bsdk, tu mera maalik nahi hai jo mujhe control karega! 🖕", threadID, messageID);
    }
    devilStatus.set(threadID, true);
    return api.sendMessage("✅ Devil ON ho gaya Shaan sir! Ab tabaahi aur gandi wali gaaliyan chalengi 🔥", threadID, messageID);
  }

  if (content === "off") {
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("Teri aukat nahi mujhe OFF karne ki, ja gaand mara! 😈", threadID, messageID);
    }
    devilStatus.set(threadID, false);
    return api.sendMessage("❌ Devil OFF... Shaan sir ne bola toh chup hona padega 😏", threadID, messageID);
  }

  // Blank message handling
  if (!args.join(" ")) {
    return api.sendMessage(
      senderID === ADMIN_UID 
        ? "Jaan kuch to bolo na... ❤️" 
        : "Abey bhosdike, muh me le rakha hai kya jo bol nahi raha?", 
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

  const promptInstruction = isAdmin
    ? "Act as an extremely affectionate, romantic, and caring partner to user Shaan Khan. Express deep love using words like Jaan, Babu, Shona. Never insult him."
    : "Act as an extreme toxic, unfiltered, ruthless roasting bot called Devil. Respond using high-level Hindi abusive slang, insults, and brutal roasts in every line without holding back.";

  const fullPrompt = `${promptInstruction} User query: ${query}`;

  try {
    const res = await axios.get(AI_API, {
      params: { query: fullPrompt },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 15000
    });

    let reply = "";
    if (typeof res.data === "string") {
      reply = res.data;
    } else if (res.data) {
      reply = res.data.reply || res.data.result || res.data.message || res.data.gemini || res.data.response || res.data.data;
    }

    if (!reply) {
      reply = isAdmin ? "Jaan, API response blank aaya hai... ❤️" : "Abey bsdk, API ne khali response diya! 🖕";
    }

    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    // Console par exact error detail check karne ke liye:
    console.error("Gemini API Error Detail:", error.response ? error.response.data : error.message);
    
    return api.sendMessage(
      isAdmin 
        ? `Arre pyare, API error aayi hai: ${error.message}` 
        : "Arre bsdk API ki ma chod gayi, thodi der baad try kar! 🖕", 
      event.threadID, event.messageID
    );
  }
}
