const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "4k",
        version: "1.1.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
        description: "Enhance image quality using AI (Working API)",
        commandCategory: "Image",
        usages: "4k (reply image / image url)",
        cooldowns: 10
    },

    run: async function({ api, event, args }) {
        const { threadID, messageID, messageReply } = event;
        let imageUrl = '';

        // Image source check logic
        if (messageReply && messageReply.attachments && messageReply.attachments[0] && messageReply.attachments[0].type === "photo") {
            imageUrl = messageReply.attachments[0].url;
        } 
        else if (args[0] && args[0].startsWith("http")) {
            imageUrl = args[0];
        }

        if (!imageUrl) {
            return api.sendMessage("❌ Photo reply karo ya image URL do", threadID, messageID);
        }

        const waitMessage = await api.sendMessage("✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a⏳ AI processing shuru hai, thoda intezar karein...", threadID);

        try {
            // New Working API for 4K Enhancement
            const res = await axios.get(`https://smarthub-api.vercel.app/api/remini?url=${encodeURIComponent(imageUrl)}`, {
                responseType: "arraybuffer"
            });

            const pathImg = path.join(__dirname, 'cache', `remini_${Date.now()}.png`);
            
            // Check if cache folder exists
            if (!fs.existsSync(path.join(__dirname, 'cache'))) {
                fs.mkdirSync(path.join(__dirname, 'cache'));
            }

            fs.writeFileSync(pathImg, Buffer.from(res.data, 'utf-8'));

            api.unsendMessage(waitMessage.messageID);

            return api.sendMessage({
                body: "✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a\x0a✅ Ye lo aapki 4K image 💖",
                attachment: fs.createReadStream(pathImg)
            }, threadID, () => fs.unlinkSync(pathImg), messageID);

        } catch (error) {
            console.error(error);
            api.unsendMessage(waitMessage.messageID);
            return api.sendMessage("❌ API Busy hai ya image process nahi ho saki. Baad mein try karein.", threadID, messageID);
        }
    }
};
