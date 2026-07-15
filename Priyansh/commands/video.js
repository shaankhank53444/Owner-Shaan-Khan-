const axios = require("axios");
const fs = require("fs-extra"); // Mirai aksar fs-extra use karta hai
const yts = require("yt-search");

module.exports.config = {
    name: "video",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download video from YouTube",
    commandCategory: "media",
    usages: "[link/text]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    if (!input) return api.sendMessage("❌ Please enter a song name or URL.", threadID, messageID);

    const processingMsg = await api.sendMessage("⏳ Processing, please wait...", threadID, messageID);

    try {
        let videoUrl = input;
        let videoTitle = "Video";

        if (!input.startsWith("http")) {
            const search = await yts(input);
            if (!search.videos.length) return api.sendMessage("❌ Video not found.", threadID, messageID);
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
        }

        const apiKey = "Apim_lMVCWhwof9LiGRe0ACecjSmGG8SKbiwcapncYjO8p0Q";
        const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;

        const res = await axios.post(apiUrl, { link: videoUrl, format: "mp4", videoQuality: "360" }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.data.success) return api.sendMessage("❌ API Error.", threadID, messageID);

        const pathFile = `${__dirname}/cache/${Date.now()}.mp4`;
        const { data } = await axios.get(res.data.data.downloadUrl, { responseType: "arraybuffer" });
        
        fs.writeFileSync(pathFile, Buffer.from(data, "utf-8"));

        api.sendMessage({
            body: `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${videoTitle}`,
            attachment: fs.createReadStream(pathFile)
        }, threadID, () => {
            api.unsendMessage(processingMsg.messageID);
            fs.unlinkSync(pathFile);
        });

    } catch (e) {
        api.sendMessage("❌ Error: " + e.message, threadID, messageID);
    }
};
