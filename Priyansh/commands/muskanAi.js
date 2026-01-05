1111const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Shaan AI (Pollinations)', // Fixed single quote error here
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

const systemPrompt =
 "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 3 lines only, no bracket replys.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isMention = body.toLowerCase().includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!isMention && !isReply) return;

  if (!history[senderID]) history[senderID] = [];

  history[senderID].push(`User: ${body}`);
  if (history[senderID].length > 6) history[senderID].shift();

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${chatHistory}\nBot:`;

  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
    const res = await axios.get(url, { timeout: 15000 });

    const reply =
      typeof res.data === "string"
        ? res.data.trim()
        : "Baby mujhe samajh nahi aya 😕";

    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    console.log("Pollinations Error:", err.message);
    api.sendMessage(
      "Baby 😔 server thoda slow ho gaya… thodi der baad try karna ❤️",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
