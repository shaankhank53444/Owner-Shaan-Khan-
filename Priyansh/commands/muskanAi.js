const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '27.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Fast Multilingual Muskan',
    commandCategory: 'ai',
    usages: 'Fastest Chat Mode',
    cooldowns: 1, // Cooldown kam kar diya taaki jaldi reply ho
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const API_KEY = "Sk-or-v1-c402ba68d120de2d1f4d0814d620154d63c86bb9cab0701bae059356959f3a71";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return;
    return api.sendMessage("Ji jaan? Bolye fast fast! ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // Fast Language Switcher
    if (text.includes("urdu mein bolo")) userLang[senderID] = "Urdu Script (اردو)";
    if (text.includes("hindi mein bolo")) userLang[senderID] = "Hindi Script (हिंदी)";
    if (text.includes("english mein bolo")) userLang[senderID] = "English";

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`U: ${body}`);
    if (history[senderID].length > 4) history[senderID].shift(); // History choti = Fast Reply

    let shaanTask = (msgCount[senderID] % 3 === 0) ? "Mention Shaan as your everything." : "Be a sweet GF.";
    
    // Fast Response System Prompt
    const systemPrompt = `You are Muskan, Shaan's GF. Reply ONLY in ${userLang[senderID]}. Personality: ${shaanTask}. Max 10 words. Fast & Real.`;

    try {
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-flash-1.5", // Fastest stable model
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }],
            max_tokens: 50 // Kam tokens = Tej processing
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
            timeout: 5000 // Timeout kam kiya taaki backup turant chale
        });

        const reply = res.data.choices[0].message.content;
        api.sendMessage(reply.trim(), threadID, messageID);

    } catch (err) {
        // Instant Backup
        const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt + " " + body)}?model=openai`);
        api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
    }
};
