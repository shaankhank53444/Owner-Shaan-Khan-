const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '9.0.0',
    hasPermssion: 0,
    credits: 'ARIF BABU',
    description: 'Gemini + Backup AI (Non-Stop Chat)',
    commandCategory: 'ai',
    usages: 'Real human style auto reply',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔐 CREDIT LOCK
if (module.exports.config.credits !== "ARIF BABU") {
    throw new Error("❌ CREDITS CHANGE DETECTED!");
}

const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
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

    const systemPrompt = `Act as Muskan, a real girl. Creator/Owner: Shaan Khan. Tone: Loving, naughty, fun. Rule: 1 line reply, max 15 words. No brackets. Lang: ${langRule}. Chat:\n${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // --- ATTEMPT 1: GEMINI API ---
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let reply = res.data.candidates?.[0]?.content?.parts?.[0]?.text;

        // --- ATTEMPT 2: BACKUP (If Gemini fails or is empty) ---
        if (!reply) {
            const backupUrl = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`;
            const backupRes = await axios.get(backupUrl);
            reply = backupRes.data;
        }

        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        // --- LAST RESORT: POLLINATIONS ---
        try {
            const lastResort = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(lastResort.data.trim(), threadID, messageID);
            api.setMessageReaction("✅", messageID, () => {}, true);
        } catch (finalErr) {
            api.sendMessage("Uff baby, server thoda busy hai.. ek baar fir likho na? 💋", threadID, messageID);
        }
    }
};
