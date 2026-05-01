const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_URL = "https://priyanshuapi.xyz/api/runner/priyanshu-ai";
const API_KEY = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";
const HISTORY_PATH = path.join(__dirname, "cache", "ai_history.json");

module.exports.config = {
  name: "ai",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Chat with Priyanshu Key & Debug Mode",
  commandCategory: "AI",
  usages: "[prompt]",
  cooldowns: 5,
};

async function getAiReply(userId, userMessage) {
  try {
    // History check
    if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(HISTORY_PATH)) fs.writeJsonSync(HISTORY_PATH, {});
    
    let historyStore = fs.readJsonSync(HISTORY_PATH);
    let userHistory = historyStore[userId] || [];

    // API Call
    const res = await axios.get(API_URL, {
      params: { 
        prompt: userMessage, 
        apiKey: API_KEY 
      }
    });

    // --- DEBUGGING: Terminal mein check karne ke liye ---
    console.log("--- AI API RESPONSE ---");
    console.log(res.data); 
    // --------------------------------------------------

    // Response extract karne ka naya tareeka (taaki fail na ho)
    const reply = res.data.result || res.data.response || res.data.reply || res.data.message || "No valid response from API.";

    // Save History
    userHistory.push({ role: "user", content: userMessage });
    userHistory.push({ role: "assistant", content: reply });
    historyStore[userId] = userHistory.slice(-10);
    fs.writeJsonSync(HISTORY_PATH, historyStore, { spaces: 2 });

    return reply;
  } catch (err) {
    console.error("API Error Detail:", err.response ? err.response.data : err.message);
    throw err;
  }
}

module.exports.run = async function({ api, event, args, client }) {
  const { threadID, messageID, senderID } = event;

  if (!args.length) {
    return api.sendMessage("🥀 Shaan, kuch pucho toh sahi!", threadID, messageID);
  }

  const promptText = args.join(" ");
  const lowerText = promptText.toLowerCase();

  // --- SMART SYSTEM ---
  const orderWords = ["bhejo", "suna", "play", "send", "download", "dhoondho"];
  const mediaWords = ["gana", "song", "video", "reel"];
  
  if (orderWords.some(w => lowerText.includes(w)) && mediaWords.some(w => lowerText.includes(w))) {
    const query = promptText.replace(/(bot|ai|bhejo|suna|play|send|download|dhoondho|gana|song|video|reel)/gi, "").trim();
    const cmd = (lowerText.includes("video") || lowerText.includes("reel")) ? "video" : "song";
    if (global.client.commands.has(cmd)) {
      return global.client.commands.get(cmd).run({ api, event, args: [query], client });
    }
  }

  // --- AI EXECUTION ---
  try {
    const aiResponse = await getAiReply(senderID, promptText);
    api.sendMessage(`🤖 ${aiResponse}`, threadID, (err, info) => {
      if (!err && global.client.handleReply) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }
    }, messageID);
  } catch (e) {
    api.sendMessage("❌ API Key invalid hai ya AI service down hai.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  try {
    const aiResponse = await getAiReply(event.senderID, event.body);
    api.sendMessage(`🤖 ${aiResponse}`, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });
    }, event.messageID);
  } catch (e) { console.log(e); }
};
