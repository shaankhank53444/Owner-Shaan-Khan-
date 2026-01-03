const axios = require("axios");

module.exports.config = {
    name: "audio",
    version: "3.5.0",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader",
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
    api.sendMessage("⏳ Download shuru ho raha hai, thora intezar karein...", threadID, messageID);

    try {
        // API Call
        const res = await axios.get(`https://apis-ten-mocha.vercel.app/aryan/ytdl?url=${encodeURIComponent(link)}&type=audio`);
        
        if (!res.data || !res.data.downloadUrl) {
            return api.sendMessage("❌ Error: API ne download link nahi di. Shayad ye video blocked hai.", threadID, messageID);
        }

        const downloadUrl = res.data.downloadUrl;

        // Attachment download and send
        const stream = (await axios.get(downloadUrl, { responseType: "stream" })).data;

        return api.sendMessage({
            body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
            attachment: stream
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`⚠️ Server Error: ${err.message}\nHo sakta hai API band ho gayi ho.`, threadID, messageID);
    }
};
