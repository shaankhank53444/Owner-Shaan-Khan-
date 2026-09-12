const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "4k",
        version: "2.0.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
        description: "Enhance image quality using AI Upscaler API",
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

        const waitMessage = await api.sendMessage("✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a⏳ Remini AI se 4K image ban rahi hai…", threadID);

        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const outputPath = path.join(cacheDir, `4k_${Date.now()}.jpg`);

        try {
            // Updated working 4K Upscale API
            const API_ENDPOINT = `https://api.vyturex.com/upscale?url=${encodeURIComponent(imageUrl)}`;
            
            const imageRes = await axios.get(API_ENDPOINT, { responseType: 'arraybuffer' });
            fs.writeFileSync(outputPath, Buffer.from(imageRes.data));

            api.unsendMessage(waitMessage.messageID);

            return api.sendMessage({
                body: "✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a\x0a✅ Ye lo aapki 4K (HD) image 💖",
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, messageID);

        } catch (error) {
            console.error(error);
            if (waitMessage.messageID) api.unsendMessage(waitMessage.messageID);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return api.sendMessage("❌ 4K image generate karne mein error aaya. Server down hai ya image link issue hai.", threadID, messageID);
        }
    }
};
