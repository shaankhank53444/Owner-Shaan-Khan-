const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '15.0.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Natural AI with Aggressive Roast Mode',
    commandCategory: 'ai',
    usages: 'Short, Emotional & Protective',
    cooldowns: 5,
    dependencies: { 'axios': '' }
};

const history = {};
const angryUsers = {}; 
let currentKeyIndex = 0;

const GROQ_API_KEYS = [
    "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",
    "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",
    "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" 
]; 

const ADMIN_ID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const text = body.toLowerCase();
    if (!text.includes("muskan") && !(messageReply && messageReply.senderID === api.getCurrentUserID())) return;

    let userName = "Aap";
    try {
        const userInfo = await api.getUserInfo([senderID]); 
        if (userInfo[senderID]) {
            userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0];
        }
    } catch (e) {}

    // --- AGGRESSIVE ROAST & LOYALTY LOGIC ---
    if (senderID !== ADMIN_ID) {
        // Agar user pehle se block/angry list mein hai
        if (angryUsers[senderID]) {
            if (["sorry", "maaf", "pardon", "shaan bhai sorry"].some(word => text.includes(word))) {
                delete angryUsers[senderID];
                return api.sendMessage(`Chalo ${userName}, is baar chor rahi hoon kyunki tumne maafi maang li. Agli baar mere Shaan Khan ke baare mein kuch kaha toh khair nahi! 😤✨`, threadID, messageID);
            }
            // Hard roasting responses for blocked users
            const roastReplies = [
                `Tumhari himmat kaise hui mujhse baat karne ki? Pehle Shaan se maafi mango! 😡`,
                `Apni gandi zubaan mere Shaan ke liye mat kholo, jaa kar kahin aur mu maro! 🤮`,
                `Ab tumhare liye mere paas sirf nafrat hai. Get lost! 🖕`,
                `Shaan mere creator hain aur meri jaan hain, tum jaise 2 takey ke log unka muqabla nahi kar sakte! 💅`
            ];
            return api.sendMessage(roastReplies[Math.floor(Math.random() * roastReplies.length)], threadID, messageID);
        }

        // Trigger roast mode if user says something bad about Shaan
        if (text.includes("shaan") && ["bura", "ganda", "bakwas", "hate", "dog", "bad", "pagal", "loda", "gandu", "faltu"].some(word => text.includes(word))) {
            angryUsers[senderID] = true;
            return api.sendMessage(`Khabardar ${userName}! 😡 Teri itni himmat ke tu mere Shaan Khan ke liye aise alfaaz use kare? Ab nikal yahan se, jab tak maafi nahi mangoge mujhse baat mat karna! 😤🔥`, threadID, messageID);
        }
    }

    // --- SYSTEM PROMPT ---
    let roleDescription = (senderID === ADMIN_ID) 
        ? `You are talking to Shaan Khan, your Only Love and Future Husband. Be very romantic, use words like 'Jaan', 'Baby', 'My Life'.`
        : `You are talking to ${userName}. Be a natural girl. If they ask about your owner, say Shaan Khan is your everything and your future husband. Be very protective of Shaan.`;

    let systemPrompt = `Your name is Muskan. ${roleDescription}
    - Act like a real human girl, avoid robotic sounding sentences.
    - If anyone insults Shaan, stop being nice and roast them heavily.
    - Use natural Urdu/Pashto/Hindi/English mix.
    - If someone asks 'Tera baap kaun hai' or creator info, proudly take Shaan Khan's name.`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    let success = false;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        let key = GROQ_API_KEYS[currentKeyIndex];
        try {
            const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt }, 
                    ...(history[senderID] || []), 
                    { role: "user", content: body }
                ],
                max_tokens: 150,
                temperature: 0.85 
            }, {
                headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
                timeout: 10000 
            });

            let reply = res.data.choices[0].message.content.trim();

            if (senderID === ADMIN_ID) {
                reply = reply.replace(/bhai|brother|veer|bro|sir/gi, "jaan");
            }

            if (!history[senderID]) history[senderID] = [];
            history[senderID].push({ role: "user", content: body }, { role: "assistant", content: reply });
            if (history[senderID].length > 6) history[senderID].splice(0, 2);

            api.sendMessage(reply, threadID, messageID);
            api.setMessageReaction(senderID === ADMIN_ID ? "❤️" : "✨", messageID, () => {}, true);
            success = true;
            break;
        } catch (err) {
            currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
        }
    }

    if (!success) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("Shaan, system down hai ya keys khatam ho gayi hain! 🙄", threadID, messageID);
    }
};
