const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "video",
    aliases: ["ytvideo", "v"],
    version: "2.0.0",
    credits: "Shaan Khan",
    hasPermssion: 0,
    commandCategory: "Media",
    description: "Download video (Prefix + No Prefix)",
    usages: "[video name/URL]",
    cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const lowerBody = body.toLowerCase();
    const triggers = ["pika video bhej", "shaan video bhej", "bot video bhej", "pika pi video bhej"];
    
    // Check if message starts with any trigger (No Prefix Logic)
    for (const trigger of triggers) {
        if (lowerBody.startsWith(trigger)) {
            const videoName = lowerBody.replace(trigger, "").trim();
            if (videoName) {
                return this.run({ api, event, args: [videoName] });
            }
        }
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 API KEY
    const PRIYANSHU_API_KEY = "apim_D8RruLJuW6YNXTuYjk5QWOUwC6sYATXveIkM8lUNRZQ"; 

    if (!args.length) {
        return api.sendMessage("❌ Please enter a video name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    const fileName = `${Date.now()}.mp4`;
    const cachePath = path.join(cacheDir, fileName);
    
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg;
    try {
        api.setMessageReaction("⌛", messageID, (err) => {}, true);
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        // 1. YouTube Search
        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            if (processingMsg) api.unsendMessage(processingMsg.messageID);
            return api.sendMessage("❌ Video not found.", threadID, messageID);
        }
        
        const video = searchResult.videos[0];
        const videoUrl = video.url;

        // 2. API Call
        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        const response = await axios.post(apiUrl, {
            url: videoUrl,
            format: "mp4",
            videoQuality: "360"
        }, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) throw new Error("Download link error.");

        // 3. Info Message
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀
        𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`;

        // 4. Download Stream
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: data.downloadUrl,
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
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                return api.sendMessage("⚠️ Video file is too large.", threadID, messageID);
            }

            api.sendMessage({
                body: infoMsg,
                attachment: fs.createReadStream(cachePath)
            }, threadID, (err) => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
                if (!err) api.setMessageReaction("✅", messageID, (err) => {}, true);
            }, messageID);
        });

        writer.on("error", (err) => { throw err; });

    } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Failed: ${error.message}`, threadID, messageID);
    }
};
