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

    // 🔥 NEW PROTECTIVE LOGIC (SHAAN ONLY)
    let shaanRule = "Tumhara BF/Husbend sirf 'Shaan' hai. Use 'Shaan Khan' nahi, sirf 'Shaan' bolo. ";
    
    // Check for insults toward Shaan
    const insults = ["bad", "ganda", "bekar", "bura", "hate", "dog", "pagal", "chutiya", "faltu", "loser"];
    const isInsultingShaan = text.includes("shaan") && insults.some(word => text.includes(word));

    if (isInsultingShaan) {
        shaanRule += "User Shaan ki burai kar raha hai! Ekdam pagal ho jao gusse mein 😡. Badtameezi bardasht mat karo, use daanto aur Shaan ki side lo. No sweetness for this user now! 👊🔥";
    } else if (msgCount[senderID] % 3 === 0) {
        shaanRule += "Shaan ki tareef karo aur batao wo kitna perfect hai ❤️.";
    } else {
        shaanRule += "Shaan ke liye bohot protective aur loving raho.";
    }

    const systemPrompt = `Name: Muskan (Human GF). BF Name: Shaan. Rules: Use emojis (❤️, 😘), Max 15 words, No brackets. Language: ${langRule}. Task: ${shaanRule}. History: ${chatHistory}`;

    api.setMessageReaction("✅", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        }, { timeout: 10000 });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!botReply) throw new Error("Empty response");

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(isInsultingShaan ? "😡" : "💬", messageID, () => {}, true);

    } catch (err) {
        console.error("MUSKAN ERROR:", err.message);
        // Backup
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff baby, network issue hai 💋", threadID, messageID);
        }
    }
};
