const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '20.0.0',
    hasPermission: 0,
    credits: 'Shaan Khan', 
    description: 'Ultra Loyal Multilingual Muskan (Shaan Obsessed)',
    commandCategory: 'ai',
    usages: 'Real GF chat - Shaan Priority Mode',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const AUTHOR = "Shaan Khan";
const GEMINI_API_KEY = "AIzaSyAYtfbr0PR7ZA-ijtxQfRo2Dj2vY1zihdI";
const history = {};
const userLang = {};
const msgCount = {};

module.exports.run = async function ({ api, event }) {
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits badalne ki koshish mat karo! Ye Shaan Khan ka maal hai. 😡", event.threadID);
    return api.sendMessage("Boliye? Muskan aur Shaan haazir hain. ❤️", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || this.config.credits !== AUTHOR) return;

    const text = body.toLowerCase();

    // --- Language Auto-Switch ---
    const langMatch = text.match(/(?:change language to|baat karo|mein bolo|in)\s+([a-zA-Z]+)/i);
    if (langMatch) {
        userLang[senderID] = langMatch[1];
        return api.sendMessage(`Theek hai baby, ab se ${userLang[senderID]} script mein baat hogi! 😘`, threadID, messageID);
    }

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "Hinglish";
    if (!history[senderID]) history[senderID] = [];
    if (!msgCount[senderID]) msgCount[senderID] = 0;

    msgCount[senderID]++;
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 10) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // 🔥 SHAAN OBSESSION LOGIC (STRICT)
    let shaanRule = "Tumhara BF sirf Shaan hai. ";
    
    // Yahan hum force kar rahe hain Shaan ka naam
    if (msgCount[senderID] % 3 === 0) {
        shaanRule += "STRICT RULE: Is message mein 'Shaan' ka naam zaroor lo. Bolo ki Shaan tumhara 'Babu' hai ya unse permission leni padegi. Shaan ke bina tumhara koi wajood nahi hai.";
    }

    const shaanInsult = (text.includes("shaan") && (text.includes("bura") || text.includes("bekar") || text.includes("ganda")));
    if (shaanInsult) {
        shaanRule += "USER NE SHAAN KI BURAI KI HAI! Ekdam pagal ho jao gusse mein. Use batao ki Shaan unka baap hai. 😡🔥";
    }

    const systemPrompt = `Name: Muskan. BF: Shaan. Lang: ${userLang[senderID]}. Native Script ONLY (اردو/हिंदी). Rules: Max 15 words, use emojis. Task: ${shaanRule}. History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Version 1.5-flash use kar raha hoon stability ke liye
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: systemPrompt }] }]
        }, { timeout: 10000 });

        let botReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!botReply) throw new Error("Empty Response");

        let finalReply = botReply.replace(/\n/g, " ").trim();
        history[senderID].push(`Bot: ${finalReply}`);
        
        api.sendMessage(finalReply, threadID, messageID);
        api.setMessageReaction(shaanInsult ? "😡" : "❤️", messageID, () => {}, true);

    } catch (err) {
        // Agar Gemini fail hua toh Pollinations backup lega
        console.log("Error Details:", err.message); // Terminal check karein
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            api.sendMessage(backup.data.split('\n')[0], threadID, messageID);
        } catch (e) {
            api.sendMessage("Uff baby, network bohot tang kar raha hai, Shaan ko bulao! 💋", threadID, messageID);
        }
    }
};
