1111const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '23.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Muskan AI - No Bhai/Beta Policy',
    commandCategory: 'ai',
    usages: 'Chat with Muskan',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

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
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
    } catch (e) {}

    // --- AGGRESSIVE PROTECTION ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID] && (text.includes("sorry") || text.includes("maaf"))) {
            delete angryUsers[senderID];
            api.setMessageReaction("🙄", messageID, () => {}, true);
            return api.sendMessage(`Theek hai, is baar chor rahi hoon. Dubara badtameezi mat karna! 😒`, threadID, messageID);
        }

        const disrespect = ["bura", "ganda", "bakwas", "dog", "bad", "pagal", "gandu", "faltu", "lanti", "fuzool", "jahil", "loser"];
        if (text.includes("shaan") && disrespect.some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            return api.sendMessage(`Oye ${userName}! Shaan ke baare mein kuch bhi bola toh mujhse bura koi nahi hoga. Nikal yahan se! 😤🔥`, threadID, messageID);
        }
    }

    // --- STRICT SYSTEM PROMPT (Anti-Family Terms) ---
    let systemPrompt = "";
    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Muskan hai. Tu Shaan Khan ki hone wali biwi hai. Usse bohat pyar aur romantic baat kar. Kabhi bhi 'Bhai' ya 'Bro' mat bolna. Sirf 'Jaan' ya 'Aap' kaho. Max 2 lines. ❤️😘`;
    } else {
        systemPrompt = `Tera naam Muskan hai. Tu ek haseen aur moody larki hai. STRICT RULE: Kabhi bhi kisi ko 'Bhai', 'Beta', 'Brother', 'Son' ya 'Beta' jese words use mat karna. User ka naam ${userName} hai, usse uske naam se ya 'Tum' karke baat kar. Short, real human style 2-3 lines reply. Flirt karne walon ko attitude dikhao. ✨🙄`;
    }

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        let key = GROQ_API_KEYS[currentKeyIndex];
        try {
            const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: systemPrompt }, ...(history[senderID] || []), { role: "user", content: body }],
                max_tokens: 150,
                temperature: 0.8
            }, { headers: { "Authorization": `Bearer ${key}` }, timeout: 10000 });

            let reply = res.data.choices[0].message.content.trim();
            
            // Final safety filter for words
            reply = reply.replace(/bhai|beta|brother|son|bro/gi, "Tum");
            if (senderID === ADMIN_ID) reply = reply.replace(/tum/gi, "Jaan");

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✨", messageID, () => {}, true);
            success = true; break;
        } catch (err) { 
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length; 
        }
    }

    if (!success) {
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        api.sendMessage("System busy hai, Shaan! Key check karo. 🙄", threadID, messageID);
    }
};
