const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "music",
    version: "2.0.5",
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

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
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
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        // Search API
        const searchRes = await axios.get(`${YT_SEARCH}?query=${encodeURIComponent(input)}`);
        const video = searchRes.data.result[0];
        
        if (!video) {
            if (processingMsg) api.unsendMessage(processingMsg.messageID);
            return api.sendMessage("❌ Song/Video not found.", threadID);
        }

        // Download API
        const downloadApi = isVideo ? VIDEO_API : AUDIO_API;
        const dlRes = await axios.get(`${downloadApi}?url=${encodeURIComponent(video.url)}`);
        const downloadUrl = dlRes.data.result.downloadUrl;

        if (!downloadUrl) throw new Error("Download link not found.");

        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉 ${isVideo ? "VIDEO" : "SONG"}`;

        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            if (fileSizeInMB > 48) {
                api.setMessageReaction("❌", messageID, (err) => {}, true);
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
                return api.sendMessage(`⚠️ File size (${fileSizeInMB.toFixed(2)}MB) is too large.`, threadID);
            }

            if (isVideo) {
                api.sendMessage({
                    body: infoMsg,
                    attachment: fs.createReadStream(cachePath)
                }, threadID, () => {
                    api.setMessageReaction("✅", messageID, (err) => {}, true);
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                    if (processingMsg) api.unsendMessage(processingMsg.messageID);
                });
            } else {
                await api.sendMessage(infoMsg, threadID);
                api.sendMessage({
                    attachment: fs.createReadStream(cachePath)
                }, threadID, () => {
                    api.setMessageReaction("✅", messageID, (err) => {}, true);
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                    if (processingMsg) api.unsendMessage(processingMsg.messageID);
                });
            }
        });

    } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Failed: ${error.message}`, threadID);
    }
};
