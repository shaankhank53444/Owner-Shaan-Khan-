const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

async function getBaseApi() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json');
        return response.data.mahmud;
    } catch (e) {
        return "https://sensui-useless-apis.vercel.app"; // Fallback API link
    }
}

module.exports = {
    config: {
        name: "4k",
        version: "1.0.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
        description: "Enhance image quality using 4K AI",
        commandCategory: "Image",
        usages: "4k (reply image / image url)",
        cooldowns: 10
    },

    run: async function({ api, event, args }) {
        const { threadID, messageID, messageReply } = event;
        let imageUrl = '';

        // Check if user replied to an image
        if (messageReply && messageReply.attachments && messageReply.attachments[0] && messageReply.attachments[0].type === "photo") {
            imageUrl = messageReply.attachments[0].url;
        } 
        // Check if user provided a URL in args
        else if (args[0]) {
            imageUrl = args.join(" ");
        }

        if (!imageUrl) {
            return api.sendMessage("❌ Photo reply karo ya image URL do", threadID, messageID);
        }

        const waitMessage = await api.sendMessage("✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a⏳ 4K image ban rahi hai…", threadID);

        try {
            const baseApi = await getBaseApi();
            const apiUrl = `${baseApi}/api/hd?imgUrl=${encodeURIComponent(imageUrl)}`;
            
            const response = await axios.get(apiUrl, { responseType: "stream" });

            api.unsendMessage(waitMessage.messageID);
            
            return api.sendMessage({
                body: "✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a\x0a✅ Ye lo aapki 4K image 💖",
                attachment: response.data
            }, threadID, messageID);

        } catch (error) {
            console.error(error);
            api.unsendMessage(waitMessage.messageID);
            return api.sendMessage("❌ 4K image generate nahi ho payi", threadID, messageID);
        }
    }
};
