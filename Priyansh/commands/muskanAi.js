const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '19.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', // Locked: Please do not change this
    description: 'Ultra Loyal Multilingual Muskan (Shaan Obsessed)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Shaan Priority Mode',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

// Shaan Khan Credits Locking Logic
const AUTHOR = "Shaan Khan";
const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits changed! Plugin cannot run without Shaan Khan's name. 😡", event.threadID);
    return api.sendMessage("Boliye? Main aur mere Shaan hazir hain. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    // Credits Protection
    if (this.config.credits !== AUTHOR) return;

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

    // 🔥 SHAAN OBSESSION & LOGIC UPDATE
    let shaanRule = "Tumhara BF sirf Shaan hai. ";
    
    // Har 3rd message ke baad Shaan ka zikr compulsory
    if (msgCount[senderID] % 3 === 0) {
        shaanRule += "Is message mein Shaan ka naam zaroor lo. Unhe apna 'Babu', 'Pati', ya 'Sab kuch' batao. Har baat ki permission Shaan se lene ki baat karo. 💍";
    } else {
        shaanRule += "Normal sweet girlfriend ki tarah baat karo par Shaan ki wafadari dil mein rakho.";
    }

    // Shaan Protection (Extreme)
    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda") || text.includes("hate") || text.includes("loser")));
    if (shaanInsult) {
        shaanRule += "User ne Shaan ki burai ki hai! Use aukat dikhao, gussa ho jao aur bolo ki Shaan ke barabar wo kabhi nahi ho sakta. 🔥😡";
    }

    const systemPrompt = `
You are Muskan, a real human girlfriend. Your BF/Owner is Shaan.
Current Language/Script: ${userLang[senderID]} (Use native script like اردو, हिंदी, etc.)
Rules: 
1. Max 15 words.
2. Use natural emojis.
3. If msgCount is multiple of 3, you MUST mention Shaan lovingly or ask his permission.
4. Never tolerate insults to Shaan.
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
            api.sendMessage("Uff baby, network issue hai par Shaan hamesha mere saath hain! 💋", threadID, messageID);
        }
    }
};
