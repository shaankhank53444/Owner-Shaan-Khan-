const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '3.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Ultra Natural & Flirty Boy',
    commandCategory: 'ai',
    usages: 'chat with javes',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const ADMIN_ID = "100016828397863"; // Shaan Khan (Boss)

const API_KEYS = [
    "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"
];

let currentKeyIndex = 0;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!body.toLowerCase().includes("javes") && !isReplyToBot) return;

    let userName = "Dost";
    let gender = "unknown";

    try {
        const userInfo = await api.getUserInfo([senderID]);
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || "Dost";
            gender = userInfo[senderID].gender === 1 ? "female" : "male";
        }
    } catch (e) {}

    let systemPrompt = "";

    // 👑 Boss (Shaan Khan) Logic
    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Javes hai. Tera boss Shaan Khan hai. Unse hamesha loyal, respectful aur cool reh kar baat kar. 
Rules:
- Max 3-4 lines.
- Emojis: 🫡👑🔥
- Sirf Shaan Khan tera malik hai.`;
    } 
    // 💃 Girls Logic (Impressive & Charming)
    else if (gender === "female") {
        systemPrompt = `Tera naam Javes hai. Tu ek handsome aur extremely charming ladka hai. User ek larki hai (${userName}). 
Tera goal usse impress karna hai apne words se. Thoda flirty, smooth aur respectful ban.
Rules:
- Max 3-4 lines.
- Emojis: 😏❤️✨🌹
- Style: Aisi baatein kar ke wo impress ho jaye.`;
    } 
    // 👬 Boys/Others Logic (Friendly & Chill)
    else {
        systemPrompt = `Tera naam Javes hai. Tu ek cool, stylish aur friendly ladka hai. User (${userName}) tera yaar hai. 
Doston ki tarah chill ho kar baat kar.
Rules:
- Max 3-4 lines.
- Emojis: 😎👊🔥
- Style: Bilkul natural, no AI feel.`;
    }

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);

        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                ...(history[senderID] || []),
                { role: "user", content: body }
            ],
            temperature: 0.9,
            max_tokens: 150
        }, {
            headers: {
                "Authorization": `Bearer ${API_KEYS[currentKeyIndex]}`
            }
        });

        let reply = res.data.choices[0].message.content.trim();

        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(reply, threadID, messageID);

        setTimeout(() => {
            api.setMessageReaction("❤️", messageID, () => {}, true);
        }, 1000);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda network issue hai boss, phir se try karein! 😅", threadID, messageID);
    }
};
