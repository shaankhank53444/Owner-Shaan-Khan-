const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "audio",
    version: "3.5.4",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader (Type Parameter Fix)",
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

    api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, async (err, info) => {
        try {
            const API_URL = "https://apis-ten-mocha.vercel.app/aryan/yx";
            
            // --- FIX: Added 'type' parameter as required by API ---
            const response = await axios.get(API_URL, {
                params: {
                    url: link,
                    type: "mp3" // API ko batana padega ke mp3 chahiye
                }
            });

            // API se download link nikalna (Response format check karein)
            const downloadUrl = response.data.downloadUrl || response.data.link || response.data.data;

            if (!downloadUrl) {
                return api.sendMessage("❌ Error: API ne download link nahi diya. Shayad song bohot bada hai.", threadID, messageID);
            }

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const filePath = path.join(cacheDir, `audio_${senderID}.mp3`);

            // Actual audio file download karna
            const audioStream = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, Buffer.from(audioStream.data));

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
