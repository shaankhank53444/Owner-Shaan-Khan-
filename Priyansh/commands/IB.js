const fs = require("fs");

module.exports.config = {
    name: "ib",
    version: "1.1.2",
    hasPermssion: 0,
    credits: "SHAAN",
    description: "Sirf start mein 'ib' hone par reply karega",
    commandCategory: "no prefix",
    cooldowns: 5,
};

module.exports.handleEvent = function({ api, event }) {
    var { threadID, messageID, body } = event;
    if (!body) return;

    let text = body.toLowerCase();

    // Check agar message "ib" ya "inbox" se shuru ho raha hai
    if (text.startsWith("ib") || text.startsWith("inbox")) {
        var msg = {
            body: `𝐊𝐈𝐓𝐍𝐄 𝐁𝐄𝐒𝐇𝐀𝐑𝐀𝐌 𝐇𝐎 𝐔𝐒𝐊𝐎 𝐈𝐁 𝐁𝐔𝐋𝐀 𝐑𝐀𝐇𝐄 𝐇𝐎😁😁😏😏 【 _𝐓𝐇𝐀𝐑𝐔𝐋𝐀 _ 】𝐒𝐇𝐀𝐀𝐍 𝐒𝐀𝐇𝐈 𝐁𝐎𝐋 𝐓𝐇𝐀 𝐉𝐎 𝐈𝐁 𝐉𝐀𝐘𝐄 𝐖𝐎 𝐓𝐇𝐀𝐑𝐊𝐈 𝐇𝐀𝐈😏😏😁🥶`,
        };
        
        api.sendMessage(msg, threadID, messageID);
        api.setMessageReaction("😏", messageID, (err) => {}, true);
    }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
    // Empty run function
};
