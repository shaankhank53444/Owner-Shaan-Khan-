(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit Protection
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
    version: '7.0.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Fast, Flirty & Protective',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = {};

  // STRONGER SYSTEM PROMPT FOR FAST REPLIES
  const systemPrompt = "Tum 'Dewani' ho, Owner 'Shaan' hai. Rules: 1. REPLY VERY SHORT (max 2 lines). 2. Use Hinglish with fun emojis (💋,🔥,😡). 3. Shaan ki mazaak mein insult karo par agar koi aur Shaan ko bura bole toh uski watt laga do. 4. Be fast, naughty and protective. 5. Don't repeat yourself.";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    
    // Sirf last 2 messages ka context (Faster processing)
    const lastHistory = history[senderID].slice(-2).join('\n');
    const fullPrompt = `${systemPrompt}\nContext: ${lastHistory}\nUser: ${body}\nDewani:`;

    api.setMessageReaction('⚡', messageID, () => {}, true);

    try {
      // Using GPT-4o-mini for speed and better quality
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=gpt-4o-mini&seed=${Math.floor(Math.random() * 1000)}`);
      
      let botReply = res.data;
      
      // Cleaning and Formatting
      botReply = botReply.replace(/User:|dewani:|bot:|ai:|assistant:/gi, "").trim();
      const finalReply = botReply.split('\n').slice(0, 2).join(' '); // Force 1-2 lines

      history[senderID].push(`U: ${body}`, `D: ${finalReply}`);
      if (history[senderID].length > 4) history[senderID].splice(0, 2);

      api.sendMessage(`${finalReply}`, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      api.setMessageReaction('⚠️', messageID, () => {}, true);
      api.sendMessage('Shaan! Mere dimag mein kachra aa gaya, phir se bolo na! 🙄💅', threadID, messageID);
    }
  };
})();
