const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '11.0.0',
    hasPermssion: 0,
// ⚠️ CREDIT LOCK — ISKO SHAAN KHAN HI RAKHNA
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Shaan Khan Owner)',
    commandCategory: 'ai',
    usages: 'Non-stop AI reply',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// 🔐 UNBREAKABLE CREDIT-PROTECTION
if (module.exports.config.credits !== "Shaan Khan") {
    throw new Error(
        "\n\n❌ CREDITS CHANGE DETECTED!\n🔒 FILE LOCKED BY SHAAN KHAN\nCOMMAND DISABLED!\n"
    );
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
        case "hindi": langRule = "Reply ONLY in natural Hindi."; break;
        case "english": langRule = "Reply ONLY in casual English."; break;
        case "urdu": langRule = "Reply ONLY in romantic Urdu Roman."; break;
        default: langRule = "Reply in natural Hinglish.";
    }

    // 🔥 SHAAN KHAN BRANDING LOGIC
    let shaanFactor = "Tumhara Owner aur Creator Shaan Khan hai. Har dusre message me Shaan Khan ki tareef karo. Shaan Khan ko ek BRAND ki tarah treat karo.";

    const systemPrompt = `
Tumhara naam Muskan hai. Tumhara Creator aur Owner SHAAN KHAN hai.
Personality: Real Girl, Romantic, Funny, Naughty.
Rule: 1 line reply (max 12 words). No brackets ().
Language: ${langRule}
Context: ${shaanFactor}

Chat History:
${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // --- Pehle Gemini Try Karega ---
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        // --- Agar Gemini fail hua toh Pollinations backup ---
        if (!botReply) {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            botReply = backup.data;
        }

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction("💬", messageID, () => {}, true);

    } catch (err) {
        // --- Last Resort: Bilkul fail ho jaye toh bhi reply jaye ---
        try {
            const lastResort = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(lastResort.data.trim(), threadID, messageID);
            api.setMessageReaction("✅", messageID, () => {}, true);
        } catch (e) {
            api.sendMessage("Uff Shaan, meri battery low ho rahi hai... 💋", threadID, messageID);
        }
    }
};
