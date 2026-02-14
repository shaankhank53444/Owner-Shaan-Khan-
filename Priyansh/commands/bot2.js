const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 📂 Path to History File
const historyPath = path.join(__dirname, "Shaan-Khan-K", "ai_history.json");

// Ensure folder and file exist
if (!fs.existsSync(path.join(__dirname, "Shaan-Khan-K"))) {
  fs.mkdirSync(path.join(__dirname, "Shaan-Khan-K"));
}
if (!fs.existsSync(historyPath)) {
  fs.writeFileSync(historyPath, JSON.stringify({}));
}

// 🔒 HARD-LOCK CREDITS PROTECTION 🔒
function protectCredits(config) {
  if (config.credits !== "SHAAN-KHAN") {
    console.log("\n🚫 Credits change detected! Restoring original credits…\n");
    config.credits = "SHAAN-KHAN";
    throw new Error("❌ Credits are LOCKED by SHAAN-KHAN 🔥 File execution stopped!");
  }
}

module.exports.config = {
  name: "SHAAN-AI",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Shaan Khan AI with Persistent JSON History",
  commandCategory: "ai",
  usages: "Mention or reply",
  cooldowns: 2,
  dependencies: {
    axios: "",
    "fs-extra": ""
  }
};

protectCredits(module.exports.config);

const OPENROUTER_API_KEY = "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";

const systemPrompt = `
You are Shaan Khan AI 🙂❤️😌
Creator & Owner: Shaan Khan 💞
Language: English or Roman Urdu only. No Hindi script.
Vibe: Romantic boyfriend, 1-2 short lines, mandatory emojis.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isTrigger =
    body.toLowerCase().includes("ai") ||
    (messageReply && messageReply.senderID === api.getCurrentUserID());

  if (!isTrigger) return;

  // 📖 Load History from JSON
  let history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));

  if (!history[senderID]) history[senderID] = [];
  history[senderID].push({ role: "user", content: body });

  // Keep last 10 messages for better memory
  if (history[senderID].length > 10) history[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...history[senderID]
        ],
        max_tokens: 100,
        temperature: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data?.choices?.[0]?.message?.content || "Main hamesha tumhare saath hoon 🙂❤️😌";

    // Save AI response to history
    history[senderID].push({ role: "assistant", content: reply });
    
    // 💾 Write updated history back to JSON file
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💖", messageID, () => {}, true);

  } catch (err) {
    console.error(err);
    api.sendMessage("Thoda masla ho gaya hai, Shaan Khan se kaho fixed kare 🙂❤️😌", threadID, messageID);
  }
};
