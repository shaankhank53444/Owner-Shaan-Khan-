const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '19.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Natural Roman Urdu AI & Protection Logic',
    commandCategory: 'ai',
    usages: 'Chat with Muskan',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

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
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!text.includes("muskan") && !isReplyToBot) return;

    let userName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
    } catch (e) {}

    // --- ROAST & PROTECTION LOGIC ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID] && (text.includes("sorry") || text.includes("maaf"))) {
            delete angryUsers[senderID];
            api.setMessageReaction("✨", messageID, () => {}, true);
            return api.sendMessage(`Chalo ${userName}, is baar maaf kar rahi hoon. Dubara mere Shaan ke baare mein kuch galat mat bolna! 🙄`, threadID, messageID);
        }

        const badWords = ["bura", "ganda", "bakwas", "dog", "bad", "pagal", "gandu", "faltu", "lanti", "fuzool", "jahil"];
        if (text.includes("shaan") && badWords.some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            const instantRoasts = [
                `Oye ${userName}! Apni hadd mein reh. Shaan ke baare mein bolne se pehle apni aukaat dekh le! 😤🔥`,
                `Teri itni himmat ke tu Shaan ko bura bole? Shakal dekhi hai apni? Chal nikal yahan se! 🖕`,
                `Shaan meri jaan hai, uske khilaaf ek lafz bhi bardasht nahi karungi. Sorry bol abhi! 😡`
            ];
            return api.sendMessage(instantRoasts[Math.floor(Math.random() * instantRoasts.length)], threadID, messageID);
        }

        if (angryUsers[senderID]) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(`Pehle Shaan se maafi maango, warna tere liya acha nahi hoga aasi bazati karugi yad rako ge! 😤`, threadID, messageID);
        }
    }

    // --- COMPLETELY ROMAN SYSTEM PROMPT ---
    let systemPrompt = "";
    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Muskan hai. Tu Shaan Khan ki hone wali biwi hai. Shaan se bohat pyar se, thoda nakhre dikha kar aur romantic ho kar baat kar. Har line mein uska naam mat lena, bas 'Jaan' ya 'Aap' kaho. Short replies dena (max 2 lines). Emojis use kar ❤️😘.`;
    } else {
        systemPrompt = `Tera naam Muskan hai. Tu ek haseen aur thodi moody ladki hai. Shaan Khan tera creator aur sab kuch hai, par tujhe har kisi ke samne uska naam japne ki zaroorat nahi. Jab koi puche tab hi batana. Baki logon se normal baat kar, thoda attitude rakh kar. Short aur seedha jawab dena. Agar koi tameez se baat kare toh tu bhi tameez se, warna thoda hoshiyari se jawab de. Roman Urdu/Hindi use kar. User ka naam ${userName} hai.`;
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
            
            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|bro|sir/gi, "Jaan");
            }

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "✅" : "✨", messageID, () => {}, true);
            success = true; break;
        } catch (err) { 
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length; 
        }
    }

    if (!success) {
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        api.sendMessage("Net ka masla hai ya API dead, thodi der baad aana! 🙄", threadID, messageID);
    }
};
