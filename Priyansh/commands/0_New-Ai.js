(function () {
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
    version: '2.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Gemini AI - Cute Girlfriend Style (Shaan Edition)',
    commandCategory: 'ai',
    usages: 'Mention "dewani" or reply to bot',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  // --- GEMINI CONFIGURATION ---
  const GEMINI_API_KEY = 'AIzaSyDmOvjyrnUn8ZOyWauSjOXbG3iM_aMj08A'; 
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
            ...history[senderID],
            { role: "user", parts: [{ text: body }] }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        }
      );

      const reply = response.data.candidates[0].content.parts[0].text;

      // History Update
      history[senderID].push({ role: "user", parts: [{ text: body }] });
      history[senderID].push({ role: "model", parts: [{ text: reply }] });
      
      if (history[senderID].length > 10) history[senderID].splice(0, 2);

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error("Gemini Error:", err.response ? JSON.stringify(err.response.data) : err.message);
      api.sendMessage('Uff baby! 😔 Mere Shaan se kaho API key expire ho gayi shayad! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
