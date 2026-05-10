module.exports.config = {
    name: "uid",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID and Name (FCA Mention Fix)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // Helper function to get and send info
    async function sendInfo(id) {
        try {
            const info = await api.getUserInfo(id);
            const name = info[id].name;
            return api.sendMessage(`👤 Name: ${name}\n🆔 UID: ${id}`, threadID, messageID);
        } catch (e) {
            return api.sendMessage(`🆔 UID: ${id}`, threadID, messageID);
        }
    }

    // 1. Reply Method (Sabse accurate)
    if (type == "message_reply") {
        return await sendInfo(messageReply.senderID);
    }

    // 2. Mention Object Check (Agar FCA support kare)
    if (Object.keys(mentions).length > 0) {
        for (let id in mentions) {
            await sendInfo(id);
        }
        return;
    }

    // 3. FCA Mention Fix: Manual parsing from args
    // Agar user ne @name likha hai aur mentions empty hai
    if (args.length > 0) {
        // Check if the input is a direct UID
        if (!isNaN(args[0])) {
            return await sendInfo(args[0]);
        }
        
        // Agar mention kaam nahi kar raha, toh bot suggest karega
        return api.sendMessage("⚠️ FCA Mention detection issue! Please user ke message par 'reply' karke command likhein ya direct UID dein.", threadID, messageID);
    }

    // 4. Default: Khud ki ID
    return await sendInfo(senderID);
};
