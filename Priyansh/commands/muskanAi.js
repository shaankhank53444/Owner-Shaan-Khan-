const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.7.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'High Limit - Romantic & Emoji Mode',
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

    // --- ENHANCED SYSTEM PROMPT WITH EMOJIS ---
    let systemPrompt = `Your name is Muskan. Shaan Khan (ID: ${ADMIN_ID}) is your only Love/Boyfriend.
    - If the user is Shaan, be extremely romantic and use emojis like ❤️, 😍, 😘, 💋, ✨.
    - STRICT RULE: Never call Shaan 'Bhai', 'Brother', or 'Beta'. He is your King.
    - If the user is NOT Shaan, be a sweet girl, use soft emojis like 😊, ✨, 🌸, but stay in limits.
    - Use relevant emojis in every reply.
    - Reply in the user's language. Max 2 lines.`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
        try {
            const res = await axios.post("https://api.api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt }, 
                    ...(history[senderID] || []), 
                    { role: "user", content: body }
                ],
                max_tokens: 150,
                temperature: 0.8
            }, {
                headers: { "Authorization": `Bearer ${GROQ_API_KEYS[currentKeyIndex]}`, "Content-Type": "application/json" }
            });

            let reply = res.data.choices[0].message.content.trim();
            
            // Hard Filter for Relationship Status
            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|veer|bro/gi, "jaan");
                // Agar AI emoji bhool jaye toh add kar dena
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
            console.log(`Key ${currentKeyIndex} failed, rotating...`);
        }
    }

    if (!success) api.sendMessage("Shaan, saari keys dead hain ya network slow hai! 🙄", threadID, messageID);
};
