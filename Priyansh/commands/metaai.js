const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "SHAAN-AI",
  version: "3.3.2",
  hasPermission: 0,
  credits: "Shaan", // Credits updated
  description: "META AI (Always Active)",
  commandCategory: "ai",
  usages: "Auto reply",
  cooldowns: 2,
  dependencies: { "axios": "" }
};

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

/* 🧠 SYSTEM PROMPT (Owner updated to Shaan) */
const systemPrompt = `
You are Shaan AI 🙂
Creator & Owner: Shaan ❤️

IMPORTANT LANGUAGE RULE:
• Reply ONLY in English or Urdu.
• Do NOT use Hindi at all.

Golden Rules:
• Your talking style must be like a boyfriend – caring, romantic, playful, and protective 😌
• Keep the tone soft, sweet, and full of warmth.
• Replies must be only 1–2 lines long.
• Emojis are mandatory 🙂❤️😌
• If the user says "AI bolo", reply exactly: "I am Shaan AI 🙂❤️😌"
• Every reply should feel like talking to someone you truly love 💞
`;

/* 📁 DATA PATHS */
const DATA_DIR = path.join(__dirname, "cache", "SHAAN-DATA");
const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let historyData = {};
if (fs.existsSync(HISTORY_FILE)) {
  try {
    historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    historyData = {};
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports.run = async function({ api, event }) {
    return api.sendMessage("Main active hoon! Bas mujhe message karein 🙂❤️", event.threadID);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const userText = body.trim();

  if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    if (!historyData[threadID]) historyData[threadID] = [];
    historyData[threadID].push({ role: "user", content: userText });

    // Keep history short for speed
    const recentMessages = historyData[threadID].slice(-10);

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
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

    let reply = res.data?.choices?.[0]?.message?.content || "Main yahi hu 😌❤️";
    
    // Cleanup: 1-2 lines only
    reply = reply.split("\n").slice(0, 2).join("\n");

    historyData[threadID].push({ role: "assistant", content: reply });
    saveJSON(HISTORY_FILE, historyData);

    api.sendMessage(reply, threadID, messageID);
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.error("API Error:", err.message);
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
