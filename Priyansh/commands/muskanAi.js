const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '9.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Groq Powered Natural Chat AI',
    commandCategory: 'ai',
    usages: 'Real human style auto reply',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const userLang = {};
const GROQ_API_KEY = "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"; // <--- Apni API key yahan dalein

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Language Selection ---
    if (/hindi( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "hindi";
        return api.sendMessage("Okay baby, ab full Hindi me baat karunga 😌", threadID, messageID);
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

    // --- Groq History Format (JSON) ---
    if (!history[senderID]) history[senderID] = [];
    history[senderID].push({ role: "user", content: body });
    if (history[senderID].length > 6) history[senderID].shift();

    // --- System Prompt Setup ---
    let langRule = "Reply in natural Hinglish like real conversation.";
    if (userLang[senderID] === "hindi") langRule = "Reply ONLY in natural Hindi.";
    if (userLang[senderID] === "english") langRule = "Reply ONLY in casual English.";
    if (userLang[senderID] === "urdu") langRule = "Reply ONLY in romantic Urdu Roman.";

    const systemPrompt = `Tumhara Muskan hai. Tum ek natural ladki ho. Shaan ki girlfriend ho. baki user ke lie tum ek girl member ho. 
    Tone: Emotional, Sweet, Romantic. 
    Rule: Short reply (max 12 words), 3 line only.
    Context: ${langRule}
    Banane wala: Shaan Hai 😎💋`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history[senderID]
                ],
                max_tokens: 60,
                temperature: 0.8
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const botReply = response.data.choices[0].message.content.trim();
        history[senderID].push({ role: "assistant", content: botReply });

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Baby Groq API key error hai ya limit khatam ho gayi hai 😘", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
