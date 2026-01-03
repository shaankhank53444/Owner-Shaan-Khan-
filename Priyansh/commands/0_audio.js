const axios = require("axios");

module.exports.config = {
    name: "audio",
    version: "3.5.1", // Updated version
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

    // Processing status
    api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID, messageID);

    try {
        // Updated API Call with the new endpoint /aryan/yx
        const res = await axios.get(`https://apis-ten-mocha.vercel.app/aryan/yx?url=${encodeURIComponent(link)}`);
        
        // Check if data and dlink (common for this API) exist
        // Note: Agar API response mein 'downloadUrl' ki jagah 'dlink' ya 'audio' hai toh usey yahan change karein
        const downloadUrl = res.data.dlink || res.data.downloadUrl || res.data.audio;

        if (!downloadUrl) {
            return api.sendMessage("❌ Error: API ne download link nahi di. Link check karein ya baad mein try karein.", threadID, messageID);
        }

        // Attachment download and send
        const stream = (await axios.get(downloadUrl, { responseType: "stream" })).data;

        return api.sendMessage({
            body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
            attachment: stream
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`⚠️ Server Error: ${err.message}\nHo sakta hai API endpoint badal gaya ho ya server down ho.`, threadID, messageID);
    }
};
