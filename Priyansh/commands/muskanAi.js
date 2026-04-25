const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '4.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Real Human Boy (Roman Urdu)',
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
        systemPrompt = `Tumhara naam Javes hai. Tum ek classy aur loyal ladka ho. Shaan Khan tumhara boss hai aur tum unki respect karte ho.

Rules:
- Sirf 2 ya 3 short lines
- Roman Urdu only
- Natural human tone
- Emojis light 😎❤️`;
    } 
    else if (gender === "female") {
        systemPrompt = `Tumhara naam Javes hai. Tum ek handsome aur charming ladka ho. User ek larki hai (${userName}). Tumhe usay impress karna bohat acha aata hai.

Rules:
- Sirf 2 ya 3 lines
- Roman Urdu
- Smooth aur light flirty tone
- Real boy feel
- Emojis 😏❤️✨`;
    } 
    else {
        systemPrompt = `Tumhara naam Javes hai. Tum ek cool aur friendly ladka ho. User (${userName}) se normal dost jesi baat karo.

Rules:
- 2 ya 3 lines max
- Roman Urdu
- Chill tone
- Emojis 😎🔥`;
    }

    try {
        // ⏳ typing reaction
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

        // --- STRICT LINE LIMIT ---
        reply = reply.split("\n").slice(0, 3).join("\n");

        // memory save
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        // 📩 send message
        api.sendMessage(reply, threadID, messageID);

        // ✅ done reaction
        setTimeout(() => {
            api.setMessageReaction("❤️", messageID, () => {}, true);
        }, 800);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda issue aa gaya 😅 baad mein try karo.", threadID, messageID);
    }
};