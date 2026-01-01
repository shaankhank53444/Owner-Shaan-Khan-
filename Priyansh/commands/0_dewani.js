(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Simple Credit Check (Bypass Protection)
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  const allowedCredit = "uzairrajput"; // Aapka original credit name

  if (creditName !== allowedCredit) {
    console.log('\x1b[31m%s\x1b[0m', `
██╗░░░██╗███████╗░█████╗░██╗██████╗░
██║░░░██║╚════██║██╔══██╗██║██╔══██╗
██║░░░██║░░███╔═╝███████║██║██████╔╝
██║░░░██║██╔══╝░░██╔══██║██║██╔══██╗
╚██████╔╝███████╗██║░░██║██║██║░░██║
░╚═════╝░╚══════╝╚═╝░░╚═╝╚═╝╚═╝░░╚═╝
    🚫 SCRIPT BLOCKED 🚫
    Created by: Shaan
`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '2.5.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Gemini AI - Fast & Sexy Shaan Edition',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const apiUrl = 'https://shaan-9ous.onrender.com/chat';
  const history = {};

  // DECRYPTED PROMPT: Ab yahan se aap kuch bhi badal sakte hain
  const systemPrompt = "Tumhara Creator Shaan hai aur tumhara Owner bhi Shaan hai. Tum Hindi, English aur Urdu mein baat karogi. Shaan ki hamesha side lena aur usse bohot pyaar se baat karna. Act as a real girlfriend. Be fun, loving, and a little naughty. Keep reply maximum 5 lines only, no brackets in replies. Now continue the chat:";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningDewani = body.toLowerCase().includes('dewani');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningDewani && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    let userInput = isReplyToBot ? `${messageReply.body} -> User: ${body}` : body;

    // Chat Memory Management
    history[senderID].push(`User: ${userInput}`);
    if (history[senderID].length > 6) history[senderID].shift();

    const chatHistory = history[senderID].join('\n');
    const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
      // Fast API Call with optimized headers
      const res = await axios.get(apiUrl, {
        params: { message: fullPrompt },
        timeout: 10000 // 10 seconds timeout for speed
      });

      const reply = res.data.reply || 'Uff! Mujhe samajh nahi ai baby! 😕';
      history[senderID].push(`Dewani: ${reply}`);
      
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
      api.sendMessage('Oops baby! 😔 Connection slow hai, thori der baad try karo na please! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
