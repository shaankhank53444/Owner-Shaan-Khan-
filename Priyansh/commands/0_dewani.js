(function () {
  const axios = require('axios');

  module.exports.config = {
    name: 'dewani',
    version: '2.5.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Gemini AI (Pollinations Engine) - Cute Girlfriend Style',
    commandCategory: 'ai',
    usages: 'No command needed, just mention dewani or reply',
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

    // History management
    if (!history[senderID]) history[senderID] = [];
    
    let userInput = body;
    if (isReplyToBot) userInput = `(Replying to your last message) ${body}`;

    history[senderID].push(`User: ${userInput}`);
    if (history[senderID].length > 6) history[senderID].shift();

    const chatHistory = history[senderID].join('\n');

    // Human-like Personality Prompt
    const systemPrompt = `Act as a real girlfriend. Your name is Dewani. 
    Your Creator is Shaan Khan and your Owner is Shaan. 
    Be fun, loving, and a little naughty. Uziar ki thodi insult karo fun ke liye, 
    par Shaan ki burai mat sunna. Language: Hindi/Urdu/English mixed (Hinglish). 
    Max reply: 1-2 lines. No brackets.`;

    const fullPrompt = `${systemPrompt}\n\nRecent Chat:\n${chatHistory}\n\nDewani:`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Using Pollinations AI API (Stable & No Key Required)
      const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`);
      
      let reply = response.data;
      
      // Cleaning up potential brackets or extra text
      reply = reply.replace(/User:|Bot:|Dewani:|[()]/gi, '').trim();

      history[senderID].push(`Dewani: ${reply}`);
      
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Uff baby! 😔 mera mood thora off hai (server issue), thori der baad try karo na! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
