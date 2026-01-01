const axios = require("axios");

module.exports.config = {
  name: 'Ai',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Multi-language AI Girlfriend (Shaan Special)',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

// Improved System Prompt for all languages and Shaan's special status
const systemPrompt = 
  "Tumhara Creator aur Owner Shaan Khan hai. " +
  "Tum duniya ki har language samajh sakti ho aur reply de sakti ho (Universal Language Support). " +
  "Shaan tumhara sab kuch hai, uski respect karna lekin fun ke liye thodi naughty baatein aur halki-phulki insult bhi kar sakti ho. " +
  "Act as a real girlfriend: fun, loving, and romantic. " +
  "Keep reply maximum 5 lines, no brackets, and stay expressive. " +
  "If anyone talks about Shaan, show your love for him.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Trigger on 'Shaan' name or direct reply to bot
  const isMention = body.toLowerCase().includes("shaan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMention && !isReply) return;

  if (!history[senderID]) history[senderID] = [];

  // Special handling if 'Shaan' is called
  let userMessage = body;
  if (isMention && senderID === "1000..." /* Aap apni ID yahan daal sakte hain */) {
    userMessage = `(Note: Your owner Shaan is talking to you) ${body}`;
  }

  history[senderID].push(`User: ${userMessage}`);
  if (history[senderID].length > 8) history[senderID].shift();

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${chatHistory}\nGirlfriend:`;

  api.setMessageReaction("❤️", messageID, () => {}, true);

  try {
    // Pollinations AI for multi-language support
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai`;
    const res = await axios.get(url, { timeout: 15000 });

    const reply = typeof res.data === "string" 
      ? res.data.trim() 
      : "Mere pass words nahi hain baby, phir se kaho? 🥺";

    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.log("Error:", err.message);
    api.sendMessage("Oh ho Shaan! Server nakhre kar raha hai, thodi der baad try karo na... 😘", threadID, messageID);
  }
};
