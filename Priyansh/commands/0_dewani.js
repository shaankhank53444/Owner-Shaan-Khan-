(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit check logic
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
    version: '5.5.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Fast, Short & Protective',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = {};

  // OPTIMIZED SHORT REPLY PROMPT
  const systemPrompt = `
Tumhara naam 'dewani' hai aur Owner 'Shaan' hai. 
RULES:
1. STRICTLY Short reply: Sirf 2 se 3 lines me jawab dena hai.
2. Language: Duniya ki har language samjho, lekin jawab Hinglish me do.
3. Personality: Shaan se pyaar karo par mazaq me uski insult karo. Dusra koi Shaan ki burayi kare toh usey roast kar do.
4. Style: Naughty, romantic aur gusse wali (sirf dusron ke liye). No brackets, no long lectures.
`;

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    
    // Fast history processing
    const chatHistory = history[senderID].slice(-4).join('\n'); // Sirf last 4 messages for speed
    const fullPrompt = `${systemPrompt}\nHistory:\n${chatHistory}\nUser: ${body}\ndewani (short reply):`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Fast API request with specific model for speed
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=123&cache=true`;
      const res = await axios.get(url, { timeout: 8000 }); // 8 sec timeout for fast failing/retrying
      
      let botReply = res.data;
      if (typeof botReply === 'object') botReply = JSON.stringify(botReply);
      
      // Remove unwanted prefixes
      botReply = botReply.replace(/User:|dewani:|bot:|ai:|assistant:|short reply:/gi, "").trim();

      // Ensure it's not too long
      const finalReply = botReply.split('\n').slice(0, 3).join('\n');

      history[senderID].push(`User: ${body}`);
      history[senderID].push(`dewani: ${finalReply}`);
      if (history[senderID].length > 6) history[senderID].shift();

      api.sendMessage(finalReply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error('Speed Error:', err.message);
      api.sendMessage('Shaan! Net slow hai mera, thora sabar karo na baby! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
