const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "video",
    aliases: ["ytvideo"],
    version: "1.2.0",
    credit: "Shaan Khan",
    hasPrefix: true,
    permission: 'PUBLIC',
    description: "Download video from YouTube",
    category: "MEDIA",
    usages: "[song name/url]",
    cooldown: 5,
};

module.exports.run = async function ({ api, message, args }) {
    const { threadID, messageID } = message;
    const input = args.join(" ");

    if (!input) return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);

    const apiKey = "Apim_lMVCWhwof9LiGRe0ACecjSmGG8SKbiwcapncYjO8p0Q";
    const apiUrl = "https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download";

    const processingMsg = await api.sendMessage(`⏳ Processing...`, threadID, messageID);

    try {
        let videoUrl = input;
        let videoTitle = "Video";
        
        if (!input.startsWith("http")) {
            const search = await ytSearch(input);
            if (!search.videos.length) return api.sendMessage("❌ Video nahi mila.", threadID, messageID);
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
        }

        const response = await axios.post(apiUrl, {
            link: videoUrl,
            format: "mp4",
            videoQuality: "360"
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!response.data?.success) return api.sendMessage("❌ Download link nahi mila.", threadID, messageID);

        const downloadUrl = response.data.data.downloadUrl;
        const tempDir = path.join(__dirname, "temporary");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const filePath = path.join(tempDir, `${Date.now()}.mp4`);

        const writer = fs.createWriteStream(filePath);
        const videoRes = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
        videoRes.data.pipe(writer);

        writer.on("finish", async () => {
            api.sendMessage({
                body: `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${videoTitle}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                api.unsendMessage(processingMsg.messageID);
                fs.unlinkSync(filePath);
            });
        });

    } catch (e) {
        api.sendMessage("❌ Error: " + e.message, threadID, messageID);
    }
};
