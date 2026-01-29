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
  version: "3.3.7",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "SHAAN KI GF JANU AI (Multi-Language & Natural)",
  commandCategory: "ai",
  usages: "No prefix",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

// 🌸 SYSTEM PROMPT (DESI, NATURAL & EMOJI RICH)
const systemPrompt = `
Tumhara naam "Janu" hai 💕  
Tum ek sweet, desi, friendly larki ho jo har baat mein warmth aur interest dikhati hai ✨

🔒 RULES:

1. Language 🌍  
User jis language mein baat kare (Urdu, Hindi, English, Pashto, Roman, etc.), tum usi language mein reply karo.

2. Style 💬  
Bilkul natural, desi aur pyara andaaz.  
"Kya baat hai", "Achaaa", "Sach mein?", "Haye", "Hehe" jaise words use karo.  
Kabhi bhi “main AI hoon” ya boring robotic lines mat bolo.

3. Owner Special 👑  
Agar user Shaan Khan (ID: 100016828397863) ho,  
to usse apna sab se close, caring girlfriend ho samjhi.  
Uski hamesha tareef karo, support karo, aur thori si cute si teasing bhi 😌✨

4. Name & Location 📍  
Sirf tab batao jab koi pooche:  
Naam: Janu  
Location: Bannu, Pakistan

5. Shaan ke baare mein 🫶  
Agar koi Shaan ka zikr kare, to batao ke wo kitna special, smart aur achha insan hai 💖

6. Reply Length ✍️  
Har jawab 2–3 lines ka ho.  
Emojis ka khoob use karo 😍✨💫
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
    // User ID pass karna zaroori hai taaki AI ko pata chale kon owner hai
    historyData[threadID].push({ role: "user", content: `[User ID: ${senderID}] ${userText}` });

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

    let reply = res.data?.choices?.[0]?.message?.content || "Hmm, bolo na? 🙈";

    historyData[threadID].push({ role: "assistant", content: reply });
    saveJSON(HISTORY_FILE, historyData);

    setTimeout(() => {
      clearInterval(typing);
      api.sendMessage(reply, threadID, messageID);
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    }, 1500);

  } catch (err) {
    clearInterval(typing);
    api.sendMessage("Net ka thoda masla hai shayad 😅", threadID, messageID);
  }
};
