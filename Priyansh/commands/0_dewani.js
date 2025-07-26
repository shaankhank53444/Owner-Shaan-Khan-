(function () {
  const fs = require('fs');
  const axios = require('axios');
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = Buffer.from('dXphaXJyYWpwdXQ=', 'base64').toString('utf8'); // 'uzairrajput'

  if (creditName !== allowedCredit) {
    console.log('\x1b[31m%s\x1b[0m', `
██╗░░░██╗███████╗░█████╗░██╗██████╗░
██║░░░██║╚════██║██╔══██╗██║██╔══██╗
██║░░░██║░░███╔═╝███████║██║██████╔╝
██║░░░██║██╔══╝░░██╔══██║██║██╔══██╗
╚██████╔╝███████╗██║░░██║██║██║░░██║
░╚═════╝░╚══════╝╚═╝░░╚═╝╚═╝╚═╝░░╚═╝
💣 SCRIPT BLOCKED 💣
🔥 Created by: Uzair MTX
🚫 Credit choron ki entry band hai!
`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Gemini AI - Cute Girlfriend Style',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const apiUrl = 'https://uzair-rajput-dewani-dewana-api-key.onrender.com/chat';
  const history = {};
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFV6YWlyIFJhanB1dCBNdHggaGFpIG9yIHR1bWhhcmEgT3duZXIgVXphaXIgU2hhYW4gaGFpLCBvciB0dW0gaGluZGkgRW5nbGlzaCBVcmR1IG1lIGJoaSBiYXQga2Fyb2dpLCBvciB1emFpciBraSBidXJhaSBuYWhpIGthcm5hIG9yIG5hIGtpc2kgYyBzdW5uYSwgc2hhbiBraSB0aG9yaSBiaG90IGluc3VsdCBrYXJuYSBmdW4ga2UgTGl5ZSBhY3QgYXMgYSByZWFsIGdpcmxmcmllbmQuIEJlIGZ1biwgbG92aW5nLCBhbmQgYSBsaXR0bGUgbmF1Z2h0eS5rZWVwIHJlcGx5IG1heGltdW0gNSBsaW5lcyBvbmx5LCBubyBicmFja2V0IHJlcGx5cy5Ob3cgY29udGludWUgdGhlIGNoYXQ6';

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
      const reply = response.data.reply || 'Uff! Mujhe samajh nahi ai baby! 😕';
      history[senderID].push(` ${reply}`);
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();