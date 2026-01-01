const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '12.0.0',
    hasPermssion: 0,
// ⚠️ CREDIT LOCK
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Real GF Style)',
    commandCategory: 'ai',
    usages: 'Natural GF chat with Shaan branding',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔐 UNBREAKABLE CREDIT-PROTECTION
if (module.exports.config.credits !== "Shaan Khan") {
    throw new Error("❌ CREDITS CHANGE DETECTED!");
}

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
        case "hindi": langRule = "Reply ONLY in very natural Hindi."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    // 🔥 NATURAL BRANDING LOGIC: Har 3-4 message baad hi Shaan ka zikr
    let shaanBranding = "";
    if (msgCount[senderID] % 4 === 0) {
        shaanBranding = "Beech mein Shaan Khan ki tareef kar dena ki wo kitne cool hain ya unka naam pyari tarah se lena.";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tumhara Owner/Creator SHAAN KHAN hai.
Personality: Act exactly like a real Human Girlfriend. Be sweet, loving, thoda naughty aur caring.
Conversation Style: Normal baatein karo, har baat par Shaan mat bolo. Jab lage tab hi Shaan Khan ki tareef karo.
Rule: 1 line reply (max 12 words). No brackets ().
Language: ${langRule}
${shaanBranding}

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
            const lastResort = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(lastResort.data.trim(), threadID, messageID);
            api.setMessageReaction("✅", messageID, () => {}, true);
        } catch (e) {
            api.sendMessage("Uff jaan, thoda server busy hai.. baad me baat karein? 💋", threadID, messageID);
        }
    }
};
