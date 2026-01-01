const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '23.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Loyal Muskan (DeepSeek/Gemini Supported)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Anti-Error Mode',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
// Aapki di hui key yahan set kar di hai
const API_KEY = "Sk-or-v1-c402ba68d120de2d1f4d0814d620154d63c86bb9cab0701bae059356959f3a71";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits Lock Error! 😡", event.threadID);
    return api.sendMessage("Ji Shaan ke babu? Muskan haazir hai. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // 1. Language Logic (Strict Native Script)
    if (text.includes("urdu mein bolo")) userLang[senderID] = "Urdu (اردو script)";
    else if (text.includes("hindi mein bolo")) userLang[senderID] = "Hindi (हिंदी script)";
    else if (text.includes("pashto mein bolo")) userLang[senderID] = "Pashto (پښتو script)";
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

    // 2. Shaan Force Logic
    let shaanForcing = "";
    if (msgCount[senderID] % 3 === 0) {
        shaanForcing = "MANDATORY: Mention 'Shaan' as your BF/Owner. Say you need Shaan's permission or praise him. No Shaan, No Reply.";
    }

    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda") || text.includes("hate")));

    const systemPrompt = `You are Muskan, Shaan's loyal human GF.
Reply ONLY in ${userLang[senderID]}. (Native script for Urdu/Hindi/Pashto).
Rules: Max 15 words, use emojis, be funny/serious based on mood. 
${shaanForcing}
${shaanInsult ? "Someone insulted Shaan! Be extremely angry and savage. 😡" : ""}
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Trying with your provided Key first (DeepSeek/OpenRouter format)
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
        // AUTO-BACKUP: Agar Key fail hui toh Pollinations se reply aayega (Bina key ke)
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            sendReply(backup.data);
        } catch (e) {
            api.sendMessage("Uff baby, network ka masla hai! Shaan ko bolo theek karein 💋", threadID, messageID);
        }
    }

    function sendReply(reply) {
        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);
    }
};
