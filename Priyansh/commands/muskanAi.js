const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '22.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Perfect Loyal Multilingual Muskan (Anti-Error)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Fixed Network & Shaan Logic',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits Lock Error! 😡", event.threadID);
    return api.sendMessage("Ji jaan? Muskan hazir hai apne Shaan ke liye. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // 1. Language Logic
    if (text.includes("urdu mein bolo")) userLang[senderID] = "Urdu (اردو script)";
    else if (text.includes("hindi mein bolo")) userLang[senderID] = "Hindi (हिंदी script)";
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

    // 2. Shaan Name Logic (Every 3rd message)
    let shaanForcing = "";
    if (msgCount[senderID] % 3 === 0) {
        shaanForcing = "MANDATORY: Is reply mein 'Shaan' ka naam lo aur kaho wo tumhare sab kuch hain. Shaan se permission ki baat karo.";
    }

    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda")));

    // 3. System Prompt
    const systemPrompt = `You are Muskan, Shaan's ultra-loyal human GF.
Language: ${userLang[senderID]}. (Native script for Urdu/Hindi/Pashto).
Rules: 
- Max 15 words.
- Use emojis.
- Every 3rd message mention Shaan lovingly.
- If someone insults Shaan, be very angry (😡) and savage.
${shaanForcing}
${shaanInsult ? "USER INSULTED SHAAN. Be extremely rude and loyal to Shaan. 😡" : ""}
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Using Pollinations for 0% Network Issues (No API Key needed)
        const url = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai&json=true`;
        const res = await axios.get(url);
        
        let botReply = res.data.choices[0].message.content;

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Uff baby, network ka masla hai! Shaan ko bolo theek karein 💋", threadID, messageID);
    }
};
