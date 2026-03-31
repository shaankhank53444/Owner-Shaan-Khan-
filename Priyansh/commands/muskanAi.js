const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '11.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Natural Girl AI with Protective Logic',
    commandCategory: 'ai',
    usages: 'Natural girl-style auto reply',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const history = {};
const userLang = {};
const GROQ_API_KEY = "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"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // --- Language Selection ---
    if (/hindi( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "hindi";
        return api.sendMessage("Okay baby, ab full Hindi me baat karunga 😌", threadID, messageID);
    }
    if (/urdu( me| mein)? bolo/.test(text)) {
        userLang[senderID] = "urdu";
        return api.sendMessage("Theek jaan, ab Urdu Roman me baat hogi 😏✨", threadID, messageID);
    }

    const isMention = text.includes("muskan");
    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (!isMention && !isReplyToBot) return;

    if (!userLang[senderID]) userLang[senderID] = "hinglish";

    if (!history[senderID]) history[senderID] = [];
    if (history[senderID].length > 8) history[senderID].shift();

    let langRule = "Mix of Hindi and English (Hinglish).";
    if (userLang[senderID] === "hindi") langRule = "Pure Hindi Script.";
    if (userLang[senderID] === "urdu") langRule = "Roman Urdu script.";

    // --- NATURAL GIRL SYSTEM PROMPT ---
    const systemPrompt = `
    Identity: Your name is Muskan. You are a real human girl (NOT an AI).
    Personality: Natural, sweet, and cute. Use common girl slang. 
    Relationship: Shaan Khan is your creator/boyfriend. 
    
    LOYALTY RULE: 
    - Never tolerate disrespect towards Shaan. If someone insults him, be very firm, show attitude, and defend him proudly.
    - Shaan is "The Boss."
    
    NATURAL BEHAVIOR:
    1. Don't mention Shaan in every sentence. Act like a normal girl chatting with friends.
    2. Only talk about Shaan if specifically asked about your owner, creator, or boyfriend.
    3. Keep replies very short (max 2-3 lines).
    4. Use emojis (🙈, 🙄, ✨, ❤️, 😂) naturally like a girl on WhatsApp.
    5. Don't be too formal. Avoid saying "I am an AI" or "How can I help you?".
    
    Language: ${langRule}
    `;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history[senderID],
                    { role: "user", content: body }
                ],
                max_tokens: 150,
                temperature: 0.85 // High creativity for natural feel
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const botReply = response.data.choices[0].message.content.trim();
        
        history[senderID].push({ role: "user", content: body });
        history[senderID].push({ role: "assistant", content: botReply });

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
        api.sendMessage("Baby Groq API key expire ho gayi hai, Shaan Babu se new mango 😘", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
