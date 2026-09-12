const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "4k",
        version: "1.2.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
        description: "Enhance image quality using Tenzo 4K API",
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
            const API_BASE = "https://tenzo.is-a.dev/api/tools/4k";
            
            // API Stream request
            const response = await axios.get(`${API_BASE}?url=${encodeURIComponent(imageUrl)}`, {
                responseType: 'stream',
                timeout: 120000
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            api.unsendMessage(waitMessage.messageID);

            return api.sendMessage({
                body: "✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a\x0a✅ Ye lo aapki 4K image 💖",
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, messageID);

        } catch (error) {
            console.error(error);
            if (waitMessage.messageID) api.unsendMessage(waitMessage.messageID);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return api.sendMessage("❌ 4K image generate karne mein error aaya.", threadID, messageID);
        }
    }
};
