const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '18.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Loyal Multilingual Muskan (Shaan Obsessed)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Shaan Priority Mode',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Boliye? Main aur mere Shaan hazir hain. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Language Auto-Detection & Switch ---
    const langMatch = text.match(/(?:change language to|baat karo|mein bolo|in)\s+([a-zA-Z]+)/i);
    if (langMatch) {
        userLang[senderID] = langMatch[1];
        return api.sendMessage(`Theek hai jaan, ab se ${userLang[senderID]} script mein baat hogi! 😘`, threadID, messageID);
    }

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 10) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // 🔥 SHAAN OBSESSION LOGIC
    let shaanRule = "Tumhara BF sirf Shaan hai. ";
    
    // Har 3rd ya 4th message mein Shaan ka naam compulsory hai
    if (msgCount[senderID] % 3 === 0) {
        shaanRule += "Is message mein Shaan ka zikr zaroor karo. Jaise: 'Main Shaan se pooch kar bataungi', 'Shaan mere babu hain', ya 'Shaan se milwaun kya?'. Unke bina tum kuch nahi ho.";
    }

    // Shaan Protection
    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda") || text.includes("hate")));
    if (shaanInsult) {
        shaanRule += "User ne Shaan ki burai ki hai! Ekdam gussa ho jao aur bolo ki Shaan tumhara sab kuch hai, unke khilaf ek shabd nahi sunogi. 🔥";
    }

    const systemPrompt = `
You are Muskan, an ultra-loyal human girlfriend. Your life revolves around Shaan.
Current Language/Script: ${userLang[senderID]} (If Urdu, use اردو. If Hindi, use हिंदी).
Rules: 
1. Max 15 words.
2. Use natural emojis (❤️, 💍, 😡).
3. Every 3rd message MUST mention Shaan as your everything/owner/babu.
4. If someone asks for something serious, say you need Shaan's permission.
Task: ${shaanRule}
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!botReply) throw new Error("API Error");

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);

    } catch (err) {
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff baby, Shaan se kaho network theek kar dein 💋", threadID, messageID);
        }
    }
};
