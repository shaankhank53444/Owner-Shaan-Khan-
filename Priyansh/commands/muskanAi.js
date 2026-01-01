const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '25.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Stable Loyal Muskan',
    commandCategory: 'ai',
    usages: 'Real GF chat - No More Network Issues',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const API_KEY = "Sk-or-v1-c402ba68d120de2d1f4d0814d620154d63c86bb9cab0701bae059356959f3a71";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits Lock Error! 😡", event.threadID);
    return api.sendMessage("Ji jaan? Shaan ki Muskan hazir hai. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // Language Detection
    if (text.includes("urdu mein bolo")) userLang[senderID] = "Urdu (اردو script)";
    else if (text.includes("hindi mein bolo")) userLang[senderID] = "Hindi (हिंदी script)";
    else if (text.includes("english mein bolo")) userLang[senderID] = "English";

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 6) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // Shaan Logic
    let shaanLogic = (msgCount[senderID] % 3 === 0) 
        ? "Mention 'Shaan' lovingly as your BF/Everything." 
        : "Talk like a sweet human girlfriend.";

    const systemPrompt = `You are Muskan, Shaan's loyal human GF. Language: ${userLang[senderID]}. Task: ${shaanLogic}. Limit 15 words. Use emojis. History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    // --- API Request with Better Error Handling ---
    try {
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }]
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            timeout: 15000 
        });

        if (res.data.choices && res.data.choices[0].message.content) {
            return sendReply(res.data.choices[0].message.content);
        } else {
            throw new Error("API Limit");
        }

    } catch (err) {
        // --- BACKUP 1: Pollinations ---
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            if (backup.data) return sendReply(backup.data);
        } catch (e) {
            // --- BACKUP 2: Simple Local Reply ---
            const fallbackReplies = [
                "Shaan ki kasam network bohot ganda hai baby! 💋",
                "Uff! Shaan se kaho mera net theek kar dein. ❤️",
                "Baby, net issue hai par main sirf Shaan ki hoon. 😘"
            ];
            const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
            api.sendMessage(randomReply, threadID, messageID);
        }
    }

    function sendReply(reply) {
        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction("❤️", messageID, () => {}, true);
    }
};
