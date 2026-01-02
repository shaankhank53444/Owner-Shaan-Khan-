module.exports.config = {
    name: "unsend",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "Shaan",
    description: "Bot ke message par reply karke unsend likhein ya 😾 react karein",
    commandCategory: "system",
    usages: "unsend (reply karke) ya react 😾",
    cooldowns: 0
};

// --- Reaction wala setup ---
module.exports.handleReaction = async function ({ api, event }) {
    // Check agar react karne wala wahi hai jisne message bheja (optional) 
    // Aur check ki reaction '😾' hai ya nahi
    if (event.reaction == "😾") {
        return api.unsendMessage(event.messageID);
    }
};

// --- Prefix/Command wala setup ---
module.exports.run = async function ({ api, event }) {
    // Check agar reply nahi kiya gaya hai
    if (event.type != "message_reply") {
        return api.sendMessage("Mere jis message ko unsend karna hai, uspar reply karke likho.", event.threadID, event.messageID);
    }

    // Check agar message bot ka nahi hai
    if (event.messageReply.senderID != api.getCurrentUserID()) {
        return api.sendMessage("Main sirf apne hi messages unsend kar sakta hoon.", event.threadID, event.messageID);
    }

    return api.unsendMessage(event.messageReply.messageID);
};
