const fs = require("fs");
module.exports.config = {
        name: "Assalam",
    version: "1.0.1",
        hasPermssion: 0,
        credits: "Amir", 
        description: "hihihihi",
        commandCategory: "no prefix",
        usages: "npxs5",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
        var { threadID, messageID } = event;
        if (event.body.indexOf("@shona ")==0 || event.body.indexOf("@Shano")==0 || event.body.indexOf("SHANA")==0 || event.body.indexOf("shona")==0) {
                var msg = {
                                body: "𝑺𝑯𝑶𝑵𝑨 𝑨𝑷𝑲𝑨 𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑯𝑶 𝑮𝑨𝒀𝑨🥀🌹🌹",
                                attachment: fs.createReadStream(__dirname + `/noprefix/Shona.mp3`)
                        }
                        api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("💗", event.messageID, (err) => {}, true)
                }
        }
        module.exports.run = function({ api, event, client, __GLOBAL }) {

        }