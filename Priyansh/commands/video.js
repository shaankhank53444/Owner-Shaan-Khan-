const axios = require("axios");

const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";

module.exports.config = {
    name: "video",
    version: "2.3.1",
    hasPermssion: 0,
    credits: "Uzair-Shaan",
    description: "Super Fast YouTube Video Downloader.",
    commandCategory: "Downloader",
    usages: "[video name]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

function streamFromUrl(url, ext) {
    return axios
        .get(url, { responseType: "stream", timeout: 120000 })
        .then((res) => {
            res.data.path = `video.${ext}`;
            return res.data;
        });
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ").trim();

    if (!query) {
        return api.sendMessage("📥 Use: !vid <song name>", threadID, messageID);
    }

    api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
        // Updated Search logic using the requested URL
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl);
        
        // Note: Extracting the first video ID from raw HTML requires regex.
        // This is a simplified extraction pattern.
        const match = data.match(/"videoId":"(.*?)"/);
        if (!match || !match[1]) throw new Error("Video nahi mili.");
        
        const videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;

        // Download Link API
        const response = await axios.post(
            DOWNLOAD_API,
            { url: videoUrl },
            { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        if (!response.data || !response.data.success || !response.data.result) {
            throw new Error("Server response nahi de raha.");
        }

        const r = response.data.result;
        const file = await streamFromUrl(r.downloadUrl, "mp4");

        api.sendMessage(
            {
                body: `🖤 𝗧𝗶𝘁𝗹𝗲: Video Found\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`,
                attachment: file
            },
            threadID,
            () => api.setMessageReaction("✅", messageID, () => {}, true),
            messageID
        );

    } catch (err) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`⚠️ Error: ${err.message}`, threadID, messageID);
    }
};
