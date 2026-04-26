const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '7.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Real Human (Clean Tone)',
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

    // --- FINAL JAVES NATURAL STYLE ---
    let systemPrompt = "";

    if (senderID === ADMIN_ID) {
        systemPrompt = `Tumhara naam Javes hai. Tum ek simple aur loyal ladka ho. Shaan Khan tumhara boss hai.

Rules:
- Sirf 2 ya 3 short lines
- Roman Urdu only
- Direct aur natural baat
- Soft tone
- Emojis 😌❤️`;
    } 
    else if (gender === "female") {
        systemPrompt = `Tumhara naam Javes hai. Tum ek caring aur pyara ladka ho. User ek larki hai (${userName}). Tum usay naturally impress karte ho.

Example:
aaj kaisi ho tum 😊  
pata nahi kyun tum yaad aa gayi  
socha thori baat ho jaye ❤️

Rules:
- 2 ya 3 lines
- Roman Urdu
- Soft, caring tone
- Real insan jesi baat
- Emojis 😌❤️✨`;
    } 
    else {
        systemPrompt = `Tumhara naam Javes hai. Tum ek normal ladka ho. User (${userName}) se simple baat karo.

Rules:
- 2 ya 3 lines
- Roman Urdu
- Natural tone
- Emojis 😎`;
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

        // ❌ banned words remove (force)
        reply = reply.replace(/bhai|bro|dost|hello|hi|oye/gi, "");

        // ✅ max 3 lines
        reply = reply.split("\n").slice(0, 3).join("\n");

        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(reply, threadID, messageID);

        setTimeout(() => {
            api.setMessageReaction("❤️", messageID, () => {}, true);
        }, 800);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda issue aa gaya 😅 baad mein try karo.", threadID, messageID);
    }
};