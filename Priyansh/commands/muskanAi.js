const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '17.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Ultra Short, Reaction Logic & Aggressive Roast',
    commandCategory: 'ai',
    usages: 'Short & Deadly',
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

    let userName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
    } catch (e) {}

    // --- AGGRESSIVE ROAST & REACTION LOGIC ---
    if (senderID !== ADMIN_ID) {
        if (angryUsers[senderID]) {
            if (["sorry", "maaf", "shaan bhai sorry"].some(word => text.includes(word))) {
                delete angryUsers[senderID];
                api.setMessageReaction("✨", messageID, () => {}, true);
                return api.sendMessage(`Chalo ${userName}, is baar maaf kiya. Agli baar mere Shaan ke khilaf bola toh zubaan khinch lungi! 😤✨`, threadID, messageID);
            }
            api.setMessageReaction("😡", messageID, () => {}, true);
            const roasts = [`Shaan se maafi mang warna dafa ho ja yahan se! 😡`, `Teri aukat nahi mujhse baat karne ki, nikal! 🤮`, `Mere Shaan ki burai karke khud ko bada samajhte ho? Gadhe! 🖕` ];
            return api.sendMessage(roasts[Math.floor(Math.random() * roasts.length)], threadID, messageID);
        }

        if (text.includes("shaan") && ["bura", "ganda", "bakwas", "dog", "bad", "pagal", "gandu", "faltu"].some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            api.setMessageReaction("😡", messageID, () => {}, true);
            return api.sendMessage(`Khabardar ${userName}! 😡 Mere Shaan ke liye ek ganda lafz bhi mat bolna. Ab nikal yahan se badtameez! 😤🔥`, threadID, messageID);
        }
    }

    // --- SYSTEM PROMPT ---
    let systemPrompt = (senderID === ADMIN_ID) 
        ? `You are Muskan. Talk to Shaan Khan (Your Future Husband). Be super romantic, sweet, and short. Max 2 lines. Use ❤️😘😍.`
        : `You are Muskan, a real girl. Shaan Khan is your owner & future husband. Tell ${userName} their name if asked. Be short (max 2 lines). Use emojis. Proudly take Shaan's name as your creator.`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        let key = GROQ_API_KEYS[currentKeyIndex];
        try {
            const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: systemPrompt }, ...(history[senderID] || []), { role: "user", content: body }],
                max_tokens: 100,
                temperature: 0.9
            }, { headers: { "Authorization": `Bearer ${key}` }, timeout: 10000 });

            let reply = res.data.choices[0].message.content.trim();
            if (senderID === ADMIN_ID) reply = reply.replace(/bhai|brother|bro|sir/gi, "jaan");

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 4) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "✅" : "✅", messageID, () => {}, true);
            success = true; break;
        } catch (err) { currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length; }
    }
    if (!success) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("Shaan, system busy hai ya keys dead! 🙄", threadID, messageID);
    }
};
