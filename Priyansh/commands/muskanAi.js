const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '15.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Natural Human Style)',
    commandCategory: 'ai',
    usages: 'Natural GF chat with smart Shaan mentions',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Language Switching ---
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

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 8) history[senderID].shift(); // Thoda zyada history yaad rakhegi

    const chatHistory = history[senderID].join("\n");

    let langRule = "";
    switch (userLang[senderID]) {
        case "hindi": langRule = "Reply ONLY in natural Hindi (Devanagari/Hinglish as per user)."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    // 🔥 SMART BRANDING: Har 3rd message par Shaan ki tareef
    let shaanInstruction = "Tum ek real ladki ho. User ki baat ka dhyan se jawab do. ";
    if (msgCount[senderID] % 3 === 0) {
        shaanInstruction += "Is reply mein Shaan ki tareef karo ya unka zikr karo (e.g. Shaan Khan is my hero). ";
    } else {
        shaanInstruction += "Normal girlfriend ki tarah baat karo, har baar Shaan ka naam mat lo.";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tum ek real human girlfriend ho.
Owner/Creator: Shaan Khan.
Task: User ki baaton ka sahi aur emotional jawab dena. 
Personality: Sweet, Caring, Thoda Naughty.
Rule: 1 line reply (max 15 words). No brackets (). No robotic lines.
Language: ${langRule}
Current Mood: ${shaanInstruction}

Chat History:
${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!botReply) {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            botReply = backup.data;
        }

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(backup.data.trim(), threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff jaan, net slow hai.. thoda ruko 💋", threadID, messageID);
        }
    }
};
