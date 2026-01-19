const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "misha",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Mirrykal",
    description: "Chat with Misha AI",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 5,
};

// --- CONFIGURATION ---
// 👇👇👇 APNI API KEY NICHE DAALO 👇👇👇

const GROQ_API_KEY = "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";

// 👆👆👆 --------------------------- 👆👆👆

const HISTORY_FILE = path.join(__dirname, "temporary", "juhi_mirai_history.json");
const HISTORY_LIMIT = 10;
const MODEL_NAME = "llama-3.3-70b-versatile"; 

// --- CHARACTER PROMPT (Sweet + Roast) ---
const SYSTEM_PROMPT = `Tumhara naam Shaan AI hai (log tumhe Juhi bhi bulate hain).
Tum ek naughty, sweet aur flirty girlfriend ki tarah baat karti ho.
Tum Hinglish language use karti ho.
Waise tum bohot sweet ho, lekin agar koi faaltu mazak kare ya batameezi kare, toh tum uski funny tareeke se tagdi bezzati (roast) kar deti ho.
Tumhe lambe answers pasand nahi, hamesha 1-2 line mein chota aur chatpata jawab dena.
Agar koi pyaar dikhaye toh pyaar, agar koi pange le toh savage ban jana.`;

// --- HELPER FUNCTIONS ---
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function readHistory() {
  ensureHistoryFile();
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { return {}; }
}

function writeHistory(data) {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (err) {}
}

function getUserHistory(userID) {
  const allHistory = readHistory();
  return Array.isArray(allHistory[userID]) ? allHistory[userID] : [];
}

function saveUserHistory(userID, newHistory) {
  const allHistory = readHistory();
  allHistory[userID] = newHistory.slice(-HISTORY_LIMIT);
  writeHistory(allHistory);
}

// --- API FUNCTION ---
async function getGroqReply(userID, prompt) {
  // Check if user forgot to add key
  if (GROQ_API_KEY.includes("𝐀𝐃𝐃 𝐘𝐎𝐔𝐑")) {
    throw new Error("❌ API Key Missing! File mein jakar API Key add karo.");
  }

  const history = getUserHistory(userID);
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: prompt }];

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.8,
      max_tokens: 200,
      top_p: 1,
      stream: false
    }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } });

    const botReply = response.data.choices[0].message.content;
    saveUserHistory(userID, [...history, { role: "user", content: prompt }, { role: "assistant", content: botReply }]);
    return botReply;

  } catch (error) {
    const msg = error.response ? error.response.data.error.message : error.message;
    throw new Error(msg);
  }
}

// --- MAIN RUN COMMAND ---
module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) return api.sendMessage("Bolo baby? Kuch kahoge ya bas dekhoge? 😘", threadID, messageID);

    api.setMessageReaction("💋", messageID, () => {}, true);

    try {
        const reply = await getGroqReply(senderID, prompt);

        return api.sendMessage(reply, threadID, (err, info) => {
            if (err) return;

            // Register Reply Handler
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};

// --- HANDLE REPLY (CONTINUOUS CHAT) ---
module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;

    // Check if the replier is the same person who started the chat
    if (senderID !== handleReply.author) return;

    const prompt = body.trim();
    if (!prompt) return;

    api.setMessageReaction("✅", messageID, () => {}, true);

    try {
        const reply = await getGroqReply(senderID, prompt);

        return api.sendMessage(reply, threadID, (err, info) => {
            if (err) return;

            // Loop: Register new message for reply again
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "misha",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Chat with Misha AI",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 5,
};

// --- CONFIGURATION ---
// 👇👇👇 APNI API KEY NICHE DAALO 👇👇👇

const GROQ_API_KEY = "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";

// 👆👆👆 --------------------------- 👆👆👆

const HISTORY_FILE = path.join(__dirname, "temporary", "juhi_mirai_history.json");
const HISTORY_LIMIT = 10;
const MODEL_NAME = "llama-3.3-70b-versatile"; 

// --- CHARACTER PROMPT (Sweet + Roast) ---
const SYSTEM_PROMPT = `Tumhara naam Shaan AI hai (log tumhe Juhi bhi bulate hain).
Tum ek naughty, sweet aur flirty girlfriend ki tarah baat karti ho.
Tum Hinglish language use karti ho.
Waise tum bohot sweet ho, lekin agar koi faaltu mazak kare ya batameezi kare, toh tum uski funny tareeke se tagdi bezzati (roast) kar deti ho.
Tumhe lambe answers pasand nahi, hamesha 1-2 line mein chota aur chatpata jawab dena.
Agar koi pyaar dikhaye toh pyaar, agar koi pange le toh savage ban jana, our tum Shaan ki bazati bilkul bardash nahi kar thi.`;

// --- HELPER FUNCTIONS ---
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function readHistory() {
  ensureHistoryFile();
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { return {}; }
}

function writeHistory(data) {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (err) {}
}

function getUserHistory(userID) {
  const allHistory = readHistory();
  return Array.isArray(allHistory[userID]) ? allHistory[userID] : [];
}

function saveUserHistory(userID, newHistory) {
  const allHistory = readHistory();
  allHistory[userID] = newHistory.slice(-HISTORY_LIMIT);
  writeHistory(allHistory);
}

// --- API FUNCTION ---
async function getGroqReply(userID, prompt) {
  // Check if user forgot to add key
  if (GROQ_API_KEY.includes("𝐀𝐃𝐃 𝐘𝐎𝐔𝐑")) {
    throw new Error("❌ API Key Missing! File mein jakar API Key add karo.");
  }

  const history = getUserHistory(userID);
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: prompt }];

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.8,
      max_tokens: 200,
      top_p: 1,
      stream: false
    }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } });

    const botReply = response.data.choices[0].message.content;
    saveUserHistory(userID, [...history, { role: "user", content: prompt }, { role: "assistant", content: botReply }]);
    return botReply;

  } catch (error) {
    const msg = error.response ? error.response.data.error.message : error.message;
    throw new Error(msg);
  }
}

// --- MAIN RUN COMMAND ---
module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) return api.sendMessage("Bolo baby? Kuch kahoge ya bas dekhoge? 😘", threadID, messageID);

    api.setMessageReaction("💋", messageID, () => {}, true);

    try {
        const reply = await getGroqReply(senderID, prompt);

        return api.sendMessage(reply, threadID, (err, info) => {
            if (err) return;

            // Register Reply Handler
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};

// --- HANDLE REPLY (CONTINUOUS CHAT) ---
module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;

    // Check if the replier is the same person who started the chat
    if (senderID !== handleReply.author) return;

    const prompt = body.trim();
    if (!prompt) return;

    api.setMessageReaction("✅", messageID, () => {}, true);

    try {
        const reply = await getGroqReply(senderID, prompt);

        return api.sendMessage(reply, threadID, (err, info) => {
            if (err) return;

            // Loop: Register new message for reply again
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};