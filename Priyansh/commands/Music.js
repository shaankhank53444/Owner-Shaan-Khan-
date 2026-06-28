111const fs = require("fs-extra");
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

    const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
    const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
    const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";

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

    let processingMsg = await api.sendMessage("⏳ Search ho raha hai, wait karo...", threadID);

    try {
        // Search API call
        const searchRes = await axios.get(YT_SEARCH, { params: { query: input }, headers });
        const video = searchRes.data.result[0];
        if (!video) throw new Error("Kuch nahi mila!");

        // Download API call
        const downloadApi = isVideo ? VIDEO_API : AUDIO_API;
        const dlRes = await axios.get(downloadApi, { params: { url: video.url }, headers });
        const downloadUrl = dlRes.data.result.downloadUrl;

        // File download
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });
        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n»»𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡««`;
            
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
