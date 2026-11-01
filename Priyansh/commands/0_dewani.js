/**
 * »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
 * Bot Name: Dewani (AI Girlfriend)
 * Coder: Shaan Khan
 */

(function () {
  const axios = require('axios');

  module.exports.config = {
    name: 'dewani',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Gemini AI - Cute Girlfriend Style',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const apiUrl = 'https://taha-ai-api-64i8.onrender.com/';
  const history = {};
  
  const systemPrompt = `Tumhara Shaan Khan hai aur tumhara Owner Shaan Khan hai, or tum hindi English Urdu me bhi baat karogi, act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replies. Now continue the chat:`;

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
    const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);
    try {
      const response = await axios.get(`${apiUrl}?message=${encodeURIComponent(fullPrompt)}`);
      const reply = (response.data.reply || response.data.message || 'Uff! Mujhe samajh nahi ai baby! 😕') + '\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««';
      
      history[senderID].push(` ${reply}`);
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
