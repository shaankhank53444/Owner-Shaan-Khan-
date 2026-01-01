module.exports.config = {
    name: "say",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "Shaan / Gemini",
    description: "Aapke text ko cute Urdu voice mein sunata hai",
    commandCategory: "without prefix",
    usages: "[text/reply]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    try {
        const { createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
        const { resolve } = global.nodemodule["path"];
        
        // Agar kisi message ka reply hai toh wo text lega, warna args lega
        var content = (event.type == "message_reply") ? event.messageReply.body : args.join(" ");
        
        if (!content) return api.sendMessage("Boliye kya sunna hai? (Text likhen ya reply karen)", event.threadID, event.messageID);

        const path = resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);
        
        // Yahan 'tl=ur' ka matlab Urdu language hai
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=ur&client=tw-ob`;
        
        await global.utils.downloadFile(url, path);
        
        return api.sendMessage({
            body: "🔊 Yeh lijiye:",
            attachment: createReadStream(path)
        }, event.threadID, () => {
            if (global.nodemodule["fs-extra"].existsSync(path)) unlinkSync(path);
        }, event.messageID);

    } catch (e) { 
        console.log(e);
        return api.sendMessage("Maaf kijiyega, voice generate karne mein masla ho raha hai.", event.threadID);
    };
}
