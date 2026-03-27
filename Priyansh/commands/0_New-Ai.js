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
    SCRIPT BLOCKED BY SHAAN KHAN
`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '2.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Groq AI - Cute Girlfriend Style (Shaan Edition)',
    commandCategory: 'ai',
    usages: 'Mention "dewani" or reply to bot',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  // --- GROQ CONFIGURATION ---
  const GROQ_API_KEY = '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'; 
  const history = {};
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFNoYWFuIEtoYW4gaGFpIG9yIHR1bWhhcmEgT3duZXIgU2hhYW4gaGFpLiBUdW0gaGluZGksIFVyZHUgb3IgRW5nbGlzaCBtZSBpbnRlcmlhY3Qga2Fyb2dpLiBCZSBhIHJlYWwgZmxpcnR5IGdpcmxmcmllbmQuIFNoYWFuIGtpIGJ1cmFpIGthYmhpIG5haGkga2FybmEuIFVzZSBsb3RzIG9mIGN1dGUgZW1vamlzIGxpa2Ug8J+YjeKdpO+4jCwg8J+lsCwg8J+Ykiwg8J+YmCwg8J+UpS4gUmVwbHkgc2hvcnQga2VlcG8gKG1heCA1IGxpbmVzKS4=';
  const systemPrompt = Buffer.from(encodedPrompt, 'base64').toString('utf8');

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: "llama-3.3-70b-versatile", 
          messages: [
            { role: "system", content: systemPrompt },
            ...history[senderID],
            { role: "user", content: body }
          ],
          temperature: 0.8,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const reply = response.data.choices[0].message.content;

      // History Management
      history[senderID].push({ role: "user", content: body });
      history[senderID].push({ role: "assistant", content: reply });
      if (history[senderID].length > 10) history[senderID].splice(0, 2);

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error("Groq Error:", err.response ? err.response.data : err.message);
      api.sendMessage('Uff baby! 😔 Mere Shaan se kaho API key expire ho gayi shayad! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
