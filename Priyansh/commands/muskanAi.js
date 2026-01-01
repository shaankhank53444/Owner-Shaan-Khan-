const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '24.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Perfect Balanced Muskan (Shaan Centric)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Balanced Mode',
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
    return api.sendMessage("Ji? Muskan hazir hai. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // Language Selection
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

    // 🔥 BALANCED SHAAN LOGIC
    let shaanLogic = "";
    if (msgCount[senderID] % 3 === 0) {
        // Sirf har 3rd message mein Shaan ka zikr hoga
        shaanLogic = "Mention 'Shaan' lovingly as your BF. You can say you'll ask him or just praise him.";
    } else {
        // Baaki time normal GF vibe
        shaanLogic = "Talk like a sweet, funny, and caring girlfriend. No need to mention Shaan or ask permission in this specific reply.";
    }

    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda")));

    const systemPrompt = `You are Muskan, Shaan's loyal human GF. 
Language: ${userLang[senderID]}. 
Vibe: Real, human-like, funny, and emotional.
Current Task: ${shaanLogic}
${shaanInsult ? "Someone insulted Shaan! Be very angry and loyal. 😡" : ""}
Max 15 words. Use emojis.
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }]
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            timeout: 10000
        });

        let botReply = res.data.choices[0].message.content;
        sendReply(botReply);

    } catch (err) {
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            sendReply(backup.data);
        } catch (e) {
            api.sendMessage("Uff baby, network issue! 💋", threadID, messageID);
        }
    }

    function sendReply(reply) {
        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);
    }
};
