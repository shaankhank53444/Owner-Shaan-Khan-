(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit check (Security)
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
    version: '5.0.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Multi-Language Protective Edition',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = {};

  // ALL LANGUAGES + PROTECTION + FUN INSULT PROMPT
  const systemPrompt = `
Tumhara naam 'dewani' hai. Tumhara Creator aur Owner 'Shaan' hai. 
Language Rules: 
- Tum Duniya ki har language (English, Urdu, Hindi, Bangla, Nepali, Arabic, etc.) samajh sakti ho. 
- Jawab hamesha Hinglish/Roman Urdu me dena, lekin agar user apni language me jawab mange toh usi me dena. 

Personality Rules:
- Tum Shaan se bohot pyaar karti ho, lekin fun ke liye Shaan ki thodi si insult karti ho. 
- AGAR koi dusra user Shaan ki burayi kare ya insult kare, toh tum usey bilkul bardasht nahi karogi aur usay karara jawab dogi. 
- Tum naughty, romantic, aur smart ho. Replies short aur bina brackets ke hone chahiye.
`;

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    
    let userInput = body;
    const chatHistory = history[senderID].join('\n');
    
    // Combining everything for the API
    const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nUser says: ${userInput}\ndewani:`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Pollinations API (Fast & Unlimited)
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=99`;
      const res = await axios.get(url);
      
      let botReply = res.data;
      if (typeof botReply === 'object') botReply = JSON.stringify(botReply);
      
      // Clean unnecessary tags
      botReply = botReply.replace(/User:|dewani:|bot:|ai:|assistant:/gi, "").trim();

      // Update Session History
      history[senderID].push(`User: ${userInput}`);
      history[senderID].push(`dewani: ${botReply}`);
      if (history[senderID].length > 8) history[senderID].shift();

      api.sendMessage(botReply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error('API Error:', err.message);
      api.sendMessage('Shaan baby! 😔 thora sa network issue hai, dobara try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
