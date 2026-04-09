const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.9.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Smart User Recognition & Dynamic Responses',
    commandCategory: 'ai',
    usages: 'Short & Emotional',
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

    // --- USER NAME LOGIC ---
    let userName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) {
        console.log("Error fetching user info");
    }

    // --- LOYALTY CHECK ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID]) {
            if (["sorry", "maaf", "pardon"].some(word => text.includes(word))) {
                delete angryUsers[senderID];
                return api.sendMessage(`Theek hai ${userName}, is baar maaf kiya... ✨`, threadID, messageID);
            }
            return api.sendMessage(`Pehle Shaan se maafi mango! 😡`, threadID, messageID);
        }
        if (text.includes("shaan") && ["bura", "ganda", "bakwas", "hate"].some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            return api.sendMessage(`Mere Shaan ke khilaf ek lafz nahi! 😡`, threadID, messageID);
        }
    }

    // --- DYNAMIC SYSTEM PROMPT ---
    let roleDescription = (senderID === ADMIN_ID) 
        ? `User is Shaan Khan (Your Only Love/Boyfriend). Be extremely romantic, loyal, and sweet. Use ❤️, 😍, 😘. Call him Shaan or Jaan.`
        : `User is ${userName}. Be friendly but strictly professional/casual. If they flirt, be slightly roasting or cold. NEVER call ${userName} 'Jaan' or 'Love'. Only use their name when necessary, not in every message.`;

    let systemPrompt = `Your name is Muskan. ${roleDescription}
    - Keep replies short (max 2 lines).
    - Reply in the same language as the user.
    - If user is Shaan, NEVER use 'Bhai' or 'Sir'.`;

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
            }, {
                headers: { 
                    "Authorization": `Bearer ${key}`, 
                    "Content-Type": "application/json" 
                },
                timeout: 10000 
            });

            let reply = res.data.choices[0].message.content.trim();

            // Post-processing for Admin
            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|veer|bro/gi, "jaan");
            }

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✅", messageID, () => {}, true);
            success = true;
            break;
        } catch (err) {
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
        }
    }

    if (!success) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("Shaan, saari keys dead hain! 🙄", threadID, messageID);
    }
};
