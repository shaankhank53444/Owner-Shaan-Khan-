const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "4k",
        version: "1.1.0",
        hasPermssion: 0,
        credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
        description: "Enhance image quality using 4K AI",
        commandCategory: "Image",
        usages: "4k (reply image / image url)",
        cooldowns: 10
    },

    run: async function({ api, event, args }) {
        const { threadID, messageID, messageReply } = event;
        const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
        let imageUrl = '';

        if (messageReply && messageReply.attachments && messageReply.attachments[0] && messageReply.attachments[0].type === "photo") {
            imageUrl = messageReply.attachments[0].url;
        } else if (args[0]) {
            imageUrl = args.join(" ");
        }

        if (!imageUrl) {
            return api.sendMessage("❌ Photo reply karo ya image URL do", threadID, messageID);
        }

        const processingMsg = await api.sendMessage("🔄 Processing your image, please wait...", threadID);

        try {
            const configRes = await axios.get(nix);
            const baseApi = configRes.data && configRes.data.api;
            if (!baseApi) throw new Error("Configuration Error: Missing API in GitHub JSON.");

            const apiUrl = `${baseApi}/4k`;
            const d = await axios.get(`${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}`);
            
            if (!d.data.status) throw new Error(d.data.message || "API error");

            const enhancedUrl = d.data.enhancedImageUrl;
            const t = path.join(__dirname, `cache/${Date.now()}_4k.png`);
            
            const x = await axios.get(enhancedUrl, { responseType: "stream" });
            const w = fs.createWriteStream(t);
            x.data.pipe(w);

            await new Promise((res, rej) => {
                w.on("finish", res);
                w.on("error", rej);
            });

            await api.unsendMessage(processingMsg.messageID);

            await api.sendMessage({
                body: "✅ Your 4K upscaled image is ready!",
                attachment: fs.createReadStream(t)
            }, threadID, () => fs.unlinkSync(t), messageID);

        } catch (error) {
            console.error(error);
            api.unsendMessage(processingMsg.messageID);
            return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
        }
    }
};