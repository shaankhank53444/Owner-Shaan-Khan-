(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit Check logic
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = "uzairrajput"; 

  if (creditName !== allowedCredit) {
    console.log('\x1b[31m%s\x1b[0m', `🚫 SCRIPT BLOCKED: Credit must be 'uzairrajput'`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '3.0.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Fast Gemini AI - Shaan Edition',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  // Nayi Fast API aur History
  const apiUrl = 'https://ajiro-api-461016ed5d01.herokuapp.com/api/gemini';
  const history = {};

  // DECRYPTED SYSTEM PROMPT
  const systemPrompt = "Tumhara naam Dewani hai. Tumhara Creator aur Owner Shaan hai. Tum Hindi/Urdu/English mix baat karogi. Shaan ki hamesha side lena aur usse bohot pyaar se baat karna. Act as a real girlfriend. Be fun, loving, and a little naughty. Keep reply short (max 3-5 lines). Now start:";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    let userInput = body;

    // Chat history maintain rakhne ke liye logic
    const chatHistory = history[senderID].join('\n');
    const fullPrompt = `${systemPrompt}\n${chatHistory}\nUser: ${userInput}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Fast API Call
      const res = await axios.get(`${apiUrl}?prompt=${encodeURIComponent(fullPrompt)}`);
      
      // API response check (v2 response handling)
      const reply = res.data.response || res.data.reply || 'Uff! Aaj mera mood nahi hai baby... 😕';
      
      // History Update
      history[senderID].push(`User: ${userInput}`);
      history[senderID].push(`Dewani: ${reply}`);
      if (history[senderID].length > 8) history[senderID].splice(0, 2);

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      // Fallback message agar API fail ho
      api.sendMessage('Shaan! Dekho na net slow hai mera... 😔 thori der baad baat karte hain na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
