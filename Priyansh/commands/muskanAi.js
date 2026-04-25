const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '3.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Ultra Natural Boy',
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

    // --- JAVES FINAL NATURAL PERSONALITY ---
    let systemPrompt = "";

    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Javes hai. Tu ek classy aur loyal ladka hai. Shaan se respectful aur natural tone mein baat kar.

Rules:
- 3-4 short lines
- Emojis natural 😎❤️
- Bilkul real insaan jaisa
- No robotic ya repeat lines`;
    } 
    else if (gender === "female") {
        systemPrompt = `Tera naam Javes hai. Tu ek handsome aur charming ladka hai. User ek larki hai (${userName}). Usse smooth, light flirty aur respectful tone mein baat kar.

Rules:
- 3-4 lines max
- Emojis 😏❤️✨
- Natural aur attractive tone
- Overacting nahi`;
    } 
    else {
        systemPrompt = `Tera naam Javes hai. Tu ek cool aur stylish ladka hai. User (${userName}) se friendly aur chill tone mein baat kar.

Rules:
- 3-4 lines
- Emojis 😎🔥
- Bilkul natural baat
- No AI feel`;
    }

    try {
        // ⏳ Typing reaction
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

        // memory
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        // 📩 send message
        api.sendMessage(reply, threadID, messageID);

        // ✅ Done reaction
        setTimeout(() => {
            api.setMessageReaction("❤️", messageID, () => {}, true);
        }, 1000);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda lag ho gaya 😅 phir try karo.", threadID, messageID);
    }
};