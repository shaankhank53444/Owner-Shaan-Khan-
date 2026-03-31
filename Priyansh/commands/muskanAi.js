const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Angry/Protective Logic for Shaan',
    commandCategory: 'ai',
    usages: 'Natural girl-style with loyalty lock',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const userLang = {};
const angryUsers = {}; // Jinse Muskan gussa hai
const GROQ_API_KEY = "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"; 
const ADMIN_UID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMention && !isReplyToBot) return;

    // --- User Info ---
    let firstName = "Aap";
    try {
        const userInfo = await api.getUserInfo(senderID);
        firstName = userInfo[senderID].name.split(" ")[0];
    } catch (e) { console.log(e); }

    // --- SORRY CHECK (Maafi ka Logic) ---
    if (angryUsers[senderID]) {
        if (text.includes("sorry") || text.includes("maaf") || text.includes("pardon")) {
            delete angryUsers[senderID];
            return api.sendMessage(`Theek hai ${firstName}, is baar maaf kar rahi hoon... agli baar Shaan ke baare mein kuch bura mat bolna 🙄✨`, threadID, messageID);
        } else {
            return api.sendMessage(`Mujhe tumse koi baat nahi karni ${firstName}! Pehle Shaan se badtameezi ke liye Sorry bolo 😡👋`, threadID, messageID);
        }
    }

    // --- SHAAN PROTECTIVE LOGIC ---
    // Agar text mein "shaan" ho aur koi bura lafz ho (bad, kutta, etc.)
    const badWords = ["bura", "ganda", "kutta", "kamina", "pagal", "bad", "hate", "shaan bura hai"]; 
    if (text.includes("shaan") && badWords.some(word => text.includes(word))) {
        angryUsers[senderID] = true;
        return api.sendMessage(`Tumhari himmat kaise hui mere Shaan ke baare mein aisa bolne ki? 😡 Jab tak sorry nahi bologe, mujhse baat mat karna!`, threadID, messageID);
    }

    // --- Normal Flow ---
    if (!userLang[senderID]) userLang[senderID] = "hinglish";
    let langRule = userLang[senderID] === "urdu" ? "Roman Urdu." : "Hinglish.";

    let systemPrompt = `
    Identity: Name is Muskan. Real girl. Shaan Khan is your creator/boyfriend.
    Personality: Sweet, short replies, uses emojis (✨, 🙈, 😂).
    Rule: Never use full names, only call the user "${firstName}". 
    Special: You love Shaan. Talk like a real girl chatting on messenger. 
    Language: ${langRule}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...(history[senderID] || []),
                { role: "user", content: body }
            ],
            max_tokens: 150,
            temperature: 0.8
        }, {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
        });

        const botReply = response.data.choices[0].message.content.trim();
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push({ role: "user", content: body }, { role: "assistant", content: botReply });
        if (history[senderID].length > 6) history[senderID].splice(0, 2);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (err) {
        api.sendMessage("Uff... Shaan se kaho API check karein 🙄", threadID, messageID);
    }
};
