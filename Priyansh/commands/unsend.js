module.exports.config = {
    name: "unsend",
    version: "1.0.8",
    hasPermssion: 0,
    credits: "Priyansh Rajput",
    description: "Bot ke message par 😾 react karein unsend karne ke liye",
    commandCategory: "system",
    usages: "unsend [reply]",
    cooldowns: 0
};

module.exports.handleReaction = async function({ api, event }) {
    // Jab koi bot ke message par 😾 react karega
    if (event.reaction == "😾") {
        api.unsendMessage(event.messageID);
    }
};

module.exports.run = async function({ api, event }) {
    // Agar koi reply karke command likhta hai
    if (event.type == "message_reply") {
        if (event.messageReply.senderID != api.getCurrentUserID()) {
            return api.sendMessage("Main sirf apne messages unsend kar sakta hoon!", event.threadID, event.messageID);
        }
        return api.unsendMessage(event.messageReply.messageID);
    }
    
    // Agar koi bina reply ke sirf command likhta hai toh ye instruction dega
    return api.sendMessage("💡 Tip: Mere jis message ko hatana hai, uspar 😾 emoji react karein ya us message par reply karke unsend likhein.", event.threadID, event.messageID);
};
