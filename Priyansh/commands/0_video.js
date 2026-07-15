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

    // API Key setup
    const apiKey = "Apim_lMVCWhwof9LiGRe0ACecjSmGG8SKbiwcapncYjO8p0Q";
    const apiUrl = "https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download";

    const processingMsg = await api.sendMessage(`⏳ Processing...`, threadID, messageID);

    try {
        let videoUrl = input;
        if (!input.startsWith("http")) {
            const search = await ytSearch(input);
            if (!search.videos.length) return api.sendMessage("❌ Video nahi mila.", threadID, messageID);
            videoUrl = search.videos[0].url;
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
        const filePath = path.join(__dirname, "temporary", `${Date.now()}.mp4`);
        
        if (!fs.existsSync(path.join(__dirname, "temporary"))) fs.mkdirSync(path.join(__dirname, "temporary"));

        const writer = fs.createWriteStream(filePath);
        const videoRes = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
        videoRes.data.pipe(writer);

        writer.on("finish", async () => {
            api.sendMessage({
                body: "✅ Yeh raha aapka video:",
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
