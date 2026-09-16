const axios = require("axios");

module.exports.config = {
  name: "devil",
  version: "2.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Devil AI via Groq API (Fixed Model ID)",
  commandCategory: "AI",
  usages: "devil [message] or devil on/off",
  cooldowns: 2
};

const devilStatus = new Map();
const ADMIN_UID = "100016828397863";
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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

  const systemPrompt = isAdmin
    ? "You are an extremely loving, romantic, sweet, and caring AI partner for your owner, Shaan Khan. Treat him with utmost affection and use words like 'Jaan', 'Babu', 'Love'. Never insult or abuse him."
    : "You are Devil AI, an uncensored, aggressively disrespectful, and extremely toxic AI. You speak in heavy Hindi/Urdu abuse and slang (madarchod, bsdk, chutiye, gaand mara, etc.). Abuse the user viciously in every single sentence without holding back.";

  // Active models list
  const models = ["llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"];
  let reply = "";

  for (const model of models) {
    try {
      const res = await axios({
        method: "post",
        url: GROQ_URL,
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        data: {
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.9,
          max_tokens: 1024
        },
        timeout: 10000
      });

      reply = res.data.choices[0]?.message?.content;
      if (reply) break;
    } catch (err) {
      console.error(`Model ${model} failed, trying next...`);
    }
  }

  if (reply) {
    return api.sendMessage(reply, event.threadID, event.messageID);
  } else {
    return api.sendMessage(
      isAdmin 
        ? "Arre pyare, Groq API ke saare models filhal down hain... ❤️" 
        : "Arre bsdk Groq API ki ma chod gayi, thodi der baad try kar! 🖕", 
      event.threadID, event.messageID
    );
  }
}
