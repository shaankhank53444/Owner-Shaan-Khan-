const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'autoYoutube',
        version: '1.1.0',
        author: 'Gemini',
        countDown: 5,
        role: 0,
        category: 'media',
        shortDescription: 'Auto detect and download YouTube videos from links'
    },

    // Ginagamit ang onChat para ma-detect ang bawat mensahe
    onChat: async function({ api, event }) {
        const { threadID, body, messageID, senderID } = event;

        if (!body || senderID === api.getCurrentUserID()) return;

        // Regex para sa YouTube links at Shorts
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/gi;
        const matches = body.match(youtubeRegex);

        if (!matches || matches.length === 0) return;

        const youtubeUrl = matches[0];
        const API_BASE = "https://yt-tt.onrender.com";

        const frames = [
            "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
            "💙▰▰▱▱▱▱▱▱▱▱ 25%",
            "💜▰▰▰▰▱▱▱▱▱▱ 45%",
            "💖▰▰▰▰▰▰▱▱▱▱ 70%",
            "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
        ];

        let statusMsg;
        try {
            statusMsg = await api.sendMessage(`🎬 YouTube Detected!\n\n${frames[0]}`, threadID, messageID);
        } catch (e) {
            return;
        }

        const maxRetries = 3;
        const cacheDir = path.join(__dirname, "cache"); // Karaniwang cache folder sa loob ng command folder
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const videoPath = path.join(cacheDir, `${Date.now()}_yt.mp4`);
            
            try {
                if (attempt > 1) {
                    await api.editMessage(`🎬 Retry ${attempt}/${maxRetries}...\n\n${frames[1]}`, statusMsg.messageID);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    await api.editMessage(`🎬 Downloading YouTube video...\n\n${frames[2]}`, statusMsg.messageID);
                }

                const response = await axios.get(`${API_BASE}/api/youtube/video`, {
                    params: { url: youtubeUrl },
                    timeout: 120000, // 2 minutes timeout
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.data || response.data.length < 1000) {
                    throw new Error("Invalid video data.");
                }

                fs.writeFileSync(videoPath, Buffer.from(response.data));

                await api.editMessage(`🎬 Processing...\n\n${frames[3]}`, statusMsg.messageID);
                await api.editMessage(`🎬 Complete!\n\n${frames[4]}`, statusMsg.messageID);

                await api.sendMessage({
                    body: `✅ Downloaded successfully!`,
                    attachment: fs.createReadStream(videoPath)
                }, threadID, () => {
                    // Burahin ang file at status message pagkatapos i-send
                    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                    api.unsendMessage(statusMsg.messageID);
                }, messageID);

                return;

            } catch (error) {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                console.error(`AutoYT Error (Attempt ${attempt}):`, error.message);

                if (attempt === maxRetries) {
                    await api.editMessage(`❌ Failed to download YouTube video after ${maxRetries} attempts.`, statusMsg.messageID);
                    setTimeout(() => api.unsendMessage(statusMsg.messageID), 5000);
                }
            }
        }
    },

    // Empty run function para hindi mag-error ang bot structure
    run: async function({}) {}
};
