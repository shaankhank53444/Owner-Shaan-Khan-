const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '16.0.0',
    hasPermission: 0,
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

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Bolo na jaan, Muskan hazir hai! ❤️", event.threadID, event.messageID);
};

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
    if (history[senderID].length > 10) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    let langRule = "";
    switch (userLang[senderID]) {
        case "hindi": langRule = "Reply ONLY in natural Hindi."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    let shaanRule = "Tumhara BF Shaan Khan hai. ";
    if (text.includes("shaan") && (text.includes("bad") || text.includes("ganda") || text.includes("bekar") || text.includes("bura") || text.includes("hate"))) {
        shaanRule += "User Shaan ki burai kar raha hai! Sakht gussa ho jao 😡 aur daanto.";
    } else if (msgCount[senderID] % 3 === 0) {
        shaanRule += "Shaan Khan ki tareef karo ❤️.";
    }

    const systemPrompt = `Name: Muskan (Human GF). Owner: SHAAN KHAN. Rules: Use emojis (❤️, 😘), Max 15 words, No brackets. Language: ${langRule}. Task: ${shaanRule}. History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Updated to 1.5-flash for better stability
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        }, { timeout: 10000 }); // 10 seconds timeout

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!botReply) throw new Error("Empty response from Gemini");

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(text.includes("shaan") && (text.includes("bura") || text.includes("ganda")) ? "😡" : "💬", messageID, () => {}, true);

    } catch (err) {
        console.error("MUSKAN ERROR:", err.response?.data || err.message);
        
        // Backup system if Gemini fails
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            let backupReply = backup.data.split('\n')[0]; // Shorten backup response
            api.sendMessage(backupReply, threadID, messageID);
        } catch (backupErr) {
            api.sendMessage("Uff baby, network bohot tang kar raha hai! 💋", threadID, messageID);
        }
    }
};
