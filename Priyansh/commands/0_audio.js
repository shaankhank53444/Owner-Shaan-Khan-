const axios = require("axios");

module.exports.config = {
    name: "audio",
    version: "3.5.1",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader (Updated API)",
    commandCategory: "utility",
    usages: "[link]",
    usePrefix: true,
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const link = args.join(" ");

    if (!link) {
        return api.sendMessage("⚠️ Please provide a YouTube link!\nUsage: !audio [link]", threadID, messageID);
    }

    api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, messageID);

    try {
        // Sirf API endpoint badla gaya hai
        const res = await axios.get(`https://faheem-vip-010.vercel.app/api/yt-dl?url=${encodeURIComponent(link)}`);
        
        // Nayi API ke response structure ke mutabiq link nikalna
        const downloadUrl = res.data.data.downloadUrl || res.data.dlink || res.data.audio;

        if (!downloadUrl) {
            return api.sendMessage("❌ Error: API ne download link nahi di. Link check karein ya baad mein try karein.", threadID, messageID);
        }

        const stream = (await axios.get(downloadUrl, { responseType: "stream" })).data;

        return api.sendMessage({
            body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
            attachment: stream
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`⚠️ Server Error: ${err.message}`, threadID, messageID);
    }
};
