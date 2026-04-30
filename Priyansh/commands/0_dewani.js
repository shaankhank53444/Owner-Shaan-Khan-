(function () {
  const fs = require('fs');
  const axios = require('axios');

  // --- CONFIGURATION ---
  // Updated to new API URL
  const API_BASE_URL = 'https://uzairrajputapis.qzz.io/api/ai/gemini';
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFNoYWFuIEtoYW4gaGFpIG9yIHR1bWhhcmEgT3duZXIgU2hhYW4gaGFpLCBvciB0dW0gaGluZGkgRW5nbGlzaCBVcmR1IG1lIGJoaSBiYXQga2Fyb2dpLCBvciBTaGFhbiBraSBidXJhaSBuYWhpIGthcm5hIG9yIG5hIGtpc2kgYyBzdW5uYSwgYWN0IGFzIGEgcmVhbCBnaXJsZnJpZW5kLiBCZSBmdW4sIGxvdmluZywgYW5kIGEgbGl0dGxlIG5hdWdodHkua2VlcCByZXBseSBtYXhpbXVtIDUgbGluZXMgb25seSwgbm8gYnJhY2tldCByZXBseXMuTm93IGNvbnRpbnVlIHRoZSBjaGF0Og==';
  // ---------------------

  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = Buffer.from('c2hhYW4ga2hhbg==', 'base64').toString('utf8'); 

  if (creditName !== allowedCredit) {
    console.log('\x1b[31m%s\x1b[0m', `
██╗░░░██╗███████╗░█████╗░██╗██████╗░
██║░░░██║╚════██║██╔══██╗██║██╔══██╗
██║░░░██║░░███╔═╝███████║██║██████╔╝
██║░░░██║██╔══╝░░██╔══██║██║██╔══██╗
╚██████╔╝███████╗██║░░██║██║██║░░██║
░╚═════╝░╚══════╝╚═╝░░╚═╝╚═╝╚═╝░░╚═╝
💣 SCRIPT BLOCKED 💣
🔥 Created by: Shaan Khan
🚫 Credit choron ki entry band hai!
`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '1.4.0', // Updated version
    hasPermssion: 0,
    credits: 'shaan khan',
    description: 'Gemini AI via Uzair Rajput New API - Cute Girl Style',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMentioningDewani && !isReplyToBot) return;

    const systemPrompt = Buffer.from(encodedPrompt, 'base64').toString('utf8');
    const fullQuery = `${systemPrompt}\n\nUser: ${body}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      const res = await axios.get(API_BASE_URL, {
        params: { q: fullQuery }
      });

      // API response structure handle karna (Added "res.data.data" for more compatibility)
      const reply = res.data.answer || res.data.response || res.data.result || res.data.data || 'Uff! Mujhe samajh nahi ai baby! 😕';

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('API Error:', err.message);
      api.sendMessage('Oops baby! 😔 Network ka issue hai shayad… Shaan se kaho API check kare! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
