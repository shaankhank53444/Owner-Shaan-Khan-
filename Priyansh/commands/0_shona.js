const axios = require('axios');
const fs = require('fs');
const path = __dirname + '/shonaStatus.json';

module.exports.config = {
  name: 'shonav2',
  version: '4.0.0',
  hasPermssion: 0,
  credits: 'FaRebii’w Amir ❤️',
  description: 'Romantic AI using external API, remembers users and responds lovingly 💖',
  commandCategory: 'ai',
  usages: '[off]',
  cooldowns: 2
};

function readStatus() {
  try {
    const data = fs.readFileSync(path, 'utf-8');
    return JSON.parse(data).enabled;
  } catch {
    return true;
  }
}

function writeStatus(state) {
  fs.writeFileSync(path, JSON.stringify({ enabled: state }, null, 2));
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const input = args[0];

  if (!input || input.toLowerCase() !== 'off') {
    return api.sendMessage(`❌ Usage: shonav2 off`, threadID, messageID);
  }

  writeStatus(false);
  api.sendMessage(`💔 Shona is now turned off in all groups.`, threadID, messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!readStatus()) return;

  const { body, threadID, messageID, senderID, messageReply } = event;
  const text = (body || '').toLowerCase();
  const triggerByName = text.includes("Janu");
  const triggerByReply = messageReply?.senderID === api.getCurrentUserID();
  if (!triggerByName && !triggerByReply) return;

  api.setMessageReaction("🙈", messageID, () => {}, true);

  try {
    const encodedMessage = encodeURIComponent(body);
    const apiUrl = `https://shona-api.vercel.app/api/amir?message=${encodedMessage}`;
    const res = await axios.get(apiUrl);
    const reply = res.data?.reply || res.data || '💔 Shona confuse ho gaya jaanu... dubara pyar se bolna 😘';

    api.sendMessage(reply, threadID, messageID);
  } catch (err) {
    console.error('❌ API Error:', err.message);
    api.sendMessage("😢 Shona ka server down lag raha hai, baad mein try karo 💋", threadID, messageID);
  }
};