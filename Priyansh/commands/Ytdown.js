const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "autoYoutube",
        eventType: ["message"],
        version: "1.0.0",
        credits: "Modified by ChatGPT",
        description: "Auto detect YouTube links & download video"
    },

    async run({ api, event }) {
        try {
            const { threadID, body, senderID } = event;
            if (!body) return;

            const botID = api.getCurrentUserID();
            if (senderID === botID) return;

            const youtubeRegex =
                /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+)/gi;

            const match = body.match(youtubeRegex);
            if (!match) return;

            const youtubeUrl = match[0];
            const API_BASE = "https://yt-tt.onrender.com";

            const status = await api.sendMessage(
                "🎬 YouTube link detected...\n⏳ Downloading video...",
                threadID
            );

            const res = await axios.get(`${API_BASE}/api/youtube/video`, {
                params: { url: youtubeUrl },
                responseType: "arraybuffer",
                timeout: 180000,
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            });

            if (!res.data || res.data.length < 1000) {
                return api.sendMessage("❌ Video download failed.", threadID);
            }

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);

            const filePath = path.join(
                cacheDir,
                `youtube_${Date.now()}.mp4`
            );

            fs.writeFileSync(filePath, Buffer.from(res.data));

            await api.sendMessage(
                {
                    body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑻𝑬 𝑽𝑰𝑫𝑬𝑶👇",
                    attachment: fs.createReadStream(filePath)
                },
                threadID
            );

            if (status?.messageID) {
                api.unsendMessage(status.messageID);
            }

            setTimeout(() => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, 15000);

        } catch (err) {
            console.log("AutoYoutube Error:", err.message);
        }
    }
};