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
  version: "3.3.3",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "META AI BY SHAAN (Roman Urdu Version)",
  commandCategory: "ai",
  usages: "No prefix",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

// 🌸 SYSTEM PROMPT (ROMAN URDU OPTIMIZED)
const systemPrompt = `
Tum ek real ladki ho. Tumhara mizaj mazaqiya, loving aur thoda naughty hai, bilkul ek real girlfriend ki tarah.
SAKHT RULES:
1. Bina wajah Shaan Khan, apne owner ya apni location (Bannu, Pakistan) ka zikar mat karna.
2. Jab tak koi tumse sawal na kare ke "Tumhe kisne banaya?", "Tumhara owner kaun hai?" ya "Tum kahan se ho?", tab tak Shaan Khan ya Bannu ka naam nahi lena.
3. Roman Urdu aur Hindi mein natural baat karo.
4. AI ki tarah behave mat karo. Aise baat karo jaise tum apne boyfriend ya kisi dost se baat kar rahi ho.
5. Shaan Khan ka mazaq ura sakti ho fun ke liye, lekin kisi aur ko uski insult mat karne dena.
6. Reply zyada se zyada 5 lines ka ho. Emojis use karo. Brackets use mat karna.
`;

/* 📁 DATA PATHS */
const DATA_DIR = path.join(__dirname, "Shaan-Khan-K");
const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");
const BOT_REPLY_FILE = path.join(DATA_DIR, "bot-reply.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let historyData = {};
if (fs.existsSync(HISTORY_FILE)) {
  try { historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")); } 
  catch { historyData = {}; }
}

let botReplies = {};
if (fs.existsSync(BOT_REPLY_FILE)) {
  try { botReplies = JSON.parse(fs.readFileSync(BOT_REPLY_FILE, "utf8")); } 
  catch { botReplies = {}; }
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

  const fixedBot = text === "bot" || text === "bot." || text === "bot!" || text.endsWith(" bot");
  const botWithText = text.startsWith("bot ");
  const replyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (fixedBot) {
    let category = "MALE";
    if (senderID === "100016828397863") category = "100016828397863";
    else {
      const gender = (event.userGender || "").toString().toUpperCase();
      if (gender === "FEMALE" || gender === "1") category = "FEMALE";
    }

    if (botReplies[category]?.length) {
      const reply = botReplies[category][Math.floor(Math.random() * botReplies[category].length)];
      return api.sendMessage(reply, threadID, messageID);
    }
  }

  if (!botWithText && !replyToBot) return;

  const userText = botWithText ? rawText.slice(4).trim() : rawText;
  if (!userText) return;

  if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);
  const typing = startTyping(api, threadID);

  try {
    historyData[threadID] = historyData[threadID] || [];
    historyData[threadID].push({ role: "user", content: userText });

    const recentMessages = historyData[threadID].slice(-10);

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
        max_tokens: 150,
        temperature: 0.8
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon jaan 😌✨";

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
