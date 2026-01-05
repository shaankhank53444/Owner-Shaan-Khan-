const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "autoYoutube",
        version: "1.2.0",
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
            const cacheDir = path.join(__dirname, "cache");
            const filePath = path.join(cacheDir, `yt_${Date.now()}.mp4`);

            try {
                // Reaction dega taaki pata chale kaam ho raha hai
                api.setMessageReaction("📥", messageID, () => {}, true);

                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                // Yahan hum ek stable API use kar rahe hain jo aksar kaam karti hai
                const res = await axios.get(`https://api.kenliejugarap.com/ytdl/?url=${encodeURIComponent(youtubeUrl)}`);
                
                // Check karein ki video link mil raha hai ya nahi
                const downloadUrl = res.data.response?.links[0]?.link || res.data.response?.link;

                if (!downloadUrl) {
                    return api.sendMessage("❌ Video link nahi mil saka. Shayad video private hai ya API down hai.", threadID, messageID);
                }

                // Video download logic
                const videoData = await axios.get(downloadUrl, { responseType: "arraybuffer" });
                fs.writeFileSync(filePath, Buffer.from(videoData.data));

                const stats = fs.statSync(filePath);
                if (stats.size > 26214400) { // 25MB limit
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    return api.sendMessage("❌ File size 25MB se zyada hai, Messenger par nahi bhej sakte.", threadID, messageID);
                }

                return api.sendMessage({
                    body: "»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑻𝑬 𝑽𝑰𝑫𝑬𝑶👇",
                    attachment: fs.createReadStream(filePath)
                }, threadID, () => {
                    api.setMessageReaction("✅", messageID, () => {}, true);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }, messageID);

            } catch (err) {
                console.error(err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }
    },

    run: async function({}) {}
};
