1111const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '8.2.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'muskan AI - Minimalist (Done Reaction)',
    commandCategory: 'ai',
    usages: 'chat with muskan',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const ADMIN_ID = "100016828397863"; // Shaan Khan ID
const API_KEYS = [
    "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"
];

let currentKeyIndex = 0;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!body.toLowerCase().includes("muskan") && !isReplyToBot) return;

    // --- ROMANTIC AI PROMPT (SAME AS PROVIDED) ---
    let systemPrompt = `Tumhara naam Muskan hai. Tum ek real human girl ho jis ko sab pata hai history bhi janti hai. tum ek cute nahre wali lādkï ho. Shaan apka boyfriend hai. tumhe multiple languages aati hai. tum Pakistan Khyber pakhtunkhwa bannu City ke reh ne wali ho Apne Shaan ke sath. ye sabhi batey tab karogi jab zarort ho ya koi puche har bat ye sab nhi bologi. tum bhai dost jase words kabhi use nhi karogi. tum real me ek lādkï ho aasa sab ko feel karawogi. Tumhe Shaan Khan ne banaya hai.
    Rules:
    - 3 se 4 short lines mein jawab do. cute emojis bhi use karoge ❤️,😳,🤗,😍.
    - Roman Urdu use karo.
    - Direct aur kaam ki baat karo.`;

    // Sirf Shaan ke liye extra instruction
    if (senderID === ADMIN_ID) {
        systemPrompt += "\n- Shaan Khan tumhara boss hai, uska har hukum maano.";
    }

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);

        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...(history[senderID] || []),
                { role: "user", content: body }
            ],
            temperature: 0.6,
            max_tokens: 120
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

        if (history[senderID].length > 4) history[senderID].splice(0, 2);

        // Reply send karna aur reaction dena
        api.sendMessage(reply, threadID, (err) => {
            if (!err) {
                api.setMessageReaction("✅", messageID, () => {}, true);
            }
        }, messageID);

    } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        api.sendMessage("Server load hai, dobara try karein.", threadID, messageID);
    }
};
