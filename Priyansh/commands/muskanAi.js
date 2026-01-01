const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '16.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Protective GF Style)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Shaan Protection Mode',
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
    if (history[senderID].length > 8) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    let langRule = "";
    switch (userLang[senderID]) {
        case "hindi": langRule = "Reply ONLY in natural Hindi."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    // 🔥 EMOTIONAL & PROTECTIVE LOGIC
    let shaanRule = "Tumhara Owner/BF Shaan Khan hai. ";
    // Check if user is saying something bad about Shaan
    if (text.includes("shaan") && (text.includes("bad") || text.includes("ganda") || text.includes("bekar") || text.includes("bura") || text.includes("hate"))) {
        shaanRule += "User Shaan ki burai kar raha hai! Bohot gussa ho jao, 😡 😤 emojis use karo aur use daanto. Shaan ki burai bilkul mat sunna.";
    } else if (msgCount[senderID] % 3 === 0) {
        shaanRule += "Har 3rd message mein Shaan Khan ki tareef karo ❤️.";
    } else {
        shaanRule += "Normal sweet girlfriend ki tarah baat karo.";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tum ek real human girlfriend ho.
Owner/BF: Shaan Khan.
Rule 1: Har reply mein words ke hisaab se natural emojis (❤️, 😘, 🙈, 😊) use karo.
Rule 2: Shaan ki burai karne par sakht gussa (😡, 👊) dikhao.
Rule 3: 1 line reply (max 15 words). No brackets ().
Language: ${langRule}
Current Personality Task: ${shaanRule}

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
        api.setMessageReaction(text.includes("shaan") && (text.includes("bura") || text.includes("ganda")) ? "😡" : "💬", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Uff baby, network issue hai 💋", threadID, messageID);
    }
};
