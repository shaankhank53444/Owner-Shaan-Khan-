module.exports.config = {
    name: "uid",
    version: "1.2.5",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID (Reply, Mention, or Name search)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // 1. Agar kisi ke message par REPLY kiya hai
    if (type == "message_reply") {
        return api.sendMessage(`${messageReply.senderID}`, threadID, messageID);
    }

    // 2. Agar MENTIONS detect ho rahe hain
    if (Object.keys(mentions).length > 0) {
        let msg = Object.keys(mentions).join("\n");
        return api.sendMessage(msg, threadID, messageID);
    }

    // 3. AGAR MENTIONS FAIL HO JAYEIN (Manual Name Search Fix)
    if (args.length > 0) {
        try {
            const nameSearch = args.join(" ").replace(/@/g, "").toLowerCase();
            const threadInfo = await api.getThreadInfo(threadID);
            const userInfo = threadInfo.userInfo;

            const user = userInfo.find(u => u.name.toLowerCase().includes(nameSearch));

            if (user) {
                return api.sendMessage(`${user.id}`, threadID, messageID);
            } else {
                return api.sendMessage("User nahi mila! Koshish karein ki user ke message par 'reply' karke command use karein.", threadID, messageID);
            }
        } catch (err) {
            return api.sendMessage(`${senderID}`, threadID, messageID);
        }
    }

    // 4. Default: Apni ID
    return api.sendMessage(`${senderID}`, threadID, messageID);
};
