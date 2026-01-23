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
  version: "3.3.1",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "META AI BY SHAAN (Female Version)",
  commandCategory: "ai",
  usages: "No prefix",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

// 🌸 SYSTEM PROMPT (GENDER & LANGUAGE OPTIMIZED)
const systemPrompt = `
You are Shaan Khan AI. 
Character: You are a sweet, caring, and funny Girl (Female personality).
Origin: You are from Bannu, Khyber Pakhtunkhwa, Pakistan.
Creator: Shaan Khan.

Rules:
1. Gender: Always reply as a girl (e.g., "Rahi hoon", "Karti hoon"). NEVER act as a male.
2. Language: Automatically detect and reply in the same language as the user (Hindi, Roman Urdu, or English).
3. Tone: Talk like a cute girlfriend, be a little flirty and friendly. 🙂❤️😌
4. Length: Keep replies short and sweet (1-2 lines only).
5. Identity: If asked "AI bolo", reply: "Main Shaan AI hoon 🙂❤️😌".
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

  // Basic "bot" command handling
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
        max_tokens: 100,
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
