const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "4k",
        version: "1.1.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍", // API Updated by Raza logic
        description: "Enhance image quality using Remini AI API",
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

        try {
            // Nayi API ka istemal
            const apiUrl = `https://api.kraza.qzz.io/imagecreator/remini?url=${encodeURIComponent(imageUrl)}`;
            const res = await axios.get(apiUrl);

            // Check if API response is valid
            if (!res.data.status || !res.data.result) {
                api.unsendMessage(waitMessage.messageID);
                return api.sendMessage("❌ API ne image process nahi ki.", threadID, messageID);
            }

            const resultUrl = res.data.result;
            const cacheDir = path.join(__dirname, "cache");
            
            // Cache folder check karna
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            
            const outputPath = path.join(cacheDir, `4k_${Date.now()}.jpg`);

            // Image download karke save karna
            const imageRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(outputPath, Buffer.from(imageRes.data));

            api.unsendMessage(waitMessage.messageID);

            return api.sendMessage({
                body: "✫꯭🎸꯭≛⃝𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍⎯᪳⤹🌷⤸\x0a\x0a✅ Ye lo aapki 4K (Remini) image 💖",
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                // File bhejne ke baad delete kar dena taaki storage full na ho
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, messageID);

        } catch (error) {
            console.error(error);
            if (waitMessage.messageID) api.unsendMessage(waitMessage.messageID);
            return api.sendMessage("❌ 4K image generate karne mein error aaya.", threadID, messageID);
        }
    }
};
