module.exports.config = {
    name: "unsend",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Bot ke message par 😾 react karein ya reply karke unsend likhein",
    commandCategory: "system",
    usages: "unsend",
    cooldowns: 0
};

module.exports.languages = {
    "vi": {
        "returnCant": "Không thể gỡ tin nhắn của người khác.",
        "missingReply": "Hãy reply tin nhắn cần gỡ."
    },
    "en": {
        "returnCant": "Main sirf apne messages unsend kar sakta hoon!",
        "missingReply": "Mere jis message ko hatana hai uspar 😾 react karein."
    }
}

module.exports.handleReaction = async function({ api, event }) {
    if (event.reaction == "😾") {
        api.unsendMessage(event.messageID);
    }
};

module.exports.run = function({ api, event, getText }) {
    if (event.type != "message_reply") return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    return api.unsendMessage(event.messageReply.messageID);
};
