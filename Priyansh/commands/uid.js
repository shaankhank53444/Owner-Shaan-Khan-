module.exports.config = {
    name: "uid",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get User ID (Fixed Mentions for FCA)",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // 1. Agar message pe REPLY kiya gaya hai
    if (type == "message_reply") {
        return api.sendMessage(`${messageReply.senderID}`, threadID, messageID);
    }

    // 2. Agar MENTION kiya gaya hai
    // Hum Object.keys aur body dono check kar rahe hain backup ke liye
    if (Object.keys(mentions).length > 0) {
        let msg = "";
        for (let id in mentions) {
            msg += `${id}\n`;
        }
        return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // 3. Special Fix: Agar Mentions object khali hai par text me mention hai
    // Ye tab kaam aayega jab FCA mention detect nahi kar pa raha
    if (args.join(" ").indexOf("@") !== -1) {
        // Agar mention object fail ho gaya, toh user ko batayein ki reply use karein
        return api.sendMessage("Mentions detection me error hai, please user ke message par 'reply' karke command use karein.", threadID, messageID);
    }

    // 4. Default: Khud ki ID
    return api.sendMessage(`${senderID}`, threadID, messageID);
};
