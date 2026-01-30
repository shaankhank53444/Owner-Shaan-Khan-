const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "youtube",
        version: "1.1.0",
        hasPermssion: 0,
        credits: "Shaan Khan",
        description: "YouTube links se video download karein automatically",
        commandCategory: "media",
        usages: "[link]",
        cooldowns: 5
    },

    run: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const youtubeUrl = args[0];

        // 1. URL Check
        if (!youtubeUrl) {
            return api.sendMessage("⚠️ Please provide a YouTube link after the command.\n\nExample: /youtube https://youtu.be/xxx", threadID, messageID);
        }

        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/gi;
        if (!youtubeRegex.test(youtubeUrl)) {
            return api.sendMessage("❌ Invalid YouTube URL! Please provide a valid link.", threadID, messageID);
        }

        const API_BASE = "https://yt-tt.onrender.com";
        const waitMsg = await api.sendMessage("📥 | Video fetch ho rahi hai, please wait...", threadID);

        try {
            // 2. Requesting Data from API
            const response = await axios.get(`${API_BASE}/api/youtube/video`, {
                params: { url: youtubeUrl },
                timeout: 300000, // 5 minute limit for slow servers
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            });

            // 3. Size Validation
            if (!response.data || response.data.byteLength < 1000) {
                throw new Error("Video download nahi ho saki ya link expired hai.");
            }

            // 4. Cache Path Setup
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            
            const fileName = `${Date.now()}_YT_Video.mp4`;
            const videoPath = path.join(cacheDir, fileName);

            // 5. Saving and Sending
            fs.writeFileSync(videoPath, Buffer.from(response.data));

            await api.sendMessage({
                body: `✅ Video Downloaded Successfully!\n👤 Created by: Shaan Khan`,
                attachment: fs.createReadStream(videoPath)
            }, threadID, () => {
                // Cleanup: File and Status Message delete karein
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                api.unsendMessage(waitMsg.messageID);
            }, messageID);

        } catch (error) {
            console.error("YT ERROR:", error.message);
            api.editMessage(`❌ Error: Download fail ho gaya.\n\nWajah: API offline ho sakti hai ya video size 25MB se zyada hai.`, waitMsg.messageID, threadID);
            
            // Cleanup on fail
            const errorCache = path.join(__dirname, "cache", `${Date.now()}_YT_Video.mp4`);
            if (fs.existsSync(errorCache)) fs.unlinkSync(errorCache);
        }
    }
};
