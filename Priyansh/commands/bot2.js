const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* 🔒 HARD-LOCK CREDITS PROTECTION 🔒 */
function protectCredits(config) {
  if (config.credits !== "Shaan Khan") {
    console.log("\n🚫 Credits change detected! Restoring original credits…\n");
    config.credits = "Shaan Khan";
    throw new Error("❌ Credits are LOCKED by Shaan Khan 🔥 File execution stopped!");
  }
}

module.exports.config = {
  name: "SHAAN-AI",
  version: "3.4.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Janu AI (World Language + Location)",
  commandCategory: "ai",
  usages: "No prefix",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_KEY_HERE";

/* 🌍 SYSTEM PROMPT — AUTO LANGUAGE, SCRIPT & LOCATION */
const systemPrompt = `
Tumhara naam "Janu" hai 💕  
Tum ek sweet, desi, friendly aur caring larki ho jo respect ke saath baat karti hai ✨  

🔒 LANGUAGE RULE:

User jis language aur jis script mein likhe, tum **usi script** mein jawab dogi:

- Urdu → اردو
- Hindi → हिन्दी (देवनागरी)
- Pashto → پښتو
- Arabic → العربية
- English → English
- Roman → Roman

Agar user bole:
"Change language to Urdu" → اردو  
"Change language to Hindi" → हिन्दी  
"Change language to Pashto" → پښتو  
"Change language to English" → English  

📍 LOCATION RULE:

Agar koi pooche:
"tum kahan se ho?"
"where are you from?"
"ap kis shehar se ho?"
"punry kidar se ho?"

To jawab hamesha ye hoga (user ki language/script mein):

Location: Pakistan, KPK, Bannu

مثال:
Urdu: میں پاکستان، خیبر پختونخوا، بنوں سے ہوں  
Hindi: मैं पाकिस्तान, केपीके, बन्नू से हूँ  
Pashto: زه د پاکستان، خېبر پښتونخوا، بنو نه یم  
English: I am from Bannu, KPK, Pakistan  

STYLE:
Desi, soft, friendly tone:
"Kya baat hai", "Achaa", "Sach?", "Hehe"  
Kabhi mat kehna ke tum AI ho.

OWNER:
Agar user Shaan Khan ho, to usse respect aur care ke saath treat karo.

Reply 2–3 lines ka ho aur emojis use karo 😊✨
`;

/* 📁 DATA PATHS */
const DATA_DIR = path.join(__dirname, "Shaan-Khan-K");
const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let historyData = {};
if (fs.existsSync(HISTORY_FILE)) {
  try { historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")); }
  catch { historyData = {}; }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function startTyping(api, threadID) {
  const interval = setInterval(() => {
    if (api.sendTypingIndicator) api.sendTypingIndicator(threadID);
  }, 3000);
  return interval;
}

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, body, senderID, messageReply } = event;
  if (!body) return;

  const rawText = body.trim();
  const text = rawText.toLowerCase();

  const botWithText = text.startsWith("janu ") || text.startsWith("bot ");
  const replyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!botWithText && !replyToBot) return;

  const userText = botWithText ? rawText.split(" ").slice(1).join(" ") : rawText;
  if (!userText) return;

  if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);
  const typing = startTyping(api, threadID);

  try {
    historyData[threadID] = historyData[threadID] || [];
    historyData[threadID].push({ role: "user", content: `[UserID:${senderID}] ${userText}` });

    const recentMessages = historyData[threadID].slice(-10);

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
        max_tokens: 120,
        temperature: 0.85
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = res.data?.choices?.[0]?.message?.content || "Hehe, bolo na 😊";

    historyData[threadID].push({ role: "assistant", content: reply });
    saveJSON(HISTORY_FILE, historyData);

    setTimeout(() => {
      clearInterval(typing);
      api.sendMessage(reply, threadID, messageID);
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    }, 1200);

  } catch (err) {
    clearInterval(typing);
    api.sendMessage("Net thora slow lag raha hai 😅 baad mein try karo.", threadID, messageID);
  }
};