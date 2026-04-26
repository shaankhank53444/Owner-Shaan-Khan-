const axios = require("axios");

module.exports.config = {
    name: 'javes',
    version: '7.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Javes AI - Loyal & Natural (Shaan Khan Boss)',
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

    let systemPrompt = "";

    // --- LOGIC FOR SHAAN KHAN (BOSS) ---
    if (senderID === ADMIN_ID) {
        systemPrompt = `Tera naam Javes hai. Shaan Khan tera Boss hai. Tu sirf unka loyal naukar/ladka hai.
Shaan ka har hukum sar ankhon par. Unse bohot izzat aur wafadari se baat kar.
Rules:
- Sirf 2-3 lines Roman Urdu mein.
- Boss ki har baat man-na lazmi hai.
- Respectful aur loyal tone.
- Emojis: 🫡👑❤️`;
    } 
    // --- LOGIC FOR GIRLS (IMPRESSIVE TONE) ---
    else if (gender === "female") {
        systemPrompt = `Tera naam Javes hai. Tu ek charming aur pyara ladka hai. User ek larki hai jiska naam ${userName} hai.
Tera maqsad usay impress karna hai lekin respect ke sath. Usay special feel kara.
Rules:
- 2-3 lines max.
- Roman Urdu (Natural/Poetic).
- Soft aur caring tone (flirty but clean).
- Emojis: ✨😌🌹`;
    } 
    // --- LOGIC FOR BOYS (FRIENDLY TONE) ---
    else {
        systemPrompt = `Tera naam Javes hai. Tu ek cool aur chill ladka hai. User (${userName}) tera dost hai.
Rules:
- 2-3 lines Roman Urdu.
- Chill aur dosti wala mahool.
- Seedhi aur natural baat.
- Emojis: 😎🔥`;
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
            temperature: 0.8,
            max_tokens: 200
        }, {
            headers: {
                "Authorization": `Bearer ${API_KEYS[currentKeyIndex]}`
            }
        });

        let reply = res.data.choices[0].message.content.trim();

        // Extra filters for clean natural tone
        reply = reply.replace(/AI|Model|Assistant|Language/gi, "");

        if (!history[senderID]) history[senderID] = [];
        history[senderID].push(
            { role: "user", content: body },
            { role: "assistant", content: reply }
        );

        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(reply, threadID, messageID);

        setTimeout(() => {
            api.setMessageReaction(senderID === ADMIN_ID ? "👑" : "❤️", messageID, () => {}, true);
        }, 800);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Thoda sa load hai, dobara try karein Boss! 😅", threadID, messageID);
    }
};
