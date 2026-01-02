module.exports.config = {
    name: "unsend",
    version: "1.0.5",
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
        "missingReply": "Hãy reply tin nhắn cần gỡ hoặc thả emoji 😾."
    },
    "en": {
        "returnCant": "Main sirf apne messages unsend kar sakta hoon!",
        "missingReply": "Mere jis message ko hatana hai, uspar reply karke unsend likhein ya 😾 emoji react karein."
    }
}

module.exports.handleReaction = async function({ api, event }) {
    // Sirf tab delete hoga jab emoji 😾 use hoga
    if (event.reaction == "😾") {
        api.unsendMessage(event.messageID);
    }
};

module.exports.run = async function({ api, event, getText }) {
    // Agar kisi ne message par reply nahi kiya
    if (event.type != "message_reply") {
        return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    }
    
    // Agar reply kiya hua message bot ka nahi hai
    if (event.messageReply.senderID != api.getCurrentUserID()) {
        return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    }
    
    // Message delete karne ke liye
    return api.unsendMessage(event.messageReply.messageID);
};
