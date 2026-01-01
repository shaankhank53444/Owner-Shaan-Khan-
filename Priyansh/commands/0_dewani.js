const axios = require("axios");

module.exports.config = {
  name: 'dewani',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'uzairrajput', // Credit updated
  description: 'Dewani AI - Pollinations Engine',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

// System Prompt for personality
const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 3 lines only, no bracket replys.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Trigger words
  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMentioningDewani && !isReplyToBot) return;

  if (!history[senderID]) history[senderID] = [];

  // History Manage karna
  let userInput = body;
  history[senderID].push(`User: ${userInput}`);
  if (history[senderID].length > 6) history[senderID].shift();

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nDewani:`;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    // Pollinations AI API Call
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai&system=${encodeURIComponent(systemPrompt)}`;
    const res = await axios.get(url, { timeout: 15000 });

    const reply = typeof res.data === "string" 
      ? res.data.trim() 
      : "Uff! Mujhe samajh nahi ai baby! 😕";

    history[senderID].push(`Dewani: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.error("Dewani API Error:", err.message);
    api.sendMessage(
      "Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
