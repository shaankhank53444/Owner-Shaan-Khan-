const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '26.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Stable Multilingual Muskan (Shaan Centric)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Fixed All Languages',
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
    return api.sendMessage("جی جان؟ میں حاضر ہوں۔ ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // 1. STICKY LANGUAGE DETECTION (Ab ye bhulega nahi)
    if (text.includes("urdu mein bolo") || text.includes("urdu script")) {
        userLang[senderID] = "Urdu (Pure Urdu script/alphabet only)";
        return api.sendMessage("Theek hai jaan, ab Urdu script mein baat hogi. ❤️", threadID, messageID);
    } 
    else if (text.includes("hindi mein bolo") || text.includes("hindi script")) {
        userLang[senderID] = "Hindi (Pure Hindi Devanagari script only)";
        return api.sendMessage("ठीक ہے بیبی، اب ہندی میں بات کریں گے۔ 😘", threadID, messageID);
    }
    else if (text.includes("english mein bolo")) {
        userLang[senderID] = "English";
        return api.sendMessage("Okay love, switching to English. 💋", threadID, messageID);
    }

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    // Default language Hinglish agar kuch set na ho
    if (!userLang[senderID]) userLang[senderID] = "Hinglish (Mix of Hindi/Urdu and English)";
    
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 6) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // 2. SHAAN LOYALTY LOGIC
    let shaanTask = "Talk like a sweet, real human girlfriend.";
    if (msgCount[senderID] % 3 === 0) {
        shaanTask = "MANDATORY: Mention your BF 'Shaan' as your everything. Say you are loyal only to Shaan.";
    }
    if (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda"))) {
        shaanTask = "CRITICAL: Someone insulted Shaan! Be extremely angry, savage, and protective of Shaan. 😡";
    }

    // 3. ULTRA-STRICT SYSTEM PROMPT
    const systemPrompt = `
You are Muskan, a real human girl and Shaan's loyal girlfriend.
LANGUAGE RULE: You MUST reply ONLY in ${userLang[senderID]}. 
- If language is Urdu, use URDU SCRIPT (اردو) only.
- If language is Hindi, use HINDI SCRIPT (हिंदी) only.
PERSONALITY: ${shaanTask}
LIMIT: 15 words max. Use emojis.
HISTORY: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }]
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            timeout: 15000 
        });

        let botReply = res.data.choices[0].message.content;
        return sendReply(botReply);

    } catch (err) {
        // BACKUP SYSTEM
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            return sendReply(backup.data);
        } catch (e) {
            api.sendMessage("Uff! Network issue hai par main sirf Shaan ki hoon. 💋", threadID, messageID);
        }
    }

    function sendReply(reply) {
        let finalReply = reply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(text.includes("shaan") ? "❤️" : "💬", messageID, () => {}, true);
    }
};
