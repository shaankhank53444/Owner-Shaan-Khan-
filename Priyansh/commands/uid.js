module.exports.config = {
    name: "uid",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID and Name (Reply, Mention, or Name search)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // 1. Agar message par REPLY kiya gaya ho
    if (type == "message_reply") {
        try {
            const info = await api.getUserInfo(messageReply.senderID);
            const name = info[messageReply.senderID].name;
            return api.sendMessage(`${name}: ${messageReply.senderID}`, threadID, messageID);
        } catch (e) {
            return api.sendMessage(`${messageReply.senderID}`, threadID, messageID);
        }
    }

    // 2. Agar MENTION kiya gaya ho (@Name)
    if (Object.keys(mentions).length > 0) {
        let msg = "";
        for (let id in mentions) {
            let name = mentions[id].replace("@", "");
            msg += `${name}: ${id}\n`;
        }
        return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // 3. AGAR MENTION FAIL HO JAYE (Manual Name Search Fix)
    if (args.length > 0) {
        try {
            const nameSearch = args.join(" ").replace(/@/g, "").toLowerCase();
            const threadInfo = await api.getThreadInfo(threadID);
            const userInfo = threadInfo.userInfo;

            const user = userInfo.find(u => u.name.toLowerCase().includes(nameSearch));

            if (user) {
                return api.sendMessage(`${user.name}: ${user.id}`, threadID, messageID);
            }
        } catch (err) {
            console.log(err);
        }
    }

    // 4. Default: Khud ka Name aur ID
    try {
        const selfInfo = await api.getUser
