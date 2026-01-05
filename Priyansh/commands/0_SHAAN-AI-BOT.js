const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "SHAAN-AI-BOT",
  version: "3.5.0",
  hasPermssion: 0,
  credits: "Shaan", // 🔓 Fully Unlocked for Shaan
  description: "AI Chatbot with Shaan's Branding",
  commandCategory: "ai",
  usages: "bot [text]",
  cooldowns: 2,
  dependencies: { 
    "axios": "",
    "fs-extra": "" 
  }
};

// 📁 SHAAN DATA PATHS
const folderPath = path.join(__dirname, "SHAAN_PROJECT");
if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

const HISTORY_FILE = path.join(folderPath, "shaan_history.json");

// 🧠 MEMORY MANAGEMENT
let historyData = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")) : {};

// 🌸 SHAAN SYSTEM PROMPT (Personality)
const shaanPrompt = `
You are Shaan-AI, a smart and humble bot.
Creator/Owner: Shaan (Sirf Shaan hi mere boss hain).
Always answer in short and sweet Hindi/English.
Mention "Shaan" if someone asks about your creator.
Use 🙂✨🔥
`;

module.exports.run = async ({ api, event }) => {
  return api.sendMessage("Shaan ka AI active hai! Puchiye kya puchna hai? 🙂", event.threadID);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const text = body.trim().toLowerCase();
  
  // Triggers
  const isBot = text === "bot" || text === "bot!" || text.endsWith(" bot");
  const isAi = text.startsWith("bot ");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  // 1. Simple Bot Greeting
  if (isBot && !isAi) {
    return api.sendMessage("Ji, main Shaan ka AI assistant hoon. Boliye? 🙂✨", threadID, messageID);
  }

  // 2. AI Chat Logic
  if (isAi || isReply) {
    const userInput = isAi ? body.slice(4).trim() : body;
    if (!userInput) return;

    if (!historyData[senderID]) historyData[senderID] = [];
    historyData[senderID].push(`User: ${userInput}`);

    const prompt = `${shaanPrompt}\n${historyData[senderID].join("\n")}\nShaan-AI:`;

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      let reply = res.data || "Shaan sir ka server thoda down hai 🙂";

      // Limit length and save history
      reply = reply.split("\n").slice(0, 2).join(" ");
      historyData[senderID].push(`Bot: ${reply}`);
      if (historyData[senderID].length > 6) historyData[senderID].shift();
      
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

      api.sendTypingIndicator(threadID, true);
      setTimeout(() => {
        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, 1000);

    } catch (e) {
      console.error(e);
    }
  }
};
