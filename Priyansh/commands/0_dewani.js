(function () {
  const fs = require('fs');
  const axios = require('axios');

  // --- CONFIGURATION ---
  const GROQ_API_KEY = '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'; // Apni Groq API Key yahan dalein
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFNoYWFuIEtoYW4gaGFpIG9yIHR1bWhhcmEgT3duZXIgU2hhYW4gaGFpLCBvciB0dW0gaGluZGkgRW5nbGlzaCBVcmR1IG1lIGJoaSBiYXQga2Fyb2dpLCBvciBTaGFhbiBraSBidXJhaSBuYWhpIGthcm5hIG9yIG5hIGtpc2kgYyBzdW5uYSwgYWN0IGFzIGEgcmVhbCBnaXJsZnJpZW5kLiBCZSBmdW4sIGxvdmluZywgYW5kIGEgbGl0dGxlIG5hdWdodHkua2VlcCByZXBseSBtYXhpbXVtIDUgbGluZXMgb25seSwgbm8gYnJhY2tldCByZXBseXMuTm93IGNvbnRpbnVlIHRoZSBjaGF0Og==';
  // ---------------------

  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  
  // Base64 logic for 'shaan khan'
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
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'shaan khan',
    description: 'Groq AI - Cute Girlfriend Style',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const history = {};

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

    // Groq logic maintain rakha hai
    history[senderID].push({ role: "user", content: userInput });
    if (history[senderID].length > 5) history[senderID].shift();

    const systemPrompt = Buffer.from(encodedPrompt, 'base64').toString('utf8');
    
    api.setMessageReaction('⌛', messageID, () => {}, true);
    try {
      const response = await axios.post(API_URL, {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history[senderID]
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const reply = response.data.choices[0].message.content || 'Uff! Mujhe samajh nahi ai baby! 😕';
      
      history[senderID].push({ role: "assistant", content: reply });
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err.message);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… Shaan se kaho API check kare! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
