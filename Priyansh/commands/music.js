const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "music",
    version: "2.0.6",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download Audio or Video",
    commandCategory: "Media",
    usages: "[name] or [name] video",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // Updated API Endpoints
    const SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube";
    const VIDEO_DL_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
    const AUDIO_DL_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    if (!args.length) return api.sendMessage("❌ Naam likho.", threadID, messageID);

    let input = args.join(" ");
    let isVideo = false;
    if (input.toLowerCase().endsWith(" video")) {
        isVideo = true;
        input = input.slice(0, -6).trim(); 
    }

    const cacheDir = path.join(__dirname, "cache");
    const fileName = `${Date.now()}.${isVideo ? "mp4" : "mp3"}`;
    const cachePath = path.join(cacheDir, fileName);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

    try {
        // 1. Search API Call (q parameter ke saath)
        const searchRes = await axios.get(SEARCH_API, { params: { q: input }, headers });
        const video = searchRes.data.result[0];
        if (!video) throw new Error("Kuch nahi mila!");

        // 2. Download API Call
        const downloadApi = isVideo ? VIDEO_DL_API : AUDIO_DL_API;
        const dlRes = await axios.get(downloadApi, { params: { url: video.url }, headers });
        const downloadUrl = dlRes.data.result.downloadUrl;

        // 3. File download
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });
        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n»»»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰`;

            if (isVideo) {
                await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID);
            } else {
                await api.sendMessage(infoMsg, threadID);
                await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID);
            }
            api.unsendMessage(processingMsg.messageID);
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        });

    } catch (error) {
        api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Error: ${error.message}`, threadID);
        console.error(error);
    }
};
