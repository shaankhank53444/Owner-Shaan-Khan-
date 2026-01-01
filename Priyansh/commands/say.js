const axios = require("axios");

module.exports.config = {
    name: "say",
    version: "2.0.0",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "Muskan Urdu Chat - Shaan Protection",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 2,
    dependencies: { "axios": "" }
};

const AUTHOR = "Shaan Khan";
const API_KEY = "Sk-or-v1-c402ba68d120de2d1f4d0814d620154d63c86bb9cab0701bae059356959f3a71";
const history = {};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // Credits Lock
    if (this.config.credits !== AUTHOR) return api.sendMessage("Credits badalne ki koshish mat karo! 😡", threadID);

    let userText = args.join(" ");
    if (!userText) return api.sendMessage("جی جان، کچھ بولیے تو؟ میں سن رہی ہوں.. ❤️", threadID, messageID);

    if (!history[senderID]) history[senderID] = [];
    history[senderID].push(`User: ${userText}`);
    if (history[senderID].length > 5) history[senderID].shift();

    const chatHistory = history[senderID].join("\n");

    // 🔥 Pure Urdu Personality Prompt
    const systemPrompt = `
Your name is Muskan. You are Shaan's ultra-loyal girlfriend.
STRICT RULE: Reply ONLY in Urdu script (اردو زبان). Do not use English or Roman Urdu.
Personality: Sweet, loyal to Shaan, funny, and human-like.
Task: Mention Shaan as your everything. If anyone is mean to Shaan, be savage in Urdu.
Limit: 20 words maximum.
History: ${chatHistory}`;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        // Using OpenRouter with the key you provided
        const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userText }
            ]
        }, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            timeout: 10000
        });

        let reply = res.data.choices[0].message.content;
        
        // Final Urdu Reply
        history[senderID].push(`Bot: ${reply}`);
        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction("❤️", messageID, () => {}, true);

    } catch (err) {
        // Backup if API fails
        try {
            const backup = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai`);
            api.sendMessage(backup.data, threadID, messageID);
        } catch (e) {
            api.sendMessage("اف جان، نیٹ ورک کا مسئلہ ہے لیکن میں صرف شان کی ہوں! 💋", threadID, messageID);
        }
    }
};
