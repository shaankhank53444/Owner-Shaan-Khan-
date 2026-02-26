const fs = require("fs");

module.exports.config = {
    name: "follow",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭", 
    description: "Auto reply with voice and text",
    commandCategory: "no prefix",
    usages: "follow",
    cooldowns: 5, 
};

module.exports.handleEvent = async function({ api, event }) {
    var { threadID, messageID, body } = event;
    if (!body) return;

    // Keywords check karne ka asaan tarika
    const keywords = ["shaan", "Shan", "Shaan", "shan"];
    if (keywords.some(word => body.toLowerCase().startsWith(word.toLowerCase()))) {
        
        const msgText = "👋 For Any Kind Of Help Contact On WhatsApp +923368783346 👉 @shankhank345 😇";
        const audioPath = __dirname + `/noprefix/ttsmaker-file-2025-3-19-21-16-17.mp3`;

        // Pehle text bhejte hain, phir uske callback mein voice
        return api.sendMessage(msgText, threadID, (err, info) => {
            if (fs.existsSync(audioPath)) {
                api.sendMessage({
                    attachment: fs.createReadStream(audioPath)
                }, threadID);
            }
            api.setMessageReaction("🔔", messageID, (err) => {}, true);
        }, messageID);
    }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {};
