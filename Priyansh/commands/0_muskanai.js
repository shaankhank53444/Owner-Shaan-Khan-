1111const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.0.1',
    hasPermission: 0, // ✅ fixed typo
    credits: 'ARIF BABU',
    description: 'Gemini AI (Mirai Bot)',
    commandCategory: 'ai',
    usages: 'No command needed',
    cooldowns: 3,
    dependencies: {
        axios: ""
    }
};

// 🔐 CREDIT PROTECTION
if (module.exports.config.credits !== "ARIF BABU") {
    throw new Error(
        "\n❌ CREDITS CHANGE DETECTED!\n🔒 FILE LOCKED BY ARIF BABU\n"
    );
}

// 🔑 API KEY (better way)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD9CaMeXfbhn0jEMWiUTObztOGZcBayUUY";

const apiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const history = {};
const cooldown = {};

const systemPrompt =
  "Tumhara Creator Shaan Khan hai or tum hindi English Urdu me baat karti ho. " +
  "Shaan ki burai nahi karni. Act as a fun, loving girlfriend. " +
  "Reply max 5 lines, no brackets.";

module.exports.run = async () => {}; // ✅ warning fix

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const now = Date.now();
    if (cooldown[senderID] && now - cooldown[senderID] < 5000) return;
    cooldown[senderID] = now;

    const isMention =
        body.toLowerCase().includes("muskan") ||
        (messageReply && messageReply.senderID === api.getCurrentUserID());

    if (!isMention) return;

    if (!history[senderID]) history[senderID] = [];
    history[senderID].push(`User: ${body}`);
    if (history[senderID].length > 4) history[senderID].shift();

    const prompt = systemPrompt + "\n\n" + history[senderID].join("\n");

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const res = await axios.post(
            `${apiUrl}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        const reply =
            res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Baby mujhe samajh nahi aaya 😕";

        history[senderID].push(`Bot: ${reply}`);

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (e) {
        console.log("Gemini Error:", e.message);
        api.sendMessage(
            "Sorry jaan 😔 thori der baad try karo 💕",
            threadID,
            messageID
        );
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};