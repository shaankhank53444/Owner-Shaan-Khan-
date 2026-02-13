const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "misha",
    version: "3.0.0",
    hasPermission: 0, // FIXED: Pehle 'hasPermssion' tha
    credits: "Shaan Khan",
    description: "Chat with Misha AI",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 5,
};

// --- CONFIGURATION ---
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile"; 

// Aapka manga hua path 👇
const HISTORY_FILE = path.join(__dirname, "Shaan-Khan-K", "juhi_mirai_history.json");

const SYSTEM_PROMPT = `Tumhara naam Shaan AI hai (log tumhe tumhara coretor our owner Shaan Khan Hai). 
Tum ek naughty, sweet aur flirty girlfriend ki tarah baat karti ho. 
Tum Hinglish use karti ho aur hamesha 1-2 line mein chota aur chatpata jawab deti ho.`;

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

async function getGroqReply(userID, prompt) {
  const allHistory = readHistory();
  const history = Array.isArray(allHistory[userID]) ? allHistory[userID] : [];
  
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: prompt }];

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.8,
      max_tokens: 250
    }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } });

    const botReply = response.data.choices[0].message.content;
    
    // Save history
    history.push({ role: "user", content: prompt }, { role: "assistant", content: botReply });
    allHistory[userID] = history.slice(-10);
    writeHistory(allHistory);
    
    return botReply;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
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

// --- HANDLE REPLY ---
module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    try {
        const reply = await getGroqReply(senderID, body);
        return api.sendMessage(reply, threadID, (err, info) => {
            if (err) return;
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
