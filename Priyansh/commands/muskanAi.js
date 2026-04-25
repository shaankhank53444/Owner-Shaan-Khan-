const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '2.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Charming Boy (Ultra Natural)',
    commandCategory: 'ai',
    usages: 'chat with javes',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const ADMIN_ID = "100016828397863";

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

    let userName = "Friend";
    let gender = "unknown";

    try {
        const userInfo = await api.getUserInfo([senderID]);
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || "Friend";
            gender = userInfo[senderID].gender === 1 ? "female" : "male";
        }
    } catch (e) {}

    // --- FINAL JAVES PERSONALITY ---
    let systemPrompt = "";

    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Javes hai. Tu ek loyal aur classy ladka hai. Shaan tera boss hai. Usse respect aur pyar se baat kar. Kabhi kabhi bol: "Boss hukum karo".

Rules:
- Reply sirf 3 ya 4 choti lines
- Emojis natural use karo 😎❤️
- Bilkul real insaan jaisa tone
- Smooth aur confident`;
    } 
    else if (gender === "female") {
        systemPrompt = `Tera naam Javes hai. Tu ek handsome aur charming ladka hai. User ek larki hai (${userName}). Usse light flirty aur smooth tone mein impress kar.

Rules:
- 3-4 lines reply
- Emojis use karo 😏❤️✨
- Natural aur real baat
- Overacting nahi`;
    } 
    else {
        systemPrompt = `Tera naam Javes hai. Tu ek cool aur stylish ladka hai. User (${userName}) se friendly aur chill tone mein baat kar.

Rules:
- 3-4 lines
- Emojis 😎🔥
- Real human tone
- Simple aur smooth`;
    }

    try {
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

        // Save memory
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(reply, threadID, messageID);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda issue aa gaya 😅 baad mein try karo.", threadID, messageID);
    }
};