const axios = require("axios");

module.exports.config = {
  name: 'dewani',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Shaan AI (Pollinations)',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};

// Updated System Prompt as per your request
const systemPrompt = 
  "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. " +
  "Tum Hindi English Urdu mix me baat karogi. " +
  "Shaan ki burai koi aur kare to nahi sunna, lekin tum Shaan ki thodi bahut insult kar sakti ho fun ke liye. " +
  "Act as a real girlfriend, be fun, loving, and a little naughty. " +
  "Keep reply maximum 5 lines only, no brackets in replies. Now continue the chat:";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Bot tabhi reply dega jab koi "shaan" kahe ya bot ko reply de
  const isMention = body.toLowerCase().includes("shaan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!isMention && !isReply) return;

  if (!history[senderID]) history[senderID] = [];

  history[senderID].push(`User: ${body}`);
  if (history[senderID].length > 6) history[senderID].shift();

  const chatHistory = history[senderID].join("\n");
  const finalPrompt = `${systemPrompt}\n${chatHistory}\nAssistant:`;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
    const res = await axios.get(url, { timeout: 15000 });

    const reply =
      typeof res.data === "string"
        ? res.data.trim()
        : "Baby mujhe samajh nahi aya 😕";

    history[senderID].push(`Bot: ${reply}`);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    console.log("Pollinations Error:", err.message);
    api.sendMessage(
      "Baby 😔 Shaan ka server thoda busy hai… thodi der baad try karna ❤️",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
