const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '17.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Global Multilingual Muskan (Shaan Protection)',
    commandCategory: 'ai',
    usages: 'Real GF chat - All Languages Supported',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Ji jaan, main har zubaan samajhti hoon. Boliye? ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Dynamic Language Switcher ---
    // Example: "change language to Arabic" or "Urdu mein baat karo"
    const langMatch = text.match(/(?:change language to|baat karo|mein bolo|in)\s+([a-zA-Z]+)/i);
    if (langMatch) {
        const requestedLang = langMatch[1];
        userLang[senderID] = requestedLang;
        return api.sendMessage(`Theek hai baby, ab se main ${requestedLang} mein hi baat karungi! 😘`, threadID, messageID);
    }

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];

    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 10) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // 🔥 DYNAMIC PERSONALITY & LANGUAGE SCRIPTING
    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda")));
    const isSerious = (text.includes("sad") || text.includes("tension") || text.includes("serious"));
    const isFunny = (text.includes("haha") || text.includes("lol") || text.includes("mazak"));

    let mood = "Normal Sweet GF";
    if (shaanInsult) mood = "Protective & Savage (Shaan is the best, user is nothing)";
    else if (isSerious) mood = "Mature & Caring";
    else if (isFunny) mood = "Funny & Naughty";

    const systemPrompt = `
You are Muskan, a real human girlfriend. Your BF is Shaan.
CRITICAL RULE: Reply ONLY in the native script of the requested language. 
- If language is Urdu: Use اردو script.
- If language is Hindi: Use हिंदी script.
- If language is Pashto: Use پښتو script.
- Current Language: ${userLang[senderID]}
Personality: ${mood}
Response Style: Max 15 words, use natural emojis, be realistic.
History:
${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!botReply) throw new Error("API Fail");

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        
        let react = shaanInsult ? "😏" : (isFunny ? "😂" : "❤️");
        api.setMessageReaction(react, messageID, () => {}, true);

    } catch (err) {
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff baby, network issue hai 💋", threadID, messageID);
        }
    }
};
