const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "autoYoutube",
        version: "1.0.0",
        role: 0,
        credits: "Modified",
        description: "Auto detect YouTube links & download video",
        category: "media",
        hasPrefix: false,
        wait: 0
    },

    handleEvent: async function({ api, event }) {
        const { threadID, body, senderID, messageID } = event;
        if (!body || senderID == api.getCurrentUserID()) return;

        const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+)/gi;
        const match = body.match(youtubeRegex);

        if (match) {
            const youtubeUrl = match[0];
            const API_BASE = "https://yt-tt.onrender.com"; 
            const cacheDir = path.join(__dirname, "cache");
            const filePath = path.join(cacheDir, `yt_${Date.now()}.mp4`);

            try {
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                const res = await axios.get(`${API_BASE}/api/youtube/video`, {
                    params: { url: youtubeUrl },
                    responseType: "arraybuffer"
                });

                fs.writeFileSync(filePath, Buffer.from(res.data));

                const stats = fs.statSync(filePath);
                if (stats.size > 26214400) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    return api.sendMessage("❌ File size is too large (Limit: 25MB)", threadID, messageID);
                }

                return api.sendMessage({
                    body: "»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑻𝑬 𝑽𝑰𝑫𝑬𝑶👇",
                    attachment: fs.createReadStream(filePath)
                }, threadID, () => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }, messageID);

            } catch (err) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }
    },

    run: async function({}) {}
};
