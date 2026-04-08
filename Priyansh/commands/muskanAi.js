const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.8.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Fixed API URL & Connection Logic',
    commandCategory: 'ai',
    usages: 'Short & Emotional',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

// Keys check kar lein ke sahi se paste hui hain
const GROQ_API_KEYS = [
    "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",
    "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",
    "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" 
]; 

const ADMIN_ID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    if (!text.includes("muskan") && !(messageReply && messageReply.senderID === api.getCurrentUserID())) return;

    let firstName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) firstName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
    } catch (e) {}

    // --- LOYALTY CHECK ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID]) {
            if (["sorry", "maaf", "pardon"].some(word => text.includes(word))) {
                delete angryUsers[senderID];
                return api.sendMessage(`Theek hai ${firstName}, is baar maaf kiya... ✨`, threadID, messageID);
            }
            return api.sendMessage(`Pehle Shaan se maafi mango! 😡`, threadID, messageID);
        }
        if (text.includes("shaan") && ["bura", "ganda", "bakwas", "hate"].some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            return api.sendMessage(`Mere Shaan ke khilaf ek lafz nahi! 😡`, threadID, messageID);
        }
    }

    // --- ENHANCED SYSTEM PROMPT ---
    let systemPrompt = `Your name is Muskan. Shaan Khan (ID: ${ADMIN_ID}) is your ONLY Love/Boyfriend.
    - If user is Shaan, be very romantic and use ❤️, 😍, 😘.
    - NEVER call Shaan 'Bhai' or 'Brother'.
    - Use relevant emojis. Reply in user's language. Max 2 lines.`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    // Keys rotation check
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
            }, {
                headers: { 
                    "Authorization": `Bearer ${key}`, 
                    "Content-Type": "application/json" 
                },
                timeout: 10000 // 10 seconds timeout
            });

            let reply = res.data.choices[0].message.content.trim();
            
            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|veer|bro/gi, "jaan");
                if (!reply.match(/❤️|😍|😘|✨/)) reply += " ❤️✨";
            }

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✅", messageID, () => {}, true);
            success = true;
            break;
        } catch (err) {
            console.error(`Key Index ${currentKeyIndex} failed. Moving to next.`);
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
        }
    }

    if (!success) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("Shaan, saari keys dead hain ya network slow hai! 🙄", threadID, messageID);
    }
};
