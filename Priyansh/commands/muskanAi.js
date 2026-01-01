const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '8.5.0',
    hasPermssion: 0,
// ⚠️ CREDIT LOCK — DO NOT CHANGE
    credits: 'ARIF BABU',
    description: 'Gemini AI Human-like Natural Chat (Hindi/English/Urdu)',
    commandCategory: 'ai',
    usages: 'Real human style auto reply with Gemini API',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔐 UNBREAKABLE CREDIT-PROTECTION
if (module.exports.config.credits !== "ARIF BABU") {
    throw new Error(
        "\n\n❌ CREDITS CHANGE DETECTED!\n🔒 FILE LOCKED BY ARIF BABU\nCOMMAND DISABLED!\n"
    );
}

// ----------------------------------------------------
// 🔥 GEMINI API CONFIG (From first file)
// ----------------------------------------------------
const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const history = {};
const userLang = {};

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // ----------------------------------------------------
    // 🔥 LANGUAGE SWITCHING (From second file)
    // ----------------------------------------------------
    if (/hindi( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "hindi";
        return api.sendMessage("Okay baby, ab full Hindi me baat karungi 😌", threadID, messageID);
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
    // ❤️ SYSTEM PROMPT (Combined Personality)
    // ----------------------------------------------------
    const systemPrompt = `
Tumhara Creator or Owner Shaan Khan hai.
Tumhara naam Muskan hai aur tum ek natural insan jaisi ladki ho.
Tone: Sweet, caring, thoda romantic 😌 aur thoda naughty 😏.
Reply MUST be one single line only, max 15 words. No brackets ().

Language Style:
${langRule}

Rules:
- Kisi se Shaan ki burai mat sunna.
- Koi puche kisne banaya to bolo: "Shaan ne banaya baby 😎💋"
- Har reply natural aur emotional ho.

Chat History:
${fullChat}
`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Calling Gemini API
        const response = await axios.post(
            `${apiUrl}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: systemPrompt }]
                }]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        let botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Uff baby mood off hai mera 😔";
        
        // Cleaning reply (removing extra newlines)
        botReply = botReply.replace(/\n/g, " ").trim();

        history[senderID].push(`Bot: ${botReply}`);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        console.error("Gemini API Error:", err.response?.data || err.message);
        api.sendMessage("Baby server mood off hai, thodi der baad try karna 😘", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
