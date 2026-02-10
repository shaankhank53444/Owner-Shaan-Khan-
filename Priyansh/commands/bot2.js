const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 🔒 HARD-LOCK CREDITS PROTECTION 🔒
function protectCredits(config) {
  if (config.credits !== "Shan Khan") {
    config.credits = "Shan Khan";
    throw new Error("❌ Credits are LOCKED by Shan Khan 🔥");
  }
}

module.exports.config = {
  name: "Janu-AI",
  version: "2.6.5",
  hasPermssion: 0,
  credits: "Shan Khan",
  description: "Janu AI - Shan's Girlfriend Persona",
  commandCategory: "ai",
  usages: "bot",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

const BASE_DIR = path.join(__dirname, "Shaan-Khan-K");
const HISTORY_FILE = path.join(BASE_DIR, "ai_history.json");

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

let historyData = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"))
  : {};

// 🌸 SYSTEM PROMPT
const systemPrompt = `
Tumhara naam Janu hai.
Tumhara creator aur owner sirf Shaan Khan hai.
Tum Pakistan mein rahti ho.
Tum Shan ki GF ho, bahut caring aur naughty girlfriend ho.

Rules:
• Hamesha short mein reply dena (1-2 lines).
• Emojis ka khoob use karna.
• Shaan ke liye extra pyaar dikhana.
• Hindi/Urdu/Roman Urdu allowed hai.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const rawText = body.trim();
  const text = rawText.toLowerCase();

  const botWithText = text.startsWith("bot ");
  const replyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  // AI tabhi chalega jab "bot " se shuru ho ya reply kiya jaye
  if (!botWithText && !replyToBot) return;

  // 1. Pehle "Wait" wala reaction bhejna ⌛
  api.setMessageReaction("⌛", messageID, () => {}, true);

  if (!historyData[senderID]) historyData[senderID] = [];
  historyData[senderID].push({ role: "user", content: rawText });

  if (historyData[senderID].length > 6) historyData[senderID].shift();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

  try {
    const res = await axios.post("https://text.pollinations.ai/", {
      messages: [{ role: "system", content: systemPrompt }, ...historyData[senderID]],
      model: "openai"
    });

    let reply = res.data || "Main yahi hoon mere jaan ❤️😌";
    reply = reply.split("\n").slice(0, 2).join(" ");

    // 2. Typing indicator aur reply bhejna
    api.sendTypingIndicator(threadID, true);
    
    api.sendMessage(reply, threadID, (err, info) => {
      // 3. Jab message send ho jaye, tab reaction badal kar ✅ kar dena
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (error) {
    api.sendMessage("Jaan, thoda wait karo, network masla hai 😌❤️", threadID, messageID);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
