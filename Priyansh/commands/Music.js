const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "music",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download Audio or Video",
    commandCategory: "Media",
    usages: "[name] or [name] video",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 NEW API ENDPOINTS
    const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
    const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
    const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name.", threadID, messageID);
    }

    let input = args.join(" ");
    let isVideo = false;

    if (input.toLowerCase().endsWith(" video")) {
        isVideo = true;
        input = input.slice(0, -6).trim(); 
    }

    const cacheDir = path.join(__dirname, "cache");
    const extension = isVideo ? "mp4" : "mp3";
    const fileName = `${Date.now()}.${extension}`;
    const cachePath = path.join(cacheDir, fileName);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg;
    try {
        api.setMessageReaction("⌛", messageID, (err) => {}, true);
        processingMsg = await api.sendMessage("✅ Searching and downloading, please wait...", threadID);

        // 1. Search for video using new API
        const searchRes = await axios.get(`${YT_SEARCH}?query=${encodeURIComponent(input)}`);
        const video = searchRes.data.result[0]; // Adjust based on your API response structure
        
        if (!video) {
            return api.sendMessage("❌ Song/Video not found.", threadID);
        }

        // 2. Determine download URL based on choice
        const downloadApi = isVideo ? VIDEO_API : AUDIO_API;
        const dlRes = await axios.get(`${downloadApi}?url=${encodeURIComponent(video.url)}`);
        const downloadUrl = dlRes.data.result.downloadUrl; // Adjust based on your API response structure

        // 3. Download the file
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author || "Unknown"}\n\n»»𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡««`;
            
            api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            });
            
            api.setMessageReaction("✅", messageID, (err) => {}, true);
            if (processingMsg) api.unsendMessage(processingMsg.messageID);
        });

    } catch (error) {
        console.error(error);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Error: ${error.message}`, threadID);
    }
};
