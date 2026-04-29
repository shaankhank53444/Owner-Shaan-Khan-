const axios = require("axios");
const yts = require("yt-search");

const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";

module.exports.config = {
    name: "vid",
    version: "2.3.0",
    hasPermssion: 0,
    credits: "Uzair-Shaan",
    description: "Super Fast YouTube Video Downloader.",
    commandCategory: "Downloader",
    usages: "[video name]",
    cooldowns: 2, // Cooldown kam kar diya taaki jaldi use ho sake
    dependencies: {
        "axios": "",
        "yt-search": ""
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

    // Typing indicator aur sleep hata diya gaya hai speed ke liye
    api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
        // Search
        const search = await yts(query);
        if (!search.videos.length) throw new Error("Video nahi mili.");

        const video = search.videos[0]; 
        const videoUrl = video.url;

        // Download Link API
        const { data } = await axios.post(
            DOWNLOAD_API,
            { url: videoUrl },
            { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        if (!data || !data.success || !data.result) {
            throw new Error("Server response nahi de raha.");
        }

        const r = data.result;
        const file = await streamFromUrl(r.downloadUrl, "mp4");

        // Direct message send bina kisi delay ke
        api.sendMessage(
            {
                body: `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`,
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
