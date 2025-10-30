const fs = require("fs");
module.exports.config = {
        name: "shan",
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
        if (event.body.indexOf("Shaan")==0 || event.body.indexOf("SHAAN")==0 || event.body.indexOf("shaan")==0 || event.body.indexOf("shan")==0) {
                var msg = {
                                body: "𝐁𝐎𝐒𝐒 𝐓𝐎 𝐁𝐔𝐒𝐘 𝐇𝐀𝐈 𝐁𝐔𝐓 𝐘𝐄 𝐒𝐔𝐍𝐎 𝐎𝐔𝐑 𝐖𝐀𝐈𝐓 𝐊𝐀𝐑𝐎 𝐔𝐒𝐊𝐘",
                                attachment: fs.createReadStream(__dirname + `/noprefix/shaan.mp4`)
                        }
                        api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😏", event.messageID, (err) => {}, true)
                }
        }
        module.exports.run = function({ api, event, client, __GLOBAL }) {

        }