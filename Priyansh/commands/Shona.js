const fs = require("fs");
module.exports.config = {
        name: "shona",
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
        if (event.body.indexOf("Shona")==0 || event.body.indexOf("SHANO")==0 || event.body.indexOf("@Shona")==0 || event.body.indexOf("shona")==0) {
                var msg = {
                                body: "𝐒𝐇𝐀𝐍𝐎 𝐉𝐈 𝐀𝐏𝐊𝐀 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐇𝐎 𝐆𝐀𝐘𝐀😁",
                                attachment: fs.createReadStream(__dirname + `/noprefix/shona.mp4`)
                        }
                        api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😘", event.messageID, (err) => {}, true)
                }
        }
        module.exports.run = function({ api, event, client, __GLOBAL }) {

        }