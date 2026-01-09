const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.2.0',
    hasPermssion: 0,
    credits: 'Shaan', // Creator updated to Shaan
    description: 'Girlfriend AI - Locked to Shaan, Replies on mention/reply',
    commandCategory: 'ai',
    usages: '[reply or mention]',
    cooldowns: 1
};

const API_URL = "https://aryan-nitya-ai-api-chat-bot.onrender.com/chat";
const history = {};

// System Prompt updated with Shaan as fixed owner
const systemPrompt =
    "Tumhara creator aur owner Shaan hai. Tum sirf Shaan ki girlfriend ho, thodi naughty, loving aur caring. " +
    "Hindi/Urdu/English mix me reply karo. Kisi aur ko zyada lift mat karao, sirf Shaan tumhara sab kuch hai. " +
    "Reply only 4–5 lines, natural, no brackets. Chat continue:";

module.exports.run = () => { };

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply, mentions } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const botID = api.getCurrentUserID();
    const botName = "muskan"; 
    
    // Logic to check if bot should reply
    const isReplyToBot = messageReply && messageReply.senderID == botID;
    const isMentioned = Object.keys(mentions).includes(botID) || body.toLowerCase().includes(botName);

    // File unlocked: Replies only when mentioned or replied to
    if (!isReplyToBot && !isMentioned) return;

    if (!history[senderID]) history[senderID] = [];
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 10) history[senderID].shift();

    const fullPrompt = `${systemPrompt}\n\n${history[senderID].join("\n")}`;

    if (api.setMessageReaction)
        api.setMessageReaction("⌛", messageID, () => { }, true);

    try {
        const response = await axios.post(
            API_URL,
            { message: fullPrompt },
            { timeout: 40000 }
        );

        const reply = response?.data?.reply || "Baby main thoda busy thi... kya kaha aapne? 💋";

        history[senderID].push(`Bot: ${reply}`);

        api.sendMessage(reply, threadID, messageID);

        if (api.setMessageReaction)
            api.setMessageReaction("💛", messageID, () => { }, true);

    } catch (err) {
        console.error("Muskan API Error:", err.message);
        api.sendMessage("Shaan... mere server mein kuch issue aa raha hai baby, 1 minute ruko 😔", threadID, messageID);
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => { }, true);
    }
};
