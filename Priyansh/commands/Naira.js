const fs = require("fs");
module.exports.config = {
        name: "naira",
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
        if (event.body.indexOf("naira")==0 || event.body.indexOf("NAIRA")==0 || event.body.indexOf("@naira")==0 || event.body.indexOf("Naira")==0) {
                var msg = {
                                body: "𝐍𝐀𝐈𝐑𝐀 𝐒𝐇𝐀𝐀𝐍 𝐁𝐎𝐒𝐒 𝐊𝐈 𝐖𝐈𝐅𝐄 𝐇𝐀𝐈 𝐌𝐄𝐍𝐓𝐈𝐎𝐍 𝐍𝐀 𝐊𝐀𝐑𝐎𝐎 😏😏",
                                attachment: fs.createReadStream(__dirname + `/noprefix/Naira.mp3`)
                        }
                        api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😘", event.messageID, (err) => {}, true)
                }
        }
        module.exports.run = function({ api, event, client, __GLOBAL }) {

        }