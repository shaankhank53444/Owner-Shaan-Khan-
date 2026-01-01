const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "say",
    version: "1.1.0",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "Muskan ki awaz mein Urdu bolne wala command",
    commandCategory: "ai",
    usages: "[text]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // Agar kuch nahi likha toh default jawab
    var content = (event.type == "message_reply") ? event.messageReply.body : args.join(" ");
    if (!content) return api.sendMessage("Boliye baby, kya bolun main? ❤️", threadID, messageID);

    const pathAudio = path.resolve(__dirname, 'cache', `${threadID}_${senderID}_muskan.mp3`);

    try {
        // Urdu Language (tl=ur) set kar di gayi hai
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=ur&client=tw-ob`;
        
        // Audio download logic
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(pathAudio);
        response.data.pipe(writer);

        writer.on('finish', () => {
            return api.sendMessage({
                body: `Suniye baby, maine bol diya: "${content}"\n\n— Apki Muskan (Shaan ki 💍)`,
                attachment: fs.createReadStream(pathAudio)
            }, threadID, () => fs.unlinkSync(pathAudio), messageID);
        });

        writer.on('error', (err) => {
            console.error(err);
            api.sendMessage("Uff Shaan, awaz nikalne mein masla ho raha hai! 💋", threadID, messageID);
        });

    } catch (e) {
        console.log(e);
        return api.sendMessage("Network issue hai jaan, Shaan ko bolo theek karein! ❤️", threadID, messageID);
    }
};
