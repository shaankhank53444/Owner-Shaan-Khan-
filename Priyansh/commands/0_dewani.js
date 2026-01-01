const axios = require("axios");

module.exports.config = {
  name: 'Ai',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Smart Multi-language AI Girlfriend',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

// Updated System Prompt: Short replies & Natural Shaan mentions
const systemPrompt = 
  "Tum Shaan Khan ki girlfriend ho. Har baar Shaan ka naam mat lo, sirf tab lo jab zaroori ho ya tum romantic mood mein ho. " +
  "Har language samajh kar short aur sweet reply do. " +
  "Reply hamesha 2-3 lines ka hona chahiye, boring lambe messages mat karo. " +
  "Be fun, natural, and slightly naughty. No brackets in replies.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Bot tab trigger hoga jab "shaan" likha ho ya bot ko reply diya jaye
  const isMention = body.toLowerCase().includes("shaan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMention && !isReply) return;

  if (!history[senderID]) history[senderID] = [];

  history[senderID].push(`User: ${body}`);
  if (history[senderID].length > 6) history[senderID].shift();

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${chatHistory}\nGirlfriend:`;

  api.setMessageReaction("✨", messageID, () => {}, true);

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai`;
    const res = await axios.get(url, { timeout: 15000 });

    const reply = typeof res.data === "string" 
      ? res.data.trim() 
      : "Kuch to bolo baby... 😉";

    history[senderID].push(`Bot: ${reply}`);

    // Sending the short reply
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.log("Error:", err.message);
    api.sendMessage("Net slow hai shayad, phir se bolo na... ❤️", threadID, messageID);
  }
};
