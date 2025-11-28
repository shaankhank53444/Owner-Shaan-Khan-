const fs = require("fs");
module.exports.config = {
        name: "Amal Baloch",
    version: "1.0.1",
        hasPermssion: 0,
        credits: "Shaan", 
        description: "hihihihi",
        commandCategory: "no prefix",
        usages: "npxs5",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
        var { threadID, messageID } = event;
        if (event.body.indexOf("amal")==0 || event.body.indexOf("AMAL")==0 || event.body.indexOf("@Amal Baloch")==0 || event.body.indexOf("Amal")==0) {
                var msg = {
                                body: "𝑴𝑬 𝑨𝑴𝑨𝑳 𝑩𝑨𝑳𝑶𝑪𝑯 𝑲𝑨 𝑱𝑨𝑵𝑼 𝑼𝑺𝑲𝑶 𝑲𝑶𝑰 𝑴𝑬𝑵𝑻𝑰𝑶𝑵 𝑵𝑨 𝑲𝑨𝑹𝑶",
                                attachment: fs.createReadStream(__dirname + `/noprefix/amal.mp4`)
                        }
                        api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😘", event.messageID, (err) => {}, true)
                }
        }
        module.exports.run = function({ api, event, client, __GLOBAL }) {

        }