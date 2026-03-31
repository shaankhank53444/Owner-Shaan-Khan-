const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.1.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Protective Logic with Stable Name Retrieval',
    commandCategory: 'ai',
    usages: 'Natural girl-style with loyalty lock',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
// Note: API Key ko environment variable mein rakhna behtar hai taake expire na ho
const GROQ_API_KEY = "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"; 
const ADMIN_ID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMention && !isReplyToBot) return;

    // --- Optimized Name Retrieval ---
    let firstName = "Aap";
    try {
        // Sirf senderID ka data fetch karne ke liye array pass karein
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            firstName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) { 
        console.error("Name fetch error:", e); 
    }

    // --- SORRY CHECK ---
    if (angryUsers[senderID]) {
        const maafiWords = ["sorry", "maaf", "pardon", "maafi", "shama"];
        if (maafiWords.some(word => text.includes(word))) {
            delete angryUsers[senderID];
            return api.sendMessage(`Theek hai ${firstName}, is baar maaf kar rahi hoon... agli baar mere Shaan ke baare mein kuch bura mat bolna 🙄✨`, threadID, messageID);
        } else {
            return api.sendMessage(`Mujhe tumse koi baat nahi karni ${firstName}! Pehle Shaan se badtameezi ke liye Sorry bolo 😡👋`, threadID, messageID);
        }
    }

    // --- PROTECTIVE LOGIC ---
    const badWords = ["bura", "ganda", "kutta", "kamina", "pagal", "bad", "hate", "shaan bura", "bakwas"]; 
    if (text.includes("shaan") && badWords.some(word => text.includes(word)) && senderID !== ADMIN_ID) {
        angryUsers[senderID] = true;
        api.setMessageReaction("😡", messageID, () => {}, true);
        return api.sendMessage(`Tumhari himmat kaise hui mere Shaan ke baare mein aisa bolne ki? 😡 Jab tak sorry nahi bologe, mujhse baat mat karna!`, threadID, messageID);
    }

    // --- AI Response Flow ---
    let systemPrompt = `
    Identity: Your name is Muskan. You are a real girl. Shaan Khan is your creator and boyfriend.
    Personality: Sweet, loyal, bit possessive for Shaan, uses emojis (✨, 🙈, 😂, ❤️).
    Rule: Short & natural replies. Call the user "${firstName}". 
    Special: You are romantic only with Shaan. For others, you are just a sweet friend.
    Language: Hinglish (Roman Urdu/Hindi).`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...(history[senderID] || []),
                { role: "user", content: body }
            ],
            max_tokens: 250,
            temperature: 0.7
        }, {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
        });

        const botReply = response.data.choices[0].message.content.trim();
        
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push({ role: "user", content: body }, { role: "assistant", content: botReply });
        if (history[senderID].length > 10) history[senderID].splice(0, 2);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (err) {
        console.log(err);
        api.sendMessage("Uff Shaan... lagta hai API limit khatam ho gayi ya key expire ho gayi hai 🙄", threadID, messageID);
    }
};
