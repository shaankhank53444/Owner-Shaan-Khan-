module.exports.config = {
    name: "uid",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID (Reply, Mention, or Self)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = function({ api, event, args }) {
    // 1. Agar kisi ke message par REPLY kiya gaya hai
    if (event.type == "message_reply") {
        return api.sendMessage(`${event.messageReply.senderID}`, event.threadID, event.messageID);
    }

    // 2. Agar kisi ko MENTION kiya gaya hai (@Name)
    if (Object.keys(event.mentions).length !== 0) {
        let mentionIDs = Object.keys(event.mentions);
        let msg = "";
        for (let id of mentionIDs) {
            msg += `${id}\n`;
        }
        return api.sendMessage(msg.trim(), event.threadID, event.messageID);
    }

    // 3. Agar kuch na ho, toh SENDER ki apni ID
    return api.sendMessage(`${event.senderID}`, event.threadID, event.messageID);
};
