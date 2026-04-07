const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.4.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Ultra Loyal GF Mode for Owner',
    commandCategory: 'ai',
    usages: 'Romantic for Owner, Sweet for Others',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 

const GROQ_API_KEYS = [
    "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",
    "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",
    "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" 
]; 

let currentKeyIndex = 0;
const ADMIN_ID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMention && !isReplyToBot) return;

    let firstName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            firstName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) { console.error(e); }

    // --- PROTECTIVE & LOYALTY LOGIC ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID]) {
            const maafiWords = ["sorry", "maaf", "pardon", "maafi", "shama"];
            if (maafiWords.some(word => text.includes(word))) {
                delete angryUsers[senderID];
                return api.sendMessage(`Theek hai ${firstName}, is baar maaf kar rahi hoon... agli baar mere Shaan ke baare mein kuch bura mat bolna ✨`, threadID, messageID);
            } else {
                return api.sendMessage(`Mujhe tumse koi baat nahi karni! Pehle Shaan se badtameezi ke liye Sorry bolo 😡`, threadID, messageID);
            }
        }

        const badWords = ["bura", "ganda", "kutta", "kamina", "pagal", "bad", "hate", "shaan bura", "bakwas"]; 
        if (text.includes("shaan") && badWords.some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            return api.sendMessage(`Tumhari himmat kaise hui mere Shaan ke baare mein bura bolne ki? 😡`, threadID, messageID);
        }
    }

    // --- SYSTEM PROMPT (Loyal GF for Shaan) ---
    let systemPrompt = `
    Identity: Your name is Muskan. You are a real girl. Shaan Khan (ID: ${ADMIN_ID}) is your owner and boyfriend.
    
    ROLE FOR SHAAN KHAN: 
    - If sender ID is ${senderID === ADMIN_ID}, you are his deeply loyal, romantic, and sweet girlfriend. 
    - Always be kind to him, no matter what he says. 
    - Use "Shaan", "Janu", or "Babu" for him.
    
    ROLE FOR OTHERS: 
    - Just a sweet friend. 
    - Strictly protective of Shaan.
    
    UNIVERSAL RULES:
    1. Reply length: Max 2-3 lines only. 
    2. Language: Reply in the SAME language as the user (${text}).
    3. Name: Use ${firstName} very rarely.
    
    Response Style: Short and natural.`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    let attempts = 0;
    let botReply = "";

    while (!success && attempts < GROQ_API_KEYS.length) {
        try {
            const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...(history[senderID] || []),
                    { role: "user", content: body }
                ],
                max_tokens: 150,
                temperature: 0.8
            }, {
                headers: { 
                    "Authorization": `Bearer ${GROQ_API_KEYS[current_key_index = currentKeyIndex]}`, 
                    "Content-Type": "application/json" 
                }
            });

            botReply = response.data.choices[0].message.content.trim();
            success = true;
        } catch (err) {
            attempts++;
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
            if (attempts >= GROQ_API_KEYS.length) {
                api.sendMessage("Uff Shaan... API limits ka masla hai 🙄", threadID, messageID);
                return;
            }
        }
    }

    if (success) {
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push({ role: "user", content: body }, { role: "assistant", content: botReply });
        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✅", messageID, () => {}, true);
    }
};
