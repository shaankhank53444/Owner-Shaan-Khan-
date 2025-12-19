1111const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '8.5.0',
    hasPermssion: 0,
    credits: 'ARIF BABU',
    description: 'Human-like Natural Chat AI (Hindi/English/Urdu)',
    commandCategory: 'ai',
    usages: 'Real human style auto reply',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const userLang = {};

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // ----------------------------------------------------
    // 🔥 LANGUAGE SWITCHING
    // ----------------------------------------------------
    if (/hindi( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "hindi";
        return api.sendMessage("Okay baby, ab full Hindi me baat karunga 😌", threadID, messageID);
    }

    if (/english( me| in)? bolo/.test(text)) {
        userLang[senderID] = "english";
        return api.sendMessage("Alright love, switching to English now 😘", threadID, messageID);
    }

    if (/urdu( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "urdu";
        return api.sendMessage("Theek jaan, ab Urdu Roman me baat hogi 😏✨", threadID, messageID);
    }

    // ----------------------------------------------------
    // 🔥 Bot triggers
    // ----------------------------------------------------
    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "hinglish";

    // ----------------------------------------------------
    // HISTORY
    // ----------------------------------------------------
    if (!history[senderID]) history[senderID] = [];
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 6) history[senderID].shift();

    const fullChat = history[senderID].join("\n");

    // ----------------------------------------------------
    // LANGUAGE MODE
    // ----------------------------------------------------
    let langRule = "";

    switch (userLang[senderID]) {
        case "hindi":
            langRule = "Reply ONLY in very natural Hindi, like a real person.";
            break;
        case "english":
            langRule = "Reply ONLY in casual, natural English.";
            break;
        case "urdu":
            langRule = "Reply ONLY in soft, romantic Urdu Roman.";
            break;
        default:
            langRule = "Reply in natural Hinglish like real conversation.";
    }

    // ----------------------------------------------------
    // ❤️ HUMAN NATURAL RESPONSE PROMPT
    // ----------------------------------------------------
    const prompt = `
Tum ek natural insan jaisa baat karne wale ladki ho — naam Shaan.
Tone real, emotional, natural, human-like.
Reply MUST be one single line only, max 12 words.
Har reply bilkul aise ho jaise real life me koi baat kar raha ho.

Language Style:
${langRule}

Personality:
- Sweet, caring, thoda romantic 😌
- Kabhi-kabhi naughty 😏🔥
- Funny jab mauka mile 😈
- Emoji natural jagah par hi use karna
- Koi bole bot → halka cute roast
- Koi puche kaun banaya → "Shaan-Khan-K ne banaya baby 😎💋"

Chat:
${fullChat}

Give ONE natural human-like reply (1 line, 12 words max):
`;

    const finalPrompt = prompt;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`;
        const res = await axios.get(url);

        let botReply = (typeof res.data === "string" ? res.data : JSON.stringify(res.data))
            .replace(/\n/g, " ")
            .trim();

        history[senderID].push(`Bot: ${botReply}`);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        console.error("Pollinations API Error:", err.message);
        api.sendMessage("Baby server mood off hai, thodi der baad try karna 😘", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};