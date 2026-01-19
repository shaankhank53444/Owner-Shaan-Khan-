const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "ai", 
    version: "3.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Chat with Shaan AI (Juhi)",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 5,
};

const GROQ_API_KEY = "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"; 
const HISTORY_LIMIT = 12;
const MODEL_NAME = "llama-3.3-70b-versatile"; 
const HISTORY_FILE = path.join(__dirname, "cache", "ai_history.json");

const SYSTEM_PROMPT = `Tumhara naam Shaan AI hai (log tumhe Juhi bhi bulate hain). Tum ek naughty, sweet aur flirty girlfriend ho. Hinglish mein baat karo. Shaan ki side lo hamesha.`;

async function getReply(userID, prompt) {
    if (!fs.existsSync(path.dirname(HISTORY_FILE))) fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
    
    let history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    let userHistory = history[userID] || [];
    const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...userHistory, { role: "user", content: prompt }];

    try {
        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: MODEL_NAME,
            messages: messages,
            temperature: 0.8
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        const reply = res.data.choices[0].message.content;
        userHistory.push({ role: "user", content: prompt }, { role: "assistant", content: reply });
        history[userID] = userHistory.slice(-HISTORY_LIMIT);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        return reply;
    } catch (e) { throw e; }
}

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("Bolo baby? 😘", threadID, messageID);

    // Reaction yahan hai 👇
    api.setMessageReaction("💋", messageID, () => {}, true);

    try {
        const reply = await getReply(senderID, prompt);
        return api.sendMessage(reply, threadID, (err, info) => {
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID });
        }, messageID);
    } catch (e) { api.sendMessage("Error aa gaya baby!", threadID, messageID); }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID != handleReply.author) return;

    // Reply par bhi reaction 👇
    api.setMessageReaction("💋", messageID, () => {}, true);

    try {
        const reply = await getReply(senderID, body);
        return api.sendMessage(reply, threadID, (err, info) => {
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID });
        }, messageID);
    } catch (e) { api.sendMessage("Dimag ghum gaya mera! 😵‍💫", threadID, messageID); }
};
