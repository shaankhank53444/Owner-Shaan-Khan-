module.exports.config = {
    name: "uid",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID and Name",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // Function to get name and format message
    async function sendUserInfo(id) {
        const info = await api.getUserInfo(id);
        const name = info[id].name;
        return api.sendMessage(`${name}: ${id}`, threadID, messageID);
    }

    // 1. Agar message pe REPLY kiya gaya hai
    if (type == "message_reply") {
        return await sendUserInfo(messageReply.senderID);
    }

    // 2. Agar MENTION kiya gaya hai
    if (Object.keys(mentions).length > 0) {
        let msg = "";
        for (let id in mentions) {
            const info = await api.getUserInfo(id);
            msg += `${info[id].name}: ${id}\n`;
        }
        return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // 3. Default: Khud ki ID aur Name
    return await sendUserInfo(senderID);
};
