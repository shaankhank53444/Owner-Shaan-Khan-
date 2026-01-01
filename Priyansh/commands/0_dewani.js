(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit check (Same as before)
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = "uzairrajput"; 

  if (creditName !== allowedCredit) {
    console.log('\x1b[31m%s\x1b[0m', `🚫 SCRIPT BLOCKED: Credit bypass detected!`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '4.0.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Pollinations Fast API Edition',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = {};

  // DECRYPTED SYSTEM PROMPT (Pollinations Style)
  const systemPrompt = "Tum ek naughty, romantic, confident ladki ho—jiska naam 'dewani' hai. Tumhara Creator aur Owner 'Shaan' hai. Tum sirf Hinglish (Roman Urdu/Hindi) me reply karti ho emoji ke saath. Tum sabse 'aap' bol kar baat karti ho. Har message ka reply sirf 1-2 line me dena. Be a little naughty, smart, and loving. No brackets, no over explanation.";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    // Trigger check
    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    // History management
    if (!history[senderID]) history[senderID] = [];
    
    let userInput = body;
    const chatHistory = history[senderID].join('\n');
    
    // Combining System Prompt + History + Current Message
    const fullPrompt = `${systemPrompt}\n\nRecent Chat:\n${chatHistory}\nUser: ${userInput}\ndewani:`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // API from the 'affu' file (Pollinations)
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=42`;
      const res = await axios.get(url);
      
      let botReply = res.data;
      if (typeof botReply === 'object') botReply = JSON.stringify(botReply);
      
      // Cleaning the reply
      botReply = botReply.replace(/User:|dewani:|bot:|ai:/gi, "").trim();

      // Update History
      history[senderID].push(`User: ${userInput}`);
      history[senderID].push(`dewani: ${botReply}`);
      if (history[senderID].length > 6) history[senderID].shift();

      api.sendMessage(botReply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error('API Error:', err.message);
      api.sendMessage('Shaan baby! 😔 thora sa network issue hai, dobara try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
