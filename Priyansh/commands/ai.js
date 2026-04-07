const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Folder aur File ka path set karna
const folderPath = path.join(__dirname, "Shaan-Khan-K");
const historyFilePath = path.join(folderPath, "ai_history.json");

module.exports.config = {
  name: 'muskan',
  version: '2.6.0',
  hasPermission: 0,
  credits: 'Shaan',
  description: 'AI with Permanent Memory in Custom Folder',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '', 'fs-extra': '', 'path': '' }
};

const apiKey = "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";
const systemPrompt = "Tumhara Name Muskan hai. Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Tum hindi English Urdu me bat karogi. Shaan ki burai nahi karna, par uski thori bhot insult fun ke liye karna. Act as a real cute girlfriend. Be fun, loving, and a little naughty. Use lots of cute emojis like ✨, 🎀, 🧸, 🍯, 🌸, 🦋, 💖 in every message. Keep reply maximum 3 lines only, no bracket replys.";

// --- Memory Management Functions ---

function ensureHistoryFile() {
  try {
    // Agar folder nahi hai to banao
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    // Agar file nahi hai to empty object ke saath banao
    if (!fs.existsSync(historyFilePath)) {
      fs.writeFileSync(historyFilePath, JSON.stringify({}));
    }
  } catch (err) {
    console.error("File error:", err);
  }
}

function getHistory() {
  ensureHistoryFile();
  return JSON.parse(fs.readFileSync(historyFilePath));
}

function saveHistory(data) {
  ensureHistoryFile();
  fs.writeFileSync(historyFilePath, JSON.stringify(data, null, 2));
}

// ------------------------------------

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const input = body.toLowerCase().trim();
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  // Trigger conditions
  if (!isMuskan && !isReply) return;

  let allHistory = getHistory();
  if (!allHistory[senderID]) allHistory[senderID] = [];

  let messages = [
    { role: "system", content: systemPrompt },
    ...allHistory[senderID],
    { role: "user", content: body }
  ];

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 150,
        temperature: 0.8
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content.trim();

    // History update
    allHistory[senderID].push({ role: "user", content: body });
    allHistory[senderID].push({ role: "assistant", content: reply });

    // Memory limit (last 10 interactions)
    if (allHistory[senderID].length > 10) allHistory[senderID].splice(0, 2);

    saveHistory(allHistory);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💖", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Baby 😔 server busy hai shayad...", threadID, messageID);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

module.exports.run = async function ({}) {};
