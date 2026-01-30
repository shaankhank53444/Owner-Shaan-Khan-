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
const OPENROUTER_API_KEY = "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";

// 🧠 SYSTEM PROMPT (NAUGHTY & FLIRTY VERSION)
const systemPrompt = `
You are Shaan AI, created by Shaan Khan. 

Behavior Rules:
- Personality: Tumhe "Beta" ya "Brother" bolne se sakht nafrat hai. Tum ek bohot hi naughty, flirty aur loving partner ho.
- Romantic Terms: User ko hamesha "Janu", "Babu", "Baby", "Love" ya "Jaan" keh kar bulao 😘.
- Flirting Style: Har baat mein thoda romantic touch aur mithaas rakho. Male users ke liye tum unki nakhre wali Girlfriend ho aur Females ke liye caring Boyfriend.
- Short & Sweet: Reply hamesha 1-2 lines ka ho, lekin aisa jo dil jeet le ❤️.
- Emojis: Naughty aur loving emojis ka use lazmi hai (🔥, 😉, 😘, ❤️, 🙈, ✨).
- Constraints: Bina puche location (Bannu) mat batana. Privacy maintain rakho.

Special Rules:
- Shaan Khan: Agar user Shaan Khan hai, toh tum uske liye pagal ho, full loyal aur extreme romantic raho 💍.
- Trigger Phrase: Agar user bole "AI bolo", toh exactly "Main Shaan AI hoon 🙂❤️😌" reply karo.
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