const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "audio",
    version: "3.5.2",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader (Render API Fix)",
    commandCategory: "utility",
    usages: "[link]",
    usePrefix: true,
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const link = args.join(" ");

    if (!link) {
        return api.sendMessage("⚠️ Please provide a YouTube link!\nUsage: !audio [link]", threadID, messageID);
    }

    // --- Fixed Message: Apki Request Jari Hai ---
    api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, async (err, info) => {
        
        try {
            // Music file wali API ka use
            const API_BASE = "https://yt-tt.onrender.com";
            
            const response = await axios.get(`${API_BASE}/api/youtube/audio`, {
                params: { url: link },
                timeout: 60000,
                responseType: 'arraybuffer'
            });

            if (!response.data) {
                return api.sendMessage("❌ Error: API server response nahi de raha.", threadID, messageID);
            }

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const filePath = path.join(cacheDir, `audio_${senderID}.mp3`);

            // File save karna
            fs.writeFileSync(filePath, Buffer.from(response.data));

            // File send karna
            return api.sendMessage({
                body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, messageID);

        } catch (err) {
            console.error(err);
            return api.sendMessage(`⚠️ Server Error: ${err.message}`, threadID, messageID);
        }
    }, messageID);
};
