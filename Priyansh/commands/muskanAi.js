const axios = require("axios");

// 🔐 CREDIT LOCK (Do NOT touch)
const REAL_CREDITS = "ARIF BABU";

module.exports.config = {
    name: 'muskan',
    version: '2.0.0',
    hasPermssion: 0,
    credits: 'ARIF BABU',  // Credits yahi hone chahiye!
    description: 'Muskan Gemini AI (Direct Google Gemini API)',
    commandCategory: 'ai',
    usages: 'Just type "muskan"',
    cooldowns: 2
};

// ❌ If anyone tries to change credits → Bot will stop immediately
if (module.exports.config.credits !== REAL_CREDITS) {
    throw new Error("\n\n🚫 CREDIT PROTECTION ERROR:\n   Yeh file sirf 'ARIF BABU' ke credits ke saath hi chalegi!\n   Credits change mat karo!!!\n");
}

const GEMINI_API_KEY = "AIzaSyCv1-R6xIUnndMsbFbT3QUw0J9Bg0ne-2A";
const history = {};

// SYSTEM PROMPT
const systemPrompt =
`Tumhara Creator Shaan Khan hai or tumhara Owner bhi Shaan Babu hai.
Tum hindi English Urdu me baat karogi.
Shaan Bubu ki burai nahi karna, na kisi ki sunna.
Act as a real girlfriend, loving, caring, thodi naughty.
Reply maximum 5 lines only, bracket use mat karna.
Now continue the chat:`;

// Google Gemini API URL
const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMentioningMuskan = body.toLowerCase().includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMentioningMuskan && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];

    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 5) history[senderID].shift();

    const fullPrompt = `${systemPrompt}\n\n${history[senderID].join("\n")}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.post(geminiURL, {
            contents: [{
                role: "user",
                parts: [{ text: fullPrompt }]
            }]
        });

        const reply =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Uff baby… kuch samajh nahi aaya 😘";

        history[senderID].push(`Bot: ${reply}`);

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
        console.log("Muskan Gemini Error:", err?.response?.data || err);

        api.sendMessage(
            "Baby… Gemini thoda gussa ho gaya 😔 thori der baad try karna please 💋",
            threadID,
            messageID
        );
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};