module.exports.config = {
    name: "sim",
    version: "4.4.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Chat with SimSimi AI. Optimized by Shaan Khan",
    commandCategory: "Chat",
    usages: "[message/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

async function simsimi(content) {
    const axios = require("axios");
    try {
        // New Working API Link
        const url = `https://api.simsimi.net/v2/?text=${encodeURIComponent(content)}&lc=en`;
        const res = await axios.get(url);
        
        // Simsimi.net ka response format 'success' key mein hota hai
        return { error: false, data: res.data.success || "No response." };
    } catch (err) {
        return { error: true, data: "API Connection Error" };
    }
}

module.exports.onLoad = async function() {
    if (typeof global.manhG == "undefined") global.manhG = {};
    if (typeof global.manhG.simsimi == "undefined") global.manhG.simsimi = new Map();
};

module.exports.handleEvent = async function({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    
    if (global.manhG.simsimi.has(threadID)) {
        if (senderID == api.getCurrentUserID() || !body || body.startsWith(global.config.PREFIX)) return;
        
        const { data, error } = await simsimi(body);
        if (error || !data) return;
        
        return api.sendMessage(data, threadID, messageID);
    }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length == 0) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Please enter a message or use 'on/off'.", threadID, messageID);

    switch (args[0].toLowerCase()) {
        case "on":
            global.manhG.simsimi.set(threadID, true);
            return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot successfully turned ON.", threadID, messageID);
        
        case "off":
            global.manhG.simsimi.delete(threadID);
            return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot successfully turned OFF.", threadID, messageID);
            
        default:
            const { data, error } = await simsimi(args.join(" "));
            if (error) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Server slow hai, thori dair baad try karein.", threadID, messageID);
            return api.sendMessage(data, threadID, messageID);
    }
};
