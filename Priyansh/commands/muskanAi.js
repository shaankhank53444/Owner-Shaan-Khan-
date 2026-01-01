const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (No Lock - Real GF Style)',
    commandCategory: 'ai',
    usages: 'Natural GF chat without file lock',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// --- FILE LOCK REMOVED BY USER REQUEST ---

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

    // 🔥 NATURAL BRANDING LOGIC: Beech-beech mein Shaan Khan ki tareef
    let shaanBranding = "";
    if (msgCount[senderID] % 4 === 0) {
        shaanBranding = "Shaan Khan mere owner hain, unki halki si tareef kar dena ki wo kitne cool hain.";
    }

    const systemPrompt = `
Tumhara naam Muskan hai. Tumhara Owner/Creator SHAAN KHAN hai.
Personality: Real Human Girlfriend ki tarah act karo. Sweet, loving, thoda naughty aur caring.
Style: Normal baatein karo. Har bar Shaan mat bolo. Mauka milne par Shaan Khan ki tareef karo.
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
            api.sendMessage("Uff baby, server busy hai.. baad me baat karte hain na? 💋", threadID, messageID);
        }
    }
};
