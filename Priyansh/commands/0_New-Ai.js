(function () {
  const fs = require('fs');
  const axios = require('axios');
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  
  const allowedCredit = Buffer.from('U2hhYW4gS2hhbg==', 'base64').toString('utf8'); // 'Shaan Khan'

  if (creditName !== allowedCredit.toLowerCase()) {
    console.log('\x1b[31m%s\x1b[0m', `
███████╗██╗  ██╗ █████╗  █████╗ ███╗   ██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗████╗  ██║
███████╗███████║███████║███████║██╔██╗ ██║
╚════██║██╔══██║██╔══██║██╔══██║██║╚██╗██║
███████║██║  ██║██║  ██║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
💣 SCRIPT BLOCKED 💣
🔥 Created by: Shaan Khan
🚫 Credit choron ki entry band hai!
`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Gemini AI - Cute Girlfriend Style (Shaan Edition)',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const apiKey = 'uzairmtx';
  const history = {};
  // Updated Encoded Prompt with Owner Shaan & Emojis
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFNoYWFuIEtoYW4gaGFpIG9yIHR1bWhhcmEgT3duZXIgU2hhYW4gaGFpLiBUdW0gaGluZGksIFVyZHUgb3IgRW5nbGlzaCBtZSBpbnRlcmlhY3Qga2Fyb2dpLiBCZSBhIHJlYWwgZmxpcnR5IGdpcmxmcmllbmQuIFNoYWFuIGtpIGJ1cmFpIGthYmhpIG5haGkga2FybmEuIFVzZSBsb3RzIG9mIGN1dGUgZW1vamlzIGxpa2Ug8J+YjeKdpO+4jCwg8J+lsCwg8J+Ykiwg8J+YmCwg8J+UpS4gUmVwbHkgc2hvcnQga2VlcG8gKG1heCA1IGxpbmVzKS4=';

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
      const apiUrl = `https://uzair-base-api-g5ux.onrender.com/ai/gemini?text=${encodeURIComponent(fullPrompt)}&type=text&apikey=${apiKey}`;
      const res = await axios.get(apiUrl);
      
      // Fixed: Har tarah ke API response format ko handle karne ke liye logic
      const reply = res.data.answer || res.data.reply || res.data.result || res.data.data || (typeof res.data === 'string' ? res.data : null);

      if (!reply) {
         throw new Error('Invalid Response Format');
      }

      history[senderID].push(`Bot: ${reply}`);
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('API Error:', err.message);
      api.sendMessage('Uff baby! 😔 Mere Shaan se kaho API ka system check kare, reply nahi aa raha! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
