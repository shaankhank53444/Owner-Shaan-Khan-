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

    // Mirai bot events ke liye handleEvent use karta hai
    handleEvent: async function({ api, event }) {
        const { threadID, body, senderID, messageID } = event;
        if (!body) return;

        const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+)/gi;
        const match = body.match(youtubeRegex);

        if (match && senderID !== api.getCurrentUserID()) {
            const youtubeUrl = match[0];
            const API_BASE = "https://yt-tt.onrender.com"; // Ensure this API is working
            const cacheDir = path.join(__dirname, "cache");
            const filePath = path.join(cacheDir, `yt_${Date.now()}.mp4`);

            try {
                // Status message
                api.sendMessage("🎬 YouTube link detected! Downloading...", threadID, messageID);

                const res = await axios.get(`${API_BASE}/api/youtube/video`, {
                    params: { url: youtubeUrl },
                    responseType: "arraybuffer"
                });

                await fs.ensureDir(cacheDir);
                fs.writeFileSync(filePath, Buffer.from(res.data));

                // Check file size (FB limit ~25MB)
                const stats = fs.statSync(filePath);
                if (stats.size > 26214400) {
                    fs.unlinkSync(filePath);
                    return api.sendMessage("❌ File size is too large to send via Facebook.", threadID);
                }

                await api.sendMessage({
                    body: "»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑻𝑬 𝑽𝑰𝑫𝑬𝑶👇",
                    attachment: fs.createReadStream(filePath)
                }, threadID);

                // Delete file after sending
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            } catch (err) {
                console.error("YT Download Error:", err);
                // api.sendMessage("❌ Error downloading video.", threadID);
            }
        }
    },

    // Empty run function required for Mirai modules
    run: async function({}) {}
};
