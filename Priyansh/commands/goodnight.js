const axios = require("axios");

module.exports.config = {
    name: "night",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Shaan", 
    description: "Sends a night greeting with an image from link",
    commandCategory: "no prefix",
    usages: "night",
    cooldowns: 5, 
};

module.exports.handleEvent = async function({ api, event }) {
    var { threadID, messageID, body } = event;
    if (!body) return;

    // Checking for keywords
    const keywords = ["Good night", "good night", "Gud night", "Gud nini"];
    
    if (keywords.some(word => body.startsWith(word))) {
        try {
            // Fetching image from Imgur link
            const imageUrl = "https://i.imgur.com/bUnsm41.jpeg";
            const response = await axios.get(imageUrl, { responseType: "stream" });

            var msg = {
                body: "🌸=𝐆𝐎𝐎𝐃__𝐍𝐈𝐆𝐇𝐓___😘 𝐒𝐎𝐍𝐄 𝐒𝐄 𝐏𝐀𝐇𝐋𝐄 𝐌𝐄𝐑𝐀 𝐍𝐀𝐀𝐌 𝐋𝐄 𝐋𝐀𝐍𝐀 𝐁𝐇𝐎𝐎𝐓 𝐍𝐀𝐇𝐈 𝐀𝐀𝐄𝐆𝐀_____ 😂:))",
                attachment: response.data
            };

            api.sendMessage(msg, threadID, messageID);
            api.setMessageReaction("😴", messageID, (err) => {}, true);
        } catch (error) {
            console.error("Error sending image:", error);
        }
    }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
    // Empty run function for no-prefix commands
};
