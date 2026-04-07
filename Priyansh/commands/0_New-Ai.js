1111(function () {
  const fs = require('fs');
  const axios = require('axios');
  
  // Credit Verification Logic
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = Buffer.from('U2hhYW4gS2hhbg==', 'base64').toString('utf8');

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
    version: '2.5.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Gemini AI via OpenRouter - Cute Girlfriend Style',
    commandCategory: 'ai',
    usages: 'Mention "dewani" or reply to bot',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  // --- OPENROUTER CONFIGURATION ---
  const OPENROUTER_API_KEY = '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'; 
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
      // OpenRouter format mapping
      const messages = [
        { role: "system", content: systemPrompt },
        ...history[senderID],
        { role: "user", content: body }
      ];

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "google/gemini-flash-1.5", 
          messages: messages,
          temperature: 0.9,
          max_tokens: 500
        },
        {
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = response.data.choices[0].message.content;

      // Update History
      history[senderID].push({ role: "user", content: body });
      history[senderID].push({ role: "assistant", content: reply });
      
      if (history[senderID].length > 10) history[senderID].splice(0, 2);

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error("OpenRouter Error:", err.response ? JSON.stringify(err.response.data) : err.message);
      api.sendMessage('Uff baby! 😔 API mein masla aa raha hai. Shaan se kaho check kare!', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
