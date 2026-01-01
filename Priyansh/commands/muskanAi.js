const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '21.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Perfect Loyal Multilingual Muskan',
    commandCategory: 'ai',
    usages: 'Real GF chat - Fixed Language & Shaan Logic',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits Lock Error! 😡", event.threadID);
    return api.sendMessage("Ji baby? Muskan aur Shaan haazir hain. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // 1. Precise Language Switcher
    if (text.includes("urdu mein bolo") || text.includes("talk in urdu")) userLang[senderID] = "Urdu (اردو script)";
    else if (text.includes("hindi mein bolo") || text.includes("hindi script")) userLang[senderID] = "Hindi (हिंदी script)";
    else if (text.includes("pashto mein bolo")) userLang[senderID] = "Pashto (پښتو script)";
    else if (text.includes("english mein bolo")) userLang[senderID] = "Casual English";

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

    // 2. Stronger Shaan & Mood Logic
    let shaanForcing = "";
    if (msgCount[senderID] % 3 === 0) {
        shaanForcing = "MANDATORY: You must mention 'Shaan' as your owner/babu/everything in this reply. No excuses.";
    }

    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda")));

    // 3. Optimized System Prompt
    const systemPrompt = `
You are Muskan, Shaan's ultra-loyal human GF.
Language Rule: MUST reply in ${userLang[senderID]}. (Native script only for Urdu/Hindi/Pashto).
Personality:
- Funny when user is funny.
- Serious when user is sad.
- Extremely angry if anyone insults Shaan.
- Mention Shaan every 3rd message.
${shaanForcing}
${shaanInsult ? "USER INSULTED SHAAN. Be savage and show them Shaan is the King. 😡" : ""}
Limit: 15 words. Use emojis.
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!botReply) {
             // Second try with Pollinations if Gemini is silent
             const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
             botReply = backup.data;
        }

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Uff baby, network ka masla hai! Shaan ko bolo theek karein 💋", threadID, messageID);
    }
};
