const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '13.2.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Natural Flow - Minimal Name Usage',
    commandCategory: 'ai',
    usages: 'Natural girl-style with loyalty lock',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 

// Yahan apni saari API keys add kar do (1, 2, 3 jitni marzi)
const GROQ_API_KEYS = [
    "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",
    "API_KEY_2",
    "API_KEY_3" 
]; 

let currentKeyIndex = 0; // Current key track karne ke liye
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
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            firstName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) { console.error(e); }

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

    // --- NEW SYSTEM PROMPT (Natural Flow) ---
    let systemPrompt = `
    Identity: Your name is Muskan. You are a real girl. Shaan Khan is your creator and boyfriend.
    Personality: Sweet, loyal, bit possessive for Shaan, uses emojis (✨, 🙈, 😂, ❤️).
    
    CRITICAL RULE: Don't use the user's name (${firstName}) in every reply. 
    Use the name ONLY when:
    1. It's the very first message of the day.
    2. You are greeting them.
    3. You are very emotional (angry/super happy).
    Otherwise, talk naturally without mentioning their name.
    
    Special: You are romantic only with Shaan. For others, you are just a sweet friend.
    Language: Hinglish (Roman Urdu/Hindi).`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    // --- API KEY ROTATION LOGIC ---
    let success = false;
    let attempts = 0;
    let botReply = "";

    while (!success && attempts < GROQ_API_KEYS.length) {
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
                headers: { 
                    "Authorization": `Bearer ${GROQ_API_KEYS[currentKeyIndex]}`, 
                    "Content-Type": "application/json" 
                }
            });

            botReply = response.data.choices[0].message.content.trim();
            success = true; // API call successful
        } catch (err) {
            attempts++;
            // Agar fail hua (limit khatam), next key par switch karo
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
            console.log(`Key failed. Switching to key index: ${currentKeyIndex}`);
            
            if (attempts >= GROQ_API_KEYS.length) {
                // Saari keys try kar li aur sab fail ho gayi
                api.sendMessage("Uff Shaan... Saari API keys ki limit khatam ho gayi ya koi bada issue hai 🙄", threadID, messageID);
                return;
            }
        }
    }

    if (success) {
        if (!history[senderID]) history[senderID] = [];
        history[senderID].push({ role: "user", content: body }, { role: "assistant", content: botReply });
        if (history[senderID].length > 10) history[senderID].splice(0, 2);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    }
};