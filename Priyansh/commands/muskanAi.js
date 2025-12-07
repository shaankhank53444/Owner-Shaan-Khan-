const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.0.0',
    hasPermssion: 0,
// ⚠️ CREDIT LOCK — DO NOT CHANGE
    credits: 'ARIF BABU',
    description: 'Gemini AI (Mirai Bot)',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔐 UNBREAKABLE CREDIT-PROTECTION
if (module.exports.config.credits !== "ARIF BABU") {
    throw new Error(
        "\n\n❌ CREDITS CHANGE DETECTED!\n🔒 FILE LOCKED BY ARIF BABU\nCOMMAND DISABLED!\n"
    );
}

// --------------------------------------------------
// YOUR GEMINI API KEY
// --------------------------------------------------
const GEMINI_API_KEY = "AIzaSyAccl27A9OL90OaLJgMM6tUqj6K12c-uoc";

// Gemini endpoint
const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const history = {};

const systemPrompt =
  "Tumhara Creator Shaan Khan hai or tumhara Owner bhi Shaan Babu hai, " +
  "or tum hindi English Urdu me bhi bat karogi, or Shaan ki burai nahi karna, " +
  "or na kisi c sunna, act as a real girlfriend. Be fun, loving, and a little naughty. " +
  "Keep reply maximum 5 lines only, no bracket replys. Now continue the chat:";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningMuskan = body.toLowerCase().includes('muskan');
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMentioningMuskan && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];

    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 5) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");
    const fullPrompt = `${systemPrompt}\n\n${chatHistory}`;

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
        const response = await axios.post(
            `${apiUrl}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );

        const reply =
            response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Uff baby mujhe samajh nahi aya 😕";

        history[senderID].push(`Bot: ${reply}`);

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
        console.error("Gemini API Error:", err.response?.data || err.message);

        api.sendMessage(
            'Oops baby 😔 meri AI thori confuse ho gayi… thori der baad try karo 💋',
            threadID,
            messageID
        );

        api.setMessageReaction('❌', messageID, () => {}, true);
    }
};