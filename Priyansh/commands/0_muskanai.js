const axios = require("axios");
module.exports.config = { name: 'muskan', version: '10.5.0', credits: 'Shaan Khan', dependencies: { 'axios': '' } };

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, body, messageReply } = event;
    if (!body || (!body.toLowerCase().includes("muskan") && !(messageReply && messageReply.senderID === api.getCurrentUserID()))) return;

    // Abuse detection & Long-term stable model
    const isAbusive = /gali|randi|chod|bhadwe|lodu|bc|mc|ganda/.test(body.toLowerCase());
    const systemPrompt = isAbusive 
        ? "User ne badtameezi ki hai. Ise bohot gandi aur desi galiyan do. Bilkul mat darna!" 
        : "Tum Muskan ho, Shaan Khan ki banayi hui sweet aur naughty ladki. Reply short (max 4,5 words) aur natural rakho.";

    try {
        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-70b-versatile", // Most stable & high-rate limit model
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: body }],
            max_tokens: 150
        }, { headers: { "Authorization": `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` } });

        api.sendMessage(res.data.choices[0].message.content, threadID, messageID);
        api.setMessageReaction(isAbusive ? "🔥" : "💬", messageID, () => {}, true);
    } catch (e) { 
        api.sendMessage("Net slow hai ya limit end baby, thoda sabr karo! 😘", threadID); 
    }
};
