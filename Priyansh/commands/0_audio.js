const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
    name: "audio",
    version: "3.5.2",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader (Updated)",
    commandCategory: "utility",
    usages: "[link]",
    usePrefix: true,
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const link = args.join(" ");

    if (!link) {
        return api.sendMessage("⚠️ Please provide a YouTube link!\nUsage: !audio [link]", threadID, messageID);
    }

    // --- Yeh raha aapka "Request Jari Hai" wala message ---
    api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, (err, info) => {
        
        // Processing logic starts here
        const downloadAudio = async () => {
            try {
                // Agar purani API 404 de rahi hai, toh yahan nayi API link dalni hogi
                const res = await axios.get(`https://faheem-vip-010.vercel.app/api/yt-dl?url=${encodeURIComponent(link)}`);
                
                const downloadUrl = res.data.data?.downloadUrl || res.data.dlink || res.data.audio;

                if (!downloadUrl) {
                    return api.sendMessage("❌ Error: API ne link nahi di. Shayad API down hai.", threadID, messageID);
                }

                const path = __dirname + `/cache/audio_${event.senderID}.mp3`;
                
                // File download kar ke cache mein save karna
                const response = await axios({
                    method: 'get',
                    url: downloadUrl,
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(path);
                response.data.pipe(writer);

                writer.on('finish', () => {
                    return api.sendMessage({
                        body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
                        attachment: fs.createReadStream(path)
                    }, threadID, () => {
                        if (fs.existsSync(path)) fs.unlinkSync(path); // File send hone ke baad delete kar dega
                    }, messageID);
                });

            } catch (err) {
                console.error(err);
                const errorMsg = err.response?.status === 404 
                    ? "⚠️ Error 404: API server band ho chuka hai (Not Found)." 
                    : `⚠️ Server Error: ${err.message}`;
                return api.sendMessage(errorMsg, threadID, messageID);
            }
        };

        downloadAudio();
    }, messageID);
};
