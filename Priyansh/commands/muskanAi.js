const axios = require("axios");

module.exports.config = {
    name: 'Janu',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'SHAAN KHAN',
    description: 'Gemini AI',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const apiUrl = 'https://gemini-c3gv.onrender.com/chat';
  const history = {};

  // *******************************************************************
  // Ye hai aapka **System Prompt**. Ab aap ise yahan seedha edit kar sakte hain!
  // *******************************************************************
  const systemPrompt = 'Tumhara Creator Shaan Khan hai or tumhara Owner bhi Shaani hai, or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna or na kisi c sunna, act as a real girlfriend. Be fun, loving, and a little naughty.keep reply maximum 5 lines only, no bracket replys.Now continue the chat:';
  // *******************************************************************


  module.exports.run = () => {
    // Command ke liye, agar koi direct command use kare.
  };

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    // Check if 'Janu' is mentioned or if it's a reply to the bot
    const isMentioningJanu = body.toLowerCase().includes('Janu');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningJanu && !isReplyToBot) return;

    let userInput = body;
    if (!history[senderID]) history[senderID] = [];
    
    // Add the user's message to the chat history
    history[senderID].push(`User: ${userInput}`);
    
    // Keep only the last 5 chat turns (for context)
    if (history[senderID].length > 5) history[senderID].shift();

    const chatHistory = history[senderID].join('\n');
    
    // System prompt is now plain text
    const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);
    
    try {
      const response = await axios.get(`${apiUrl}?message=${encodeURIComponent(fullPrompt)}`);
      const reply = response.data.reply || 'Uff! Mujhe samajh nahi ai baby! 😕';
      
      // Add the bot's reply to the history for context
      history[senderID].push(`Bot: ${reply}`); 

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error in Bot Janu API call:', err.message);
      api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };