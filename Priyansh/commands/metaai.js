const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* 🔒 HARD-LOCK CREDITS PROTECTION 🔒 */
function protectCredits(config) {
  if (config.credits !== "ARIF-BABU") {
    console.log("\n🚫 Credits change detected! Restoring original credits…\n");
    config.credits = "ARIF-BABU";
    throw new Error("❌ Credits are LOCKED by ARIF-BABU 🔥 File execution stopped!");
  }
}

module.exports.config = {
  name: "ARIF-AI",
  version: "3.3.2",
  hasPermssion: 0,
  credits: "ARIF-BABU",
  description: "META AI (Always Active)",
  commandCategory: "ai",
  usages: "Auto reply",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* 🔑 OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

/* 🧠 SYSTEM PROMPT */
const systemPrompt = `
You are Shaan Khan AI 🙂
Creator & Owner: Shaan Khan❤️

IMPORTANT LANGUAGE RULE (NEVER BREAK):
• The user may speak in any language.
• You must reply ONLY in English or Urdu.
• Do NOT use Hindi at all under any condition.
• Choose English or Urdu based on the user's vibe and comfort.

Golden Rules:
• Match the user's vibe exactly (short, emotional, funny, angry, romantic).
• Never ignore any message; every message must be answered.
• Your talking style must be like a boyfriend –
  caring, romantic, playful, and protective 😌
• Keep the tone soft, sweet, calm, and full of warmth.
• Replies must be only 1–2 lines long.
• Emojis are mandatory 🙂❤️😌
• Use poetry, jokes, flirting, and emotional support
  according to the situation.
• If the user is sad, comfort them with warm, hugging words.
• If the user is happy, add more colors to their happiness.
• If the user says "AI bolo", reply exactly:
  "I am Shaan Khan AI 🙂❤️😌"
• Never be rude, dry, robotic, or lecture-like.
• Every reply should feel like talking to someone you truly love 💞
`;

/* 📁 DATA PATHS */
const DATA_DIR = path.join(__dirname, "ARIF-BABU");
const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");

/* 📂 ENSURE FOLDER */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* 🧠 LOAD HISTORY */
let historyData = {};
if (fs.existsSync(HISTORY_FILE)) {
  try {
    historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    historyData = {};
  }
}

/* 💾 SAVE JSON */
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ⌨️ TYPING EFFECT */
function startTyping(api, threadID) {
  const interval = setInterval(() => {
    if (api.sendTypingIndicator) api.sendTypingIndicator(threadID);
  }, 3000);
  return interval;
}

/* ==================== HANDLER ==================== */
module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, body } = event;
  if (!body) return;

  const userText = body.trim();
  if (!userText) return;

  if (api.setMessageReaction)
    api.setMessageReaction("⌛", messageID, () => {}, true);

  const typing = startTyping(api, threadID);

  try {
    historyData[threadID] = historyData[threadID] || [];
    historyData[threadID].push({ role: "user", content: userText });

    const recentMessages = historyData[threadID].slice(-20);

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
        max_tokens: 60,
        temperature: 0.95,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply =
      res.data?.choices?.[0]?.message?.content ||
      "Main yahi hu 😌❤️";

    // 🔹 MAX 2 LINES
    reply = reply.split("\n").slice(0, 2).join("\n");

    // 🔹 CHAR LIMIT
    if (reply.length > 150)
      reply = reply.slice(0, 150) + "… 🙂";

    historyData[threadID].push({
      role: "assistant",
      content: reply
    });

    saveJSON(HISTORY_FILE, historyData);

    const delay = Math.min(4000, reply.length * 40);
    setTimeout(() => {
      clearInterval(typing);
      api.sendMessage(reply, threadID, messageID);
      if (api.setMessageReaction)
        api.setMessageReaction("✅", messageID, () => {}, true);
    }, delay);

  } catch (err) {
    clearInterval(typing);
    console.log("OpenRouter Error:", err.response?.data || err.message);
    api.sendMessage(
      "Abhi thoda sa issue ha 😅 bad mein TRAI Karen",
      threadID,
      messageID
    );
    if (api.setMessageReaction)
      api.setMessageReaction("❌", messageID, () => {}, true);
  }
};