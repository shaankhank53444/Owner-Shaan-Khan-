(function () {
  const fs = require('fs');
  const axios = require('axios');

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
    version: '6.5.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Multi-Language Fast Edition',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = {};

  // SYSTEM PROMPT: ALL LANGUAGES + PROTECTION + FUN
  const systemPrompt = "Tum 'dewani' ho. Owner 'Shaan' hai. Tum duniya ki HAR language (Hindi, Urdu, English, Bangla, Nepali, etc.) samajhti ho. Agar user kisi bhi language mein bole, tum use samajh kar Hinglish mein 2-3 line ka short reply do. Shaan ki thodi insult karo fun ke liye, par agar koi aur Shaan ko bura bole toh usey sakhti se roast karo. Be naughty and protective.";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    
    const lastHistory = history[senderID].slice(-3).join('\n');
    const fullPrompt = `${systemPrompt}\n\nChat:\n${lastHistory}\nUser: ${body}\ndewani:`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Direct Text API Call for Stability
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&cache=true`);
      
      let botReply = res.data;
      if (typeof botReply !== 'string') botReply = JSON.stringify(botReply);

      // Clean prefix and limit lines
      botReply = botReply.replace(/User:|dewani:|bot:|ai:|assistant:/gi, "").trim();
      const finalReply = botReply.split('\n').slice(0, 3).join('\n');

      history[senderID].push(`User: ${body}`);
      history[senderID].push(`dewani: ${finalReply}`);
      if (history[senderID].length > 6) history[senderID].shift();

      api.sendMessage(finalReply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      console.error('Error:', err.message);
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage('Shaan baby! 😔 thoda network masla hai, dobara try karo na please! 💋', threadID, messageID);
    }
  };
})();
