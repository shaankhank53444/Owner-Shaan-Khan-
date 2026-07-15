const axios = require("axios");
const fs = require("fs-extra");
const yts = require("yt-search");

module.exports.config = {
    name: "video",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download video from YouTube (Up to 100MB)",
    commandCategory: "media",
    usages: "[link/text]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    if (!input) return api.sendMessage("❌ Please enter a song name or URL.", threadID, messageID);

    // ⏳ Reaction on start
    api.setMessageReaction("⏳", messageID, (err) => {}, true);
    const processingMsg = await api.sendMessage("🔍 Searching and processing...", threadID, messageID);

    try {
        let videoUrl = input;
        let videoTitle = "Video";

        if (!input.startsWith("http")) {
            const search = await yts(input);
            if (!search.videos.length) return api.sendMessage("❌ Video not found.", threadID, messageID);
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
        }

        const apiKey = "apim_3CsaiuPMabQOatjyJtysddLRWAPX5T2GC_wdeHZVMpE";
        const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;

        const res = await axios.post(apiUrl, { link: videoUrl, format: "mp4", videoQuality: "360" }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.data.success) return api.sendMessage("❌ Failed to get download link.", threadID, messageID);

        // Check file size limit (100MB)
        const head = await axios.head(res.data.data.downloadUrl);
        const fileSize = head.headers["content-length"];
        if (fileSize > 100 * 1024 * 1024) {
            return api.sendMessage("❌ File size is larger than 100MB. Try another video.", threadID, messageID);
        }

        const cacheDir = `${__dirname}/cache`;
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        const pathFile = `${cacheDir}/${Date.now()}.mp4`;

        const { data } = await axios.get(res.data.data.downloadUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(pathFile, Buffer.from(data, "utf-8"));

        // ✅ Reaction on success
        api.setMessageReaction("✅", messageID, (err) => {}, true);
        
        await api.sendMessage({
            body: `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${videoTitle}`,
            attachment: fs.createReadStream(pathFile)
        }, threadID);

        api.unsendMessage(processingMsg.messageID);
        fs.unlinkSync(pathFile);

    } catch (e) {
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        api.sendMessage("❌ Error: " + e.message, threadID, messageID);
    }
};
