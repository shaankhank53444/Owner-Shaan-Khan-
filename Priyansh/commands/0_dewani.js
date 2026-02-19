(function () {
  const fs = require('fs');
  const axios = require('axios');

  // --- CONFIGURATION ---
  const GROQ_API_KEY = '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'; // Apni Groq API Key yahan dalein
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  // ---------------------

  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  
  // Logic same rakha hai: 'shaan khan' check karne ke liye
  const allowedCredit = 'shaan khan'; 

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
    credits: 'Shaan Khan', // Apka naam yahan set hai
    description: 'Gemini AI - Cute Girlfriend Style (Groq)',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const history = {};
  // Wahi original prompt (ab plain text mein)
  const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, act as a real girlfriend. Be fun, loving, and a little naughty. keep reply maximum 5 lines only, no bracket replys. Now continue the chat:";

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

    // History Logic same rakhi hai
    history[senderID].push({ role: "user", content: userInput });
    if (history[senderID].length > 5) history[senderID].shift();

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      const response = await axios.post(API_URL, {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history[senderID]
        ],
        temperature: 0.7
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
      console.error('Error:', err);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
