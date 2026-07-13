const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "play",
    aliases: ["yt", "ytmusic"],
    version: "1.0.0",
    credit: "Shaan khan",
    description: "Download music from YouTube",
    hasPrefix: true,
    permission: 'PUBLIC',
    category: "MEDIA",
    usages: "[url/song name]",
    cooldown: 5,
};

module.exports.run = async function ({ api, message, args }) {
    const { threadID, messageID } = message;

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const searchingMessageInfo = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...`, threadID, messageID);

    try {
        let videoUrl = input;
        let videoTitle = "";

        // Check if input is a URL
        const isUrl = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/.test(input);

        if (!isUrl) {
            const searchResult = await ytSearch(input);
            if (!searchResult || !searchResult.videos.length) {
                api.unsendMessage(searchingMessageInfo.messageID);
                return api.sendMessage("❌ Song not found on YouTube.", threadID, messageID);
            }
            videoUrl = searchResult.videos[0].url;
            videoTitle = searchResult.videos[0].title;
        }

        const BASE_URL = "https://priyanshuapi.qzz.io/api";
        const API_KEY = "apim_xyXGvJGqxWucOcaoLjtIHTUFNOaOKyRYnM04GfjsNq0";

        const apiUrl = `${BASE_URL}/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=${API_KEY}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.result) {
            api.unsendMessage(searchingMessageInfo.messageID);
            return api.sendMessage("❌ Failed to fetch download link.", threadID, messageID);
        }

        const downloadUrl = response.data.result.downloadUrl || response.data.result.url;
        const finalTitle = videoTitle || response.data.result.title || "Audio File";

        // File Path Setup
        const tempDir = path.join(__dirname, "temporary");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const filePath = path.join(tempDir, `${Date.now()}.mp3`);

        // Download Audio
        const downloadResponse = await axios({
            method: "GET",
            url: downloadUrl,
            responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        downloadResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const caption = `🖤 Title: ${finalTitle}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝗛𝑨𝗔𝑵 𝑲𝗛𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉PLAY-LIST`;

            await api.sendMessage({
                body: caption,
                attachment: fs.createReadStream(filePath)
            }, threadID);

            // Cleanup: File bhejnew ke baad delete
            fs.unlinkSync(filePath);
            api.unsendMessage(searchingMessageInfo.messageID);
        });

        writer.on("error", (err) => {
            api.unsendMessage(searchingMessageInfo.messageID);
            api.sendMessage("❌ Error during download: " + err.message, threadID, messageID);
        });

    } catch (error) {
        api.unsendMessage(searchingMessageInfo.messageID);
        api.sendMessage("❌ Error: " + error.message, threadID, messageID);
    }
};
