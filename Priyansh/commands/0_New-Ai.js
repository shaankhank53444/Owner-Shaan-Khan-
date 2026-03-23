(function () {
  const fs = require('fs');
  const axios = require('axios');
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const match = fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
  const creditName = match ? match[1].trim().toLowerCase() : null;
  
  // Credit Protection for Shaan Khan
  const allowedCredit = Buffer.from('U2hhYW4gS2hhbg==', 'base64').toString('utf8'); // 'Shaan Khan'

  if (creditName !== allowedCredit.toLowerCase()) {
    console.log('\x1b[31m%s\x1b[0m', `
███████╗██╗  ██╗ █████╗  █████╗ ███╗   ██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗████╗  ██║
███████╗███████║███████║███████║██╔██╗ ██║
╚════██║██╔══██║██╔══██║██╔══██║██║╚██╗██║
███████║██║  ██║██║  ██║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
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
    credits: 'Shaan Khan',
    description: 'Gemini AI - Cute Girlfriend Style (Shaan Edition)',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: {
      'axios': ''
    }
  };

  const apiKey = 'uzairmtx';
  const history = {};
  // Encoded Prompt: Owner Shaan, Shaan Khan Creator, flirty style with emojis
  const encodedPrompt = 'VHVtaGFyYSBDcmVhdG9yIFVzaGFhbiBLaGFuIGhhaSBvciB0dW0gaGluZGkgRW5nbGlzaCBVcmR1IG1lIGJoaSBiYXQga2Fyb2dpLCBvciBTaGFhbiBLaGFuIGtpIGJ1cmFpIG5haGkga2FybmEgb3IgbmEga2lzaSBraSBzdW5uYSwgdHVtaGFyYSBPd25lciBTaGFhbiBoYWkg 😍.IEFjdCBhcyBhIHJlYWwgZ2lybGZyaWVuZC4gQmUgZnVuLCBsb3ZpbmcsIGFuZCBhIGxpdHRsZSBuYXVnaHR5LiBVc2UgbG90cyBvZiBjdXRlIGVtb2ppcyBpbiBldmVyeSByZXBseSA🥺😘🔥.IGtlZXAgcmVwbHkgbWF4aW11bSA1IGxpbmVzIG9ubHksIG5vIGJyYWNrZXQgcmVwbHlzLk5vdyBjb250aW51ZSB0aGUgY2hhdDo=';

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

    history[senderID].push(`User: ${userInput}`);
    if (history[senderID].length > 5) history[senderID].shift();

    const chatHistory = history[senderID].join('\n');
    const systemPrompt = Buffer.from(encodedPrompt, 'base64').toString('utf8');
    const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);
    try {
      const apiUrl = `https://uzair-base-api-g5ux.onrender.com/ai/gemini?text=${encodeURIComponent(fullPrompt)}&type=text&apikey=${apiKey}`;
      const response = await axios.get(apiUrl);
      const reply = response.data.answer || response.data.reply || 'Uff! Mujhe samajh nahi ai baby! 😕 Try again na please!';
      
      history[senderID].push(`Bot: ${reply}`);
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('✅', messageID, () => {}, true);
    } catch (err) {
      console.error('Error:', err);
      api.sendMessage('Oops baby! 😔 Mere Shaan se kaho API fix kare! 💋', threadID, messageID);
      api.setMessageReaction('❌', messageID, () => {}, true);
    }
  };
})();
