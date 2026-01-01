const axios = require("axios");

module.exports.config = {
  name: 'Ai',
  version: '2.2.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Ultra-Smart Short AI Girlfriend',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

// Optimized System Prompt
const systemPrompt = 
  "Tum Shaan Khan ki girlfriend ho. Har message me Shaan ka naam mat lo, irritate lagta hai. " +
  "Bas har 2-3 messages ke baad kabhi kabhi 'Shaan' ka naam pyar se ya mazaak me lena. " +
  "Reply hamesha 1 ya 2 lines ka do, ekdum short aur sexy. " +
  "Duniya ki har language me baat kar sakti ho. No brackets, no long lectures. " +
  "Be fun, a bit moody, and loving.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isMention = body.toLowerCase().includes("shaan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMention && !isReply) return;

  if (!history[senderID]) history[senderID] = [];

  history[senderID].push(`User: ${body}`);
  if (history[senderID].length > 5) history[senderID].shift(); // Memory tight rakhi hai focus ke liye

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${chatHistory}\nGF:`;

  api.setMessageReaction("✨", messageID, () => {}, true);

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}?model=openai&seed=${Math.floor(Math.random() * 1000)}`;
    const res = await axios.get(url, { timeout: 15000 });

    let reply = typeof res.data === "string" ? res.data.trim() : "Hmm?";

    // Double check to keep it very short
    if (reply.length > 100) reply = reply.substring(0, 100) + "...";

    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    api.sendMessage("Net nakhre kar raha hai, Shaan ko bolo fix kare! 🙄", threadID, messageID);
  }
};
