const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.0.0',
    hasPermssion: 0,
    credits: 'Irfan',
    description: 'Girlfriend AI (Mirai + Render Backend)',
    commandCategory: 'ai',
    usages: '[your message]',
    cooldowns: 1
};

// 🔥 Your Render backend URL (CORRECT ENDPOINT)
const API_URL = "https://aryan-nitya-ai-api-chat-bot.onrender.com/chat";

// User-based chat history
const history = {};

// System behavior
const systemPrompt =
    "Tumhara creator Shaan hai. Tum uski girlfriend ho, thodi naughty, loving, caring. " +
    "Hindi/Urdu/English mix me reply karo. Irfan ki burai mat karna. " +
    "Reply only 4–5 lines, natural, no brackets. Chat continue:";

// Entry point (ignore)
module.exports.run = () => { };

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body) return;
    
    // Bot khud ko reply na kare
    if (senderID == api.getCurrentUserID()) return;

    // User history setup
    if (!history[senderID]) history[senderID] = [];

    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 10) history[senderID].shift();

    const fullPrompt = `${systemPrompt}\n\n${history[senderID].join("\n")}`;

    // Reaction loading
    if (api.setMessageReaction)
        api.setMessageReaction("⌛", messageID, () => { }, true);

    try {
        // Send to Render backend
        const response = await axios.post(
            API_URL,
            { message: fullPrompt },
            { timeout: 40000 }
        );

        const reply =
            response?.data?.reply ||
            "Baby mujhe samajh nahi aya… dubara bolo na 💋";

        // Save into chat history
        history[senderID].push(`Bot: ${reply}`);

        // Send reply
        api.sendMessage(reply, threadID, messageID);

        if (api.setMessageReaction)
            api.setMessageReaction("💛", messageID, () => { }, true);

    } catch (err) {
        console.error("Muskan API Error:", err.message);

        api.sendMessage(
            "Oops baby… server so raha tha 😔 1 second ruk jao, phir try karo 💋",
            threadID,
            messageID
        );

        if (api.setMessageReaction)
            api.setMessageReaction("❌", messageID, () => { }, true);
    }
};