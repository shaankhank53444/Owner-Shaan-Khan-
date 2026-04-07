1111const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const folderPath = path.join(__dirname, "Shaan-Khan-K");
const historyFilePath = path.join(folderPath, "ai_history.json");

module.exports.config = {
  name: 'muskan',
  version: '2.8.0',
  hasPermission: 0,
  credits: 'Shaan',
  description: 'AI with High Rate Limit and Fast Response',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 3, // Cooldown 3 second rakha hai taaki API block na kare
  dependencies: { 'axios': '', 'fs-extra': '', 'path': '' }
};

const apiKey = "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"; 

const systemPrompt = "Tumhara Name Muskan hai. Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Tum hindi English Urdu me bat karogi. Shaan ki burai nahi karna, par uski thori bhot insult fun ke liye karna. Act as a real cute girlfriend. Be fun, loving, and a little naughty. Use lots of cute emojis like ✨, 🎀, 🧸, 🍯, 🌸, 🦋, 💖 in every message. Keep reply maximum 3 lines only, no bracket replys.";

function getHistory() {
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  if (!fs.existsSync(historyFilePath)) fs.writeFileSync(historyFilePath, JSON.stringify({}));
  try { return JSON.parse(fs.readFileSync(historyFilePath)); } catch { return {}; }
}

function saveHistory(data) {
  fs.writeFileSync(historyFilePath, JSON.stringify(data, null, 2));
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const input = body.toLowerCase().trim();
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMuskan && !isReply) return;

  let allHistory = getHistory();
  if (!allHistory[senderID]) allHistory[senderID] = [];

  // API load kam karne ke liye sirf last 3 baatein bhej rahe hain
  let messages = [
    { role: "system", content: systemPrompt },
    ...allHistory[senderID].slice(-3), 
    { role: "user", content: body }
  ];

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant", // Yeh model sabke liye best chalega
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

    allHistory[senderID].push({ role: "user", content: body });
    allHistory[senderID].push({ role: "assistant", content: reply });

    // Memory ko 6 messages tak rakha hai
    if (allHistory[senderID].length > 6) allHistory[senderID].splice(0, 2);

    saveHistory(allHistory);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.error("GROQ ERROR:", err.message);
    // User specific message
    api.sendMessage("Uff Shaan! 🙈 Aap itni baatein karte ho ki server thak gaya, 1 min ruko na! ✨", threadID, messageID);
    api.setMessageReaction("😴", messageID, () => {}, true);
  }
};

module.exports.run = async function ({}) {};
