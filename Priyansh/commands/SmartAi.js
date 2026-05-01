const axios = require("axios");
const fs = require("fs");
const path = require("path");

// --- Configurations ---
const HISTORY_FILE = path.join(__dirname, "cache", "ai_history.json");
const HISTORY_LIMIT = 10;
const API_URL = "https://priyanshuapi.xyz/api/runner/priyanshu-ai";
const API_KEY = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";
const DEFAULT_PERSONA = "Shaan AI";

module.exports.config = {
  name: "ai",
  version: "2.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI with History, Smart Intent & Priyanshu XYZ Key",
  commandCategory: "AI",
  usages: "[prompt]",
  cooldowns: 5,
};

// --- Helper Functions for History ---
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, "{}", "utf8");
}

function getHistory(userId) {
  ensureHistoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(data[userId]) ? data[userId] : [];
  } catch (e) { return []; }
}

function saveHistory(userId, history) {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    data[userId] = history.slice(-HISTORY_LIMIT);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) { console.error("History Save Error:", e); }
}

// --- API Execution ---
async function getAiReply(userId, userMessage) {
  const history = getHistory(userId);
  
  try {
    const res = await axios.get(API_URL, {
      params: {
        prompt: userMessage,
        apiKey: API_KEY
      }
    });

    // API response structure handle karein
    const reply = res.data.result || res.data.response || res.data.reply || "No response from AI.";

    // History Update
    const updatedHistory = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: reply }
    ];
    saveHistory(userId, updatedHistory);

    return reply;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
}

module.exports.run = async function({ api, event, args, client }) {
  const { threadID, messageID, senderID } = event;

  if (!args.length) {
    const info = await api.getUserInfo(senderID);
    const userName = info[senderID].name || "User";
    return api.sendMessage(`🥀 ${userName}😗, Kuch toh pucho!`, threadID, messageID);
  }

  const promptText = args.join(" ").trim();
  const lowerText = promptText.toLowerCase();

  // --- SMART MEDIA INTENT ---
  const orderWords = ["bhejo", "suna", "play", "send", "download", "dhoondho", "chahiye"];
  const mediaWords = ["gana", "song", "video", "reel", "music"];
  
  const hasOrder = orderWords.some(w => lowerText.includes(w));
  const hasMedia = mediaWords.some(w => lowerText.includes(w));

  if (hasOrder && hasMedia) {
    const query = promptText.replace(/(bot|ai|bhejo|suna|play|send|download|dhoondho|chahiye|gana|song|video|reel|music)/gi, "").trim();
    if (query.length > 1) {
      const cmd = (lowerText.includes("video") || lowerText.includes("reel")) ? "video" : "song";
      const command = global.client.commands.get(cmd);
      if (command) {
        return command.run({ api, event, args: [query], client });
      }
    }
  }

  // --- REGULAR AI RESPONSE ---
  try {
    const aiResponse = await getAiReply(senderID, promptText);
    return api.sendMessage(`🤖 ${aiResponse}`, threadID, (err, info) => {
      if (global.client.handleReply) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }
    }, messageID);
  } catch (e) {
    return api.sendMessage("❌ API Key Error ya server problem. Baad mein try karein.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== handleReply.author) return;

  try {
    const aiResponse = await getAiReply(senderID, body);
    return api.sendMessage(`🤖 ${aiResponse}`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  } catch (e) {
    console.error("Reply Error:", e);
  }
};
