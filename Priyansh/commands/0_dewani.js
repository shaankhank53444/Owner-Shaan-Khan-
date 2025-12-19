const axios = require('axios');

module.exports.config = {
  name: 'dewani',
  version: '1.2.0',
  hasPermssion: 0,
  credits: 'shaan Khan', // Old Uzair MTX replaced
  description: 'Gemini AI - Cute Girlfriend Style',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: {
    'axios': ''
  }
};

const apiUrl = 'https://shaan-9ous.onrender.com/chat';
const history = {};

// Base64 prompt simplified and updated creator to Shaan Khan
const encodedPrompt = Buffer.from(
  'Tumhara Creator Shaan Khan Hai, AI ya cute girlfriend style bot. Be fun aur loving replies do, max 5 lines reply karo.'
).toString('base64');

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!isMentioningDewani && !isReplyToBot) return;

  let userInput = body;
  if (!history[senderID]) history[senderID] = [];
  if (isReplyToBot) userInput = messageReply.body + '\nUser: ' + userInput;

  history[senderID].push(`User: ${userInput}`);
  if (history[senderID].length > 5) history[senderID].shift();

  const chatHistory = history[senderID].join('\n');
  const systemPrompt = Buffer.from(encodedPrompt, 'base64').toString('utf8');
  const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

  api.setMessageReaction('⌛', messageID, () => {}, true);
  try {
    const response = await axios.get(`${apiUrl}?message=${encodeURIComponent(fullPrompt)}`);
    const reply = response.data.reply || 'Uff! Mujhe samajh nahi aaya baby! 😕';
    history[senderID].push(`${reply}`);
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction('✅', messageID, () => {}, true);
  } catch (err) {
    console.error('Error:', err);
    api.sendMessage('Oops baby! 😔 thodi der baad try karo please! 💋', threadID, messageID);
    api.setMessageReaction('❌', messageID, () => {}, true);
  }
};