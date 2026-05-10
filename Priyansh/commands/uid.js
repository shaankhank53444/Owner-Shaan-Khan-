module.exports.config = {
    name: "uid",
    version: "1.3.5",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID and Name (Fixed & Stable)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // 1. Agar Reply kiya gaya ho
    if (type == "message_reply") {
        // Reply wale case mein name nikalne ke liye api call ki zarurat hoti hai
        // Isliye yahan hum direct ID bhej rahe hain taaki crash na ho
        return api.sendMessage(`ID: ${messageReply.senderID}`, threadID, messageID);
    }

    // 2. Agar Mention kiya gaya ho (Name + ID)
    if (Object.keys(mentions).length > 0) {
        let msg = "";
        for (let id in mentions) {
            let name = mentions[id].replace("@", "");
            msg += `${name}: ${id}\n`;
        }
        return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // 3. Default: Khud ki ID
    return api.sendMessage(`${senderID}`, threadID, messageID);
};
