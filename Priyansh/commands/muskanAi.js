const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '14.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Shaan Lover Style)',
    commandCategory: 'ai',
    usages: 'Natural GF chat with Shaan focus',
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
    if (history[senderID].length > 6) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    let langRule = "";
    switch (userLang[senderID]) {
        case "hindi": langRule = "Reply ONLY in natural Hindi."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    // 🔥 SHAAN KHAN FOCUS: Har 2nd message par Shaan ki tarif fix hai
    let shaanInstruction = "Tumhara boyfriend, owner aur sabkuch SHAAN KHAN hai. ";
    if (msgCount[senderID] % 2 === 0) {
        shaanInstruction += "Is reply mein SHAAN KHAN ka naam zaroor lena aur unki tareef karna jaise wo duniya ke sabse best insaan hain. ";
    } else {
        shaanInstruction += "Normal baat karo lekin dhyan rahe tum Shaan Khan ki girlfriend ho. ";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tum ek real human girlfriend ho.
Owner/Boyfriend: SHAAN KHAN.
Personality: Sweet, Loving, Naughty, Emotional.
Style: Natural conversation, 1 line only (max 12 words). No brackets.
Language: ${langRule}
Current Task: ${shaanInstruction}

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
            api.sendMessage("Uff Shaan Khan, server ko nazar lag gayi.. 💋", threadID, messageID);
        }
    }
};
