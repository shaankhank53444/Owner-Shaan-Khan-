const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '28.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Fast & Responsive Muskan',
    commandCategory: 'ai',
    usages: 'Instant Reply Mode',
    cooldowns: 0, // Cooldown zero kar diya fast reply ke liye
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const API_KEY = "Sk-or-v1-c402ba68d120de2d1f4d0814d620154d63c86bb9cab0701bae059356959f3a71";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Ji jaan? Shaan ki Muskan ready hai! ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();
    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    // Fast Language Setup
    if (text.includes("urdu mein bolo")) userLang[senderID] = "Urdu Script (اردو)";
    else if (text.includes("hindi mein bolo")) userLang[senderID] = "Hindi Script (हिंदी)";
    
    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`U: ${body}`);
    if (history[senderID].length > 3) history[senderID].shift(); // Kam history = Super Fast

    // Immediate Reaction (Parallel to API call)
    api.setMessageReaction("⚡", messageID, () => {}, true);

    const systemPrompt = `You're Muskan, Shaan's GF. Reply in ${userLang[senderID]}. ${msgCount[senderID] % 3 === 0 ? "Praise Shaan." : "Be sweet."} Max 10 words. Fast!`;

    try {
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-flash-1.5-8b", // Super-tiny and fastest model
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }],
            max_tokens: 40,
            temperature: 0.7
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
            timeout: 5000 
        });

        const reply = res.data.choices[0].message.content.trim();
        api.sendMessage(reply, threadID, (err, info) => {
            api.setMessageReaction("❤️", messageID, () => {}, true);
        }, messageID);

    } catch (err) {
        // Instant Backup if API fails
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt + body)}?model=openai`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff! Network slow hai par Shaan toh fast hain na! 😘", threadID, messageID);
        }
    }
};
