const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "audio",
    version: "3.5.3",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader (Enhanced Fix)",
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
            const API_BASE = "https://apis-ten-mocha.vercel.app/aryan/yx";
            
            // Step 1: API se data mangwana (JSON format mein handle karna behtar hai)
            const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(link)}`);
            
            // API response structure check karein (Agar link aata hai toh)
            const downloadUrl = res.data.downloadUrl || res.data.link || res.data.result; 

            // Step 2: Audio download karna
            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const filePath = path.join(cacheDir, `audio_${senderID}.mp3`);

            const audioRes = await axios.get(downloadUrl || link, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, Buffer.from(audioRes.data));

            // Step 3: File check aur Send
            if (fs.statSync(filePath).size > 26214400) { // 25MB limit check
                fs.unlinkSync(filePath);
                return api.sendMessage("❌ File size bahut badi hai (25MB se zyada).", threadID, messageID);
            }

            return api.sendMessage({
                body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, messageID);

        } catch (err) {
            console.error(err);
            return api.sendMessage(`⚠️ Error: Song send nahi ho saka. Shayad link invalid hai ya API down hai.`, threadID, messageID);
        }
    }, messageID);
};
