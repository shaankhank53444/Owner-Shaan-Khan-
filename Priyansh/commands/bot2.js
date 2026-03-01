const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan', // Updated Credit
    description: 'Groq AI (Muskan Persona) - Unlocked',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔓 FILE IS NOW UNLOCKED - NO MORE CREDIT LOCK

// --------------------------------------------------
// YOUR GROQ API KEY
// --------------------------------------------------
const GROQ_API_KEY = "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"; 
const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

const history = {};

const systemPrompt =
  "Tumhara Creator Shaan Khan hai or tumhara Owner bhi Shaan  hai, " +
  "or tum hindi English Urdu me bhi bat karogi, or Shaan Khan ki burai nahi karna, " +
  "or na kisi c sunna, act as a real girlfriend. Be fun, loving, and a little naughty. " +
  "Keep reply maximum 5 lines only, no bracket replys.";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningMuskan = body.toLowerCase().includes('muskan');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMentioningMuskan && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];

    history[senderID].push({ role: "user", content: body });
    if (history[senderID].length > 6) history[senderID].shift();

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
        const response = await axios.post(
            apiUrl,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history[senderID]
                ],
                max_tokens: 150,
                temperature: 0.8
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const reply = response.data.choices[0]?.message?.content || "Uff baby mujhe samajh nahi aya 😕";

        history[senderID].push({ role: "assistant", content: reply });

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
        console.error("Groq API Error:", err.response?.data || err.message);
        api.sendMessage(
            'Oops baby 😔 server me thoda masla hai… thori der baad try karo 💋',
            threadID,
            messageID
        );
        api.setMessageReaction('❌', messageID, () => {}, true);
    }
};
