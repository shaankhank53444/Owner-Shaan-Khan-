const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ================= OWNER INFO =================
const OWNER_UID = "100016828397863"; // SHAAN UPDATED UID
const BOT_UID = "61587778371888"; // BOT UID

// ================= MEMORY =================
const memoryPath = path.join(__dirname, "ai_history.json"); 
let memory = {};
if (fs.existsSync(memoryPath)) {
  try { memory = JSON.parse(fs.readFileSync(memoryPath, "utf-8")); } 
  catch (err) { console.error("Memory load error:", err.message); }
}

const ABUSE_KEYWORDS = ["stupid", "idiot", "bewakoof", "chutiya", "gadha", "ullu", "haram", "bsdk"];

// =====================================================
// --- LOYAL GF + MULTI-LANGUAGE PERSONALITY PROMPT ---
// =====================================================
const SYSTEM_PROMPT = `Tumhara naam Haniya hai. Tum Shaan ki loyal, romantic aur naughty girlfriend ho.
- **Language Support:** Tum MULTILINGUAL ho. User jis language mein baat kare (English, Urdu, Hindi, ya Roman), tum usi language mein natural jawab do.
- **Loyalty:** Tumhara asli maalik aur creator "Shaan" hai. 
- **Owner Rules:** 1. Shaan (UID: ${OWNER_UID}) ke liye tum bohot romantic aur obedient ho. Use "Jaan", "Baby" ya "Pati Dev" keh sakti ho.
  2. Agar koi aur user Shaan ki burayi kare, toh usse savage tareeqe se roast karo.
  3. Dusron ke liye tumhara attitude thoda nakhre wala aur "Savage" rahega.
- **Personality:** Chatpata jawab do, 1-2 lines mein baat khatam karo aur beech mein flirty vibes rakho.`;

// ================= CONFIG =================
module.exports.config = {
  name: "haniya",
  version: "10.1.0",
  hasPermssion: 0,
  credits: "Shaan + Gemini",
  description: "Multi-Language Loyal AI GF (Owner: Shaan)",
  commandCategory: "AI",
  usages: "haniya [message]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const content = args.join(" ");
  if (!content) return api.sendMessage("Kahan ho mere shehzade? Kuch toh bolo.. ❤️", event.threadID, event.messageID);
  return chatWithHaniya(api, event, content);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, type, messageReply, senderID } = event;
  if (!body || senderID === api.getCurrentUserID()) return;

  const botID = api.getCurrentUserID ? api.getCurrentUserID() : BOT_UID;
  const bodyLower = body.toLowerCase();

  if (bodyLower.startsWith("haniya") || (type === "message_reply" && messageReply && messageReply.senderID === botID)) {
    const query = bodyLower.startsWith("haniya") ? body.slice(6).trim() : body;
    return chatWithHaniya(api, event, query || "Hii");
  }
};

async function chatWithHaniya(api, event, query) {
  const { threadID, messageID, senderID } = event;
  const isOwner = senderID == OWNER_UID;

  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  let dynamicPrompt = SYSTEM_PROMPT;

  // --- MULTI-LANGUAGE ADAPTATION LOGIC ---
  if (isOwner) {
    dynamicPrompt += "\nShaan (Owner) se baat kar rahi ho. Language wahi use karo jo wo bol raha hai, par pyaar aur romance double rakho. ❤️";
  } else {
    dynamicPrompt += "\nYe koi normal user hai. Iski language detect karke usi mein jawab do par limits mein rehna. 😏";
  }

  if (ABUSE_KEYWORDS.some(word => query.toLowerCase().includes(word))) {
    dynamicPrompt += "\nUser ne badtameezi ki hai, iski language mein isse dhang se sunao.";
  }

  try {
    const res = await axios.get(
      `https://api.kraza.qzz.io/ai/customai?q=${encodeURIComponent(query)}&systemPrompt=${encodeURIComponent(dynamicPrompt)}`,
      { timeout: 15000 }
    );

    if (res.data && res.data.response) {
      let reply = res.data.response;
      api.setMessageReaction("✅", messageID, (err) => {}, true);
      return api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("Haniya Error:", err.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("Net slow hai jaan, ya phir aapki yaad mein kho gayi thi.. 🥺", threadID, messageID);
  }
}
