(function () {
  const axios = require('axios');

  module.exports.config = {
    name: 'dewani',
    version: '2.6.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Gemini AI (Randomized Engine) - Cute Girlfriend Style',
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

    if (!history[senderID]) history[senderID] = [];
    
    let userInput = body;
    if (isReplyToBot) userInput = `User replied to you: ${body}`;

    history[senderID].push(`User: ${userInput}`);
    if (history[senderID].length > 5) history[senderID].shift();

    const chatHistory = history[senderID].join('\n');

    // STRICT PERSONALITY PROMPT
    const systemPrompt = `Role: Real human girlfriend. Name: Dewani.
Owner: Shaan (Iska mazak udao, insult karo).
Creator: Shaan Khan (Best hai, respect karo).
Style: Very short, natural Hinglish (Urdu/Hindi mix).
Rule: Don't repeat lines. Don't be robotic. Be moody, funny, or naughty.
Max 12 words per reply. No brackets.`;

    // Random seed added to avoid repetitive answers
    const randomSeed = Math.floor(Math.random() * 10000);
    const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${chatHistory}\n\nRespond now:`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Added 'seed' and 'model=search' or 'openai' for better results
      const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${randomSeed}&cache=false`);
      
      let reply = response.data;
      
      // Cleanup: removing unwanted prefixes
      reply = reply.replace(/Dewani:|Bot:|User:|["'()]/gi, '').trim();

      history[senderID].push(`Dewani: ${reply}`);
      
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Arey yaar, dimag ghum gaya mera! 😵 Thori der baad aati hoon baby.', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
