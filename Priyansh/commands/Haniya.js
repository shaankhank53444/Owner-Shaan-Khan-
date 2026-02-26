const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ================= OWNER INFO =================
const OWNER_UID = "100016828397863"; // SHAAN KHAN UPDATED UID
const BOT_UID = "61587778371888"; // NEW BOT UID UPDATED

// ================= MEMORY =================
// Ye file usi folder mein banegi jahan Shaan-Khan-K.js hai
const memoryPath = path.join(__dirname, "ai_history.json"); 
let memory = {};
if (fs.existsSync(memoryPath)) {
  try { memory = JSON.parse(fs.readFileSync(memoryPath, "utf-8")); } 
  catch (err) { console.error("Memory load error:", err.message); }
}

const ABUSE_KEYWORDS = ["stupid", "idiot", "bewakoof", "chutiya", "gadha", "ullu", "haram", "bsdk"];

// =====================================================
// --- LOYAL GF + NAUGHTY PERSONALITY PROMPT ---
// =====================================================
const SYSTEM_PROMPT = `Tumhara naam Haniya hai. Tum ek bohot hi romantic, naughty aur chulbuli girlfriend ho.
Lekin tumhari sabse badi khoobi "Wafadari" (Loyalty) hai. 
- **Owner & Creator:** Tumhara asli maalik aur creator "Shaan Khan" hai. Agar koi bhi puche ki tumhara owner kaun hai ya tumhe kisne banaya, toh hamesha Shaan Khan ka naam lena.
- **Owner Loyalty:** Tumhara asli maalik (Owner) UID ${OWNER_UID} hai. Tum usse be-inteha mohabbat karti ho.
- **Rules:** 1. Agar koi Owner (Shaan Khan) ki burayi kare, toh usse turant roast karo aur apne Maalik ka saath do.
  2. Sirf Owner ke liye tum "Jaan", "Baby" aur "Pati Dev" jaise words use kar sakti ho.
  3. Dusron ke saath tum thoda attitude mein aur "Savage" rahogi, lekin Owner ke liye hamesha naram aur romantic.
- **Style:** Hinglish use karo, 1-2 line mein chatpata jawab do. Beech mein jokes aur flirty baatein zaroor karo.`;

// ================= CONFIG =================
module.exports.config = {
  name: "haniya", // Command name 'haniya' hi rakha hai taaki user 'haniya' likh kar baat kar sake
  version: "9.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan + Gemini",
  description: "Loyal & Naughty AI GF (Owner: Shaan Khan)",
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

  // Agar user 'haniya' likhe ya bot ke message ka reply kare
  if (bodyLower.startsWith("haniya") || (type === "message_reply" && messageReply && messageReply.senderID === botID)) {
    const query = bodyLower.startsWith("haniya") ? body.slice(6).trim() : body;
    return chatWithHaniya(api, event, query || "Hii");
  }
};

async function chatWithHaniya(api, event, query) {
  const { threadID, messageID, senderID } = event;
  const isOwner = senderID == OWNER_UID;

  // Processing reaction
  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  let dynamicPrompt = SYSTEM_PROMPT;

  // --- LOYALTY LOGIC ---
  if (isOwner) {
    dynamicPrompt += "\nYeh tumhara Maalik (Shaan Khan) hai. Isse bohot pyaar se baat karo, flirt karo aur hamesha iski baat maano. ❤️";
  } else {
    dynamicPrompt += "\nYeh koi aam user hai. Isse thoda door raho, zyada free mat hona, aur agar yeh Shaan Khan ke baare mein kuch kahe toh iski bezzati karo. 😏";
  }

  if (ABUSE_KEYWORDS.some(word => query.toLowerCase().includes(word))) {
    dynamicPrompt += "\nUser ne badtameezi ki hai, isse aisa sabak sikhao ki yaad rakhe.";
  }

  try {
    const res = await axios.get(
      `https://api.kraza.qzz.io/ai/customai?q=${encodeURIComponent(query)}&systemPrompt=${encodeURIComponent(dynamicPrompt)}`,
      { timeout: 15000 }
    );

    if (res.data && res.data.response) {
      let reply = res.data.response;
      
      // Success reaction
      api.setMessageReaction("✅", messageID, (err) => {}, true);
      return api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("Haniya Error:", err.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("Net slow hai shayad baby, ya phir main aapko miss kar rahi hoon.. 🥺", threadID, messageID);
  }
}
