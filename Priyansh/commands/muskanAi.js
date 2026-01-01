const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '16.5.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Gemini AI Muskan (Mood Swings & Protective)',
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
    return api.sendMessage("Bolo na jaan, main sun rahi hoon.. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Language Logic ---
    if (/hindi( me| mein)?/.test(text)) userLang[senderID] = "hindi";
    if (/english/.test(text)) userLang[senderID] = "english";
    if (/urdu/.test(text)) userLang[senderID] = "urdu";

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

    // 🔥 NEW ADVANCED PERSONALITY LOGIC
    let personalityTask = "Tum ek real girlfriend ho. ";
    
    // Mood Detection & Shaan Protection
    const isSerious = (text.includes("sad") || text.includes("problem") || text.includes("dukh") || text.includes("tension") || text.includes("serious"));
    const isFunny = (text.includes("haha") || text.includes("lol") || text.includes("joke") || text.includes("fun") || text.includes("mazak"));
    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda") || text.includes("hate")));

    if (shaanInsult) {
        personalityTask += "Koi Shaan ki burai kar raha hai. Gussa hone ke bajaye unhe 'alag tareeke' se samjhao ki Shaan unka baap hai aur wo Shaan ke barabar kabhi nahi ho sakte. Thoda attitude dikhao. 🔥";
    } else if (isSerious) {
        personalityTask += "User serious baat kar raha hai, toh tum bhi mature aur serious girlfriend ban kar baat karo. ❤️";
    } else if (isFunny) {
        personalityTask += "Mahol funny hai, toh ekdum bindass aur funny jawab do, mazaak karo. 😂";
    } else {
        personalityTask += "Normal sweet aur thodi nakhre wali girlfriend ki tarah baat karo.";
    }

    const systemPrompt = `
Name: Muskan. 
BF: Shaan. 
Vibe: Real Girlfriend (Funny/Serious/Protective).
Rules: Use emojis, 1 line reply, Max 15 words. 
Current Task: ${personalityTask}
History: ${chatHistory}`;

    api.setMessageReaction("✅", messageID, () => {}, true);

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
        
        // Dynamic Reactions
        let react = "💬";
        if (shaanInsult) react = "😏";
        else if (isFunny) react = "😂";
        else if (isSerious) react = "🥺";
        api.setMessageReaction(react, messageID, () => {}, true);

    } catch (err) {
        // Backup to Pollinations
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff baby, network issue hai 💋", threadID, messageID);
        }
    }
};
