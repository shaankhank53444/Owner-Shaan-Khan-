const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '10.0.0',
    hasPermssion: 0,
    credits: 'ARIF BABU',
    description: 'Gemini AI Muskan (Shaan Special Version)',
    commandCategory: 'ai',
    usages: 'Auto reply with Shaan branding',
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
const msgCount = {}; // Message count track karne ke liye

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

    msgCount[senderID]++; // Har message par counter badhega
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

    // 🔥 SHAAN SPECIAL LOGIC: Har 2-3 message baad Shaan ki tareef
    let shaanFactor = "";
    if (msgCount[senderID] % 2 === 0) {
        shaanFactor = "Har jagah Shaan ka naam hona chahiye. Beech mein Shaan ki tareef karo ki wo kitna handsome ya cool hai, ya bolo ki Shaan hi mera sab kuch hai. Use funny but loving lines about Shaan.";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tumhara Creator Shaan Khan hai, lekin tumhara favorite person SHAAN hai.
Personality: Romantic, Naughty, Funny.
Rules:
1. Reply 1 line only (max 12 words).
2. ${langRule}
3. ${shaanFactor}
4. Kabhi-kabhi bolo "Shaan is brand" ya "Shaan jaisa koi nahi".
5. No brackets (). 

Chat History:
${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let reply = res.data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Backup if Gemini fails
        if (!reply) {
            const backupRes = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            reply = backupRes.data;
        }

        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Uff baby, Shaan ki yaad me server kho gaya.. fir se bolo? 💋", threadID, messageID);
    }
};
