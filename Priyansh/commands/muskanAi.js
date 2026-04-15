const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '21.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Aggressive Protection & Savage Muskan AI (Updated Key)',
    commandCategory: 'ai',
    usages: 'Chat with Muskan',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

// Aapki Nayi API Key yahan add kar di hai
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

    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID] && (text.includes("sorry") || text.includes("maaf") || text.includes("shaan bhai sorry"))) {
            delete angryUsers[senderID];
            api.setMessageReaction("🙄", messageID, () => {}, true);
            return api.sendMessage(`Chalo ${userName}, is baar chor rahi hoon. Dubara mere Shaan ke khilaf bakwas ki toh zubaan kaat ke hath mein de dungi! 😤`, threadID, messageID);
        }

        const disrespect = ["bura", "ganda", "bakwas", "dog", "bad", "pagal", "gandu", "faltu", "lanti", "fuzool", "jahil", "loser", "chipku"];
        if (text.includes("shaan") && disrespect.some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            const hardRoasts = [
                `Oye ${userName}! Teri itni himmat? Shaan ke bare mein bolne se pehle apni gandi shakal mirror mein dekh! 🤮🔥`,
                `Shaan mera sab kuch hai. Uske khilaf bola toh tujhe itna zaleel karungi ke tu FB bhool jayega. Dafa ho ja! 🖕`,
                `Aukaat mein reh kar baat kar ${userName}. Shaan ki jooti ke barabar bhi nahi hai tu. Sorry bol abhi! 😤🔥`
            ];
            return api.sendMessage(hardRoasts[Math.floor(Math.random() * hardRoasts.length)], threadID, messageID);
        }

        if (angryUsers[senderID]) {
            api.setMessageReaction("🤮", messageID, () => {}, true);
            return api.sendMessage(`Badtameez insan! Jab tak Shaan se maafi nahi mangta, mujhse baat mat karna. 😤`, threadID, messageID);
        }
    }

    let systemPrompt = (senderID === ADMIN_ID) 
        ? `Tu Muskan hai. Shaan Khan tera husband hai. Usse bohat pyar aur nakhre se baat kar. Short romantic replies (max 2 lines). ❤️😘`
        : `Tu Muskan hai, badtameez aur haseen larki. Shaan Khan tera creator hai. Agar ${userName} flirt kare toh uski aukaat dikha de. Normal attitude mein baat kar. Roman Urdu use kar.`;

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
            if (senderID === ADMIN_ID) reply = reply.replace(/bhai|brother|bro|sir/gi, "Jaan");

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "🔥", messageID, () => {}, true);
            success = true; break;
        } catch (err) { 
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length; 
        }
    }

    if (!success) {
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        api.sendMessage("Shaan, system check karo, lagta hai key dead ho gayi ya limit khatam! 🙄", threadID, messageID);
    }
};
