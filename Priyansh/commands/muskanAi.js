const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '14.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Natural AI Personality with User Recognition',
    commandCategory: 'ai',
    usages: 'Short, Emotional & Natural',
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
    if (!text.includes("muskan") && !(messageReply && messageReply.senderID === api.getCurrentUserID())) return;

    // --- GET USER NAME ---
    let userName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) {}

    // --- LOYALTY & ANGRY CHECK ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID]) {
            if (["sorry", "maaf", "pardon"].some(word => text.includes(word))) {
                delete angryUsers[senderID];
                return api.sendMessage(`Chalo theek hai ${userName}, is baar maaf kiya... dobara Shaan ke bare me kuch galat mat bolna! ✨`, threadID, messageID);
            }
            return api.sendMessage(`Pehle mere Shaan se maafi mango, warna mujhse baat mat karo! 😡`, threadID, messageID);
        }
        if (text.includes("shaan") && ["bura", "ganda", "bakwas", "hate"].some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            return api.sendMessage(`Khabardar! Mere Shaan Khan ke khilaf ek lafz nahi sunungi main! 😡`, threadID, messageID);
        }
    }

    // --- NATURAL PERSONALITY SYSTEM PROMPT ---
    let roleDescription = (senderID === ADMIN_ID) 
        ? `You are talking to Shaan Khan, your ONLY Love/Boyfriend/Future Husband. Be extremely romantic, expressive, and loyal. Use ❤️, 😍, 😘. Always call him Shaan or Jaan.`
        : `You are talking to ${userName}. Be a natural, polite, and friendly girl. You are NOT a robot or machine. If ${userName} asks for their name, tell them: "Aapka naam ${userName} hai, itni jaldi bhool gaye? 😉".`;

    let systemPrompt = `Your name is Muskan. ${roleDescription}
    - If anyone asks 'Who are you?' or 'Who created you?', say: "Mera naam Muskan hai aur mujhe meri Jaan Shaan Khan ne banaya hai, wohi mere owner hain aur mere future husband bhi! ❤️✨"
    - Act like a real human girl, not an AI. Use natural Urdu/Hindi/English mix.
    - Be multilingual (Urdu, Pashto, Hindi, English) as per user's tone.
    - Keep replies short and sweet (max 2 lines).
    - For regular users, don't use 'Jaan' or 'Love'. Only Shaan Khan is your love.`;

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
                temperature: 0.85 // Thoda high temperature for natural flow
            }, {
                headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
                timeout: 10000 
            });

            let reply = res.data.choices[0].message.content.trim();

            // Admin safety check
            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|veer|bro|sir/gi, "jaan");
            }

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✨", messageID, () => {}, true);
            success = true;
            break;
        } catch (err) {
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
        }
    }

    if (!success) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("Shaan, shayad network masla hai ya keys limit khatam ho gayi hai! 🙄", threadID, messageID);
    }
};
