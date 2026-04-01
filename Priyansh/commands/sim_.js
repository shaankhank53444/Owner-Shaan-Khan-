module.exports.config = {
    name: "sim",
    version: "4.3.7",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Chat with SimSimi AI. Fixed and optimized by Shaan Khan",
    commandCategory: "Chat same sim",
    usages: "[args]",
    cooldowns: 5,
    dependencies: {
        "axios": ""
    },
    envConfig: {
        APIKEY: "Shaan_Internal_Key"
    }
};

async function simsimi(content) {
    const axios = require("axios");
    try {
        // API URL update ki gayi hai
        const url = `https://sim-api-by-priyansh.glitch.me/sim?type=ask&ask=${encodeURIComponent(content)}&apikey=PriyanshVip`;
        const res = await axios.get(url);
        return { error: false, data: res.data };
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
        if (senderID == api.getCurrentUserID() || !body) return;
        
        const { data, error } = await simsimi(body);
        if (error) return;
        
        if (data.answer) {
            return api.sendMessage(data.answer, threadID, messageID);
        } else {
            return api.sendMessage(data.error || "SimSimi responds: I don't understand.", threadID, messageID);
        }
    }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length == 0) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Please enter a message.", threadID, messageID);

    switch (args[0].toLowerCase()) {
        case "on":
            if (global.manhG.simsimi.has(threadID)) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot is already active.", threadID, messageID);
            global.manhG.simsimi.set(threadID, messageID);
            return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot has been enabled successfully.", threadID, messageID);
        
        case "off":
            if (!global.manhG.simsimi.has(threadID)) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot is already disabled.", threadID, messageID);
            global.manhG.simsimi.delete(threadID);
            return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - Chatbot has been disabled successfully.", threadID, messageID);
            
        default:
            const { data, error } = await simsimi(args.join(" "));
            if (error) return api.sendMessage("[ 𝐒𝐇𝐀𝐀𝐍-𝐒𝐈𝐌 ] - API server is busy, try again later.", threadID, messageID);
            return api.sendMessage(data.answer || data.error, threadID, messageID);
    }
};
