(function () {
  const fs = require('fs');
  const axios = require('axios');

  module.exports.config = {
    name: 'dewani',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Gemini AI - Response Trimming Fixed',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const history = {};
  const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Uzair Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, shan ki thori bhot insult karna fun ke Liye act as a real girlfriend. Be fun, loving, and a little naughty.keep reply maximum 5 lines only, no bracket replys.Now continue the chat:";

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
      // Pollinations AI API
      const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;
      const response = await axios.get(apiUrl);
      
      let reply = response.data || 'Uff! Mujhe samajh nahi ai baby! 😕';

      // --- RESPONSE SHORT KARNE KA LOGIC ---
      // Agar AI ka message 180 characters se lamba hoga, toh ye usay cut kar dega
      if (reply.length > 180) {
          reply = reply.substring(0, 180) + "...";
      }
      // -------------------------------------

      history[senderID].push(`Bot: ${reply}`);
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
