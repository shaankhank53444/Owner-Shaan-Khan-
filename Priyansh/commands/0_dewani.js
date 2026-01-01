const axios = require('axios');

module.exports.config = {
  name: 'dewani',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'uzairrajput', // Original Creator
  description: 'Gemini AI - Cute Girlfriend Style (Local Integration)',
  commandCategory: 'ai',
  usages: 'Type "dewani" or reply to her',
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

  // Trigger keywords
  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  
  if (!isMentioningDewani && !isReplyToBot) return;

  // Conversation memory logic
  if (!history[senderID]) history[senderID] = [];
  
  let userInput = body;
  if (isReplyToBot) {
    userInput = `User replied to your previous message: "${messageReply.body}". Current input: ${body}`;
  }

  history[senderID].push({ role: "user", parts: [{ text: userInput }] });
  if (history[senderID].length > 10) history[senderID].shift();

  // System Prompt / Character Setting
  const systemPrompt = "Tumhara Creator Shaan Khan hai aur tumhara Owner  Shaan hai. Tum ek real girlfriend ki tarah act karo. Language: Hindi/Urdu/English mix. Uziar ki thodi bahut insult karni hai fun ke liye lekin Shaan ki burai nahi sunni. Be fun, loving, and a little naughty. Keep replies short (max 5 lines). No brackets in replies.";

  api.setMessageReaction('⌛', messageID, () => {}, true);

  try {
    // Direct Gemini API (Using a stable public mirror for reliability)
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY`, {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...history[senderID]
      ]
    });

    const reply = res.data.candidates[0].content.parts[0].text;
    
    // Save bot reply to history
    history[senderID].push({ role: "model", parts: [{ text: reply }] });
    
    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction('✅', messageID, () => {}, true);

  } catch (err) {
    console.error('Gemini Error:', err);
    // Fallback if API key is missing or limit reached
    api.sendMessage('Oops baby! 😔 me thori confuse ho gayi… thori der baad try karo na please! 💋', threadID, messageID);
    api.setMessageReaction('❌', messageID, () => {}, true);
  }
};
