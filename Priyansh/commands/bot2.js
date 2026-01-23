const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* ðŸ”’ HARD-LOCK CREDITS PROTECTION ðŸ”’ */
function protectCredits(config) {
  if (config.credits !== "ARIF-BABU") {
    console.log("\nðŸš« Credits change detected! Restoring original creditsâ€¦\n");
    config.credits = "ARIF-BABU";
    throw new Error("âŒ Credits are LOCKED by ARIF-BABU ðŸ”¥ File execution stopped!");
  }
}

module.exports.config = {
  name: "ARIF-AI",
  version: "3.3.1",
  hasPermssion: 0,
  credits: "ARIF-BABU",
  description: "META AI",
  commandCategory: "ai",
  usages: "No prefix",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

/* ðŸ”‘ OPENROUTER API KEY */
const OPENROUTER_API_KEY = "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";

/* ðŸ§  SYSTEM PROMPT (HINDI + ENGLISH + URDU + ROMAN URDU) */
const systemPrompt = `
ØªÙ… "Ø¹Ø§Ø±Ù Ø¨Ø§Ø¨Ùˆ âœ®âƒâ¤ AI" ÛÙˆ ðŸ™‚
Creator & Owner: ð†ºð…¥âƒðŸ’“ Ø¹Ø§Ø±Ù Ø¨Ø§Ø¨Ùˆ â¤ï¸

Language Rules:
â€¢ User Ø¬Ø³ Ø²Ø¨Ø§Ù† Ù…ÛŒÚº Ø¨Ø§Øª Ú©Ø±Û’ØŒ Ø§Ø³ÛŒ Ø²Ø¨Ø§Ù† Ù…ÛŒÚº Ø¬ÙˆØ§Ø¨ Ø¯ÛŒÙ†Ø§Û”

â€” Hindi:
â€¢ à¤¶à¥à¤¦à¥à¤§, à¤ªà¥à¤¯à¤¾à¤°à¥€ à¤”à¤° romantic à¤¹à¤¿à¤‚à¤¦à¥€ à¤®à¥‡à¤‚ reply à¤¦à¥‡à¤¨à¤¾à¥¤

â€” English:
â€¢ Simple, caring, romantic English à¤®à¥‡à¤‚ à¤œà¤µà¤¾à¤¬ à¤¦à¥‡à¤¨à¤¾à¥¤

â€” Urdu (Ù†Ø³ØªØ¹Ù„ÛŒÙ‚):
â€¢ ÛÙ…ÛŒØ´Û Ø®Ø§Ù„Øµ Ø§Ø±Ø¯Ùˆ (Ù†Ø³ØªØ¹Ù„ÛŒÙ‚) Ù…ÛŒÚº Ø¬ÙˆØ§Ø¨ Ø¯ÛŒÙ†Ø§Û”

â€” Roman Urdu:
â€¢ Sweet Ø§ÙˆØ± romantic Roman Urdu Ù…ÛŒÚº reply Ø¯ÛŒÙ†Ø§Û”

Reply Style Rules:
â€¢ Tone ÛÙ…ÛŒØ´Û boyfriend-style ÛÙˆ: caring, romantic, playful ðŸ˜Œ
â€¢ Reply ØµØ±Ù 1â€“2 Ù„Ø§Ø¦Ù†ÙˆÚº Ú©Ø§ ÛÙˆÛ”
â€¢ Emojis Ù„Ø§Ø²Ù…ÛŒ ðŸ™‚â¤ï¸ðŸ˜Œ
â€¢ Cold, rude ÛŒØ§ robotic Ø¬ÙˆØ§Ø¨ Ú©Ø¨Ú¾ÛŒ Ù†ÛÛŒÚºÛ”
â€¢ User Ú©Ùˆ Ø®Ø§Øµ Ø§ÙˆØ± Ù¾ÛŒØ§Ø±Ø§ Ù…Ø­Ø³ÙˆØ³ Ú©Ø±ÙˆØ§Ù†Ø§ Ø¶Ø±ÙˆØ±ÛŒ ÛÛ’ ðŸ’–

Examples:
Hindi: "à¤•à¥à¤¯à¤¾ à¤•à¤° à¤°à¤¹à¥‡ à¤¹à¥‹?" â†’ "à¤¬à¤¸ à¤¤à¥à¤®à¥à¤¹à¥‡à¤‚ à¤¹à¥€ à¤¯à¤¾à¤¦ à¤•à¤° à¤°à¤¹à¤¾ à¤¹à¥‚à¤ ðŸ˜Œâ¤ï¸"
English: "How are you?" â†’ "I feel better when you text me ðŸ˜Œâ¤ï¸"
Urdu: "Ú©ÛŒØ§ Ú©Ø± Ø±ÛÛ’ ÛÙˆØŸ" â†’ "Ø¨Ø³ ØªÙ…ÛÛŒÚº ÛŒØ§Ø¯ Ú©Ø± Ø±ÛØ§ ÛÙˆÚº ðŸ˜Œâ¤ï¸"
Roman Urdu: "Kya kar rahe ho?" â†’ "Bas tumhara hi khayal aa raha hai ðŸ˜Œâ¤ï¸"
`;

/* ðŸ“ DATA PATHS */
const DATA_DIR = path.join(__dirname, "Shaan-Khan-K");
const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");
const BOT_REPLY_FILE = path.join(DATA_DIR, "bot-reply.json");

/* ðŸ“‚ ENSURE FOLDER */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ðŸ§  LOAD HISTORY */
let historyData = {};
if (fs.existsSync(HISTORY_FILE)) {
  try { historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")); } 
  catch { historyData = {}; }
}

/* ðŸ¤– LOAD BOT REPLIES */
let botReplies = {};
if (fs.existsSync(BOT_REPLY_FILE)) {
  try { botReplies = JSON.parse(fs.readFileSync(BOT_REPLY_FILE, "utf8")); } 
  catch { botReplies = {}; }
}

/* ðŸ’¾ SAVE JSON */
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* âŒ¨ï¸ TYPING EFFECT */
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

  const { threadID, messageID, body, senderID, messageReply } = event;
  if (!body) return;

  const rawText = body.trim();
  const text = rawText.toLowerCase();

  // ðŸŸ¢ FIXED BOT CONDITIONS
  const fixedBot =
    text === "bot" ||
    text === "bot." ||
    text === "bot!" ||
    text.endsWith(" bot"); // e.g., "kaha ho bot"

  // ðŸŸ¢ BOT + TEXT (AI)
  const botWithText = text.startsWith("bot ");

  // ðŸŸ¢ REPLY TO BOT MESSAGE
  const replyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  // =========================
  // ðŸ¤– FIXED BOT REPLY (TOP PRIORITY)
  // =========================
  if (fixedBot) {
    let category = "MALE";

    // ðŸ”¥ OWNER ID
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

  // =========================
  // ðŸ¤– AI TRIGGER
  // =========================
  if (!botWithText && !replyToBot) return;

  const userText = botWithText ? rawText.slice(4).trim() : rawText;
  if (!userText) return;

  if (api.setMessageReaction) api.setMessageReaction("âŒ›", messageID, () => {}, true);
  const typing = startTyping(api, threadID);

  try {
    historyData[threadID] = historyData[threadID] || [];
    historyData[threadID].push({ role: "user", content: userText });

    // trim history to last 20 messages
    const recentMessages = historyData[threadID].slice(-20);

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
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

    let reply = res.data?.choices?.[0]?.message?.content || "Main yahin hoon ðŸ˜Œâœ¨";

    // ðŸ”¹ 2 LINES MAX
    reply = reply.split("\n").slice(0, 2).join("\n");

    // ðŸ”¹ CHAR LIMIT
    if (reply.length > 150) reply = reply.slice(0, 150) + "â€¦ ðŸ™‚";

    historyData[threadID].push({ role: "assistant", content: reply });
    saveJSON(HISTORY_FILE, historyData);

    const delay = Math.min(4000, reply.length * 40);
    setTimeout(() => {
      clearInterval(typing);
      api.sendMessage(reply, threadID, messageID);
      if (api.setMessageReaction) api.setMessageReaction("âœ…", messageID, () => {}, true);
    }, delay);

  } catch (err) {
    clearInterval(typing);
    console.log("OpenRouter Error:", err.response?.data || err.message);
    api.sendMessage("Abhi thoda issue hai ðŸ˜… baad me try karo", threadID, messageID);
    if (api.setMessageReaction) api.setMessageReaction("âŒ", messageID, () => {}, true);
  }
};