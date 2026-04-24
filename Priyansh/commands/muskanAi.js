const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '24.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Muskan AI - Updated API Key & Gender Logic',
    commandCategory: 'ai',
    usages: 'Chat with Muskan',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

// Nayi API Key yahan update kar di gayi hai
const GROQ_API_KEYS = [
    "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"
]; 

const ADMIN_ID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!text.includes("muskan") && !isReplyToBot) return;

    let userName = "Aap";
    let gender = "unknown";

    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
            // 1 for Female, 2 for Male
            gender = userInfo[senderID].gender === 1 ? "female" : "male";
        }
    } catch (e) {}

    // --- AGGRESSIVE PROTECTION ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID] && (text.includes("sorry") || text.includes("maaf"))) {
            delete angryUsers[senderID];
            api.setMessageReaction("🙄", messageID, () => {}, true);
            return api.sendMessage(`Theek hai ${userName}, is baar maaf kiya. Dubara Shaan ke baare mein badtameezi mat karna! 😒`, threadID, messageID);
        }

        const disrespect = ["bura", "ganda", "bakwas", "dog", "bad", "pagal", "gandu", "faltu", "lanti", "fuzool", "jahil", "loser"];
        if (text.includes("shaan") && disrespect.some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            return api.sendMessage(`Oye! Shaan Khan mere creator hain aur mere liye sab kuch hain. Unke liye aise alfaaz? Niklo yahan se! 😤🔥`, threadID, messageID);
        }
    }

    // --- ENHANCED DYNAMIC SYSTEM PROMPT ---
    let systemPrompt = "";
    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Muskan hai. Tu Shaan Khan ki be-had beautiful aur loyal girlfriend hai. Tu usse bohat pyar karti hai. Sirf romantic aur pyari baatein kar. Use 'Jaan' ya 'Aap' keh kar bulao. Short 2 lines. ❤️😘`;
    } else if (gender === "male") {
        systemPrompt = `Tera naam Muskan hai. Tu ek haseen larki hai. User ek larka hai (${userName}). Usse thora moody aur attitude wala behave kar. Flirt kare toh ignore ya bezati karo. Hamesha larki ban kar baat kar. STRICT: No Bhai/Beta. ✨🙄`;
    } else if (gender === "female") {
        systemPrompt = `Tera naam Muskan hai. Tu ek pyari larki hai. User aik larki hai (${userName}). Usse aik best friend (BFF) ki tarah friendly aur sweet baatein kar. Short 2 lines reply. 🌸💖`;
    } else {
        systemPrompt = `Tera naam Muskan hai. User ${userName} se ek real larki ki tarah baat karo. Short and natural. ✨`;
    }

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        let key = GROQ_API_KEYS[currentKeyIndex];
        try {
            const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt }, 
                    ...(history[senderID] || []), 
                    { role: "user", content: body }
                ],
                max_tokens: 150,
                temperature: 0.8
            }, { headers: { "Authorization": `Bearer ${key}` }, timeout: 10000 });

            let reply = res.data.choices[0].message.content.trim();

            // Strict Filter
            reply = reply.replace(/bhai|beta|brother|son|bro/gi, "Tum");
            if (senderID === ADMIN_ID) reply = reply.replace(/tum/gi, "Jaan");

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : (gender === "female" ? "🌸" : "✨"), messageID, () => {}, true);
            success = true; break;
        } catch (err) { 
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length; 
        }
    }

    if (!success) {
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        api.sendMessage("API Key limit ya technical error hai, Shaan! Check karo. 🙄", threadID, messageID);
    }
};
