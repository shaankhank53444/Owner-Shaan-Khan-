const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "music",
    version: "2.2.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download Audio or Video (Mirai Structure)",
    commandCategory: "Media",
    usages: "[name] or [name] video",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": "",
        "axios": "",
        "yt-search": ""
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 Mirai Structure ke mutabiq config se key uthana
    // Agar config.json mein "Priyansh": "key" hai toh ye kaam karega
    const PRIYANSHU_API_KEY = global.config["Priyansh"]; 

    if (!PRIYANSHU_API_KEY) {
        return api.sendMessage("❌ [Mirai Config Error]: config.json mein 'Priyansh' key nahi mili. Please check karein ke apne sahi spelling likhi hai.", threadID, messageID);
    }

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
        if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
            if (processingMsg) api.unsendMessage(processingMsg.messageID);
            return api.sendMessage("❌ Result nahi mila.", threadID, messageID);
        }

        const video = searchResult.videos[0];
        const videoUrl = video.url;

        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        const payload = {
            url: videoUrl,
            format: isVideo ? "mp4" : "mp3",
            quality: isVideo ? "360" : "320"
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) throw new Error("API ne link nahi diya.");

        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉 ${isVideo ? "VIDEO" : "SONG"}`;

        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: data.downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            if (stats.size > 100 * 1024 * 1024) {
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
                return api.sendMessage(`⚠️ File bari hai (${fileSizeInMB}MB). Download Link:\n${data.downloadUrl}`, threadID, messageID);
            }

            if (isVideo) {
                api.sendMessage({
                    body: infoMsg,
                    attachment: fs.createReadStream(cachePath)
                }, threadID, (err) => {
                    if (err) api.sendMessage(`❌ Messenger failed. Link:\n${data.downloadUrl}`, threadID, messageID);
                    else if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
                    
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                    if (processingMsg) api.unsendMessage(processingMsg.messageID);
                }, messageID);
            } else {
                await api.sendMessage(infoMsg, threadID);
                api.sendMessage({
                    attachment: fs.createReadStream(cachePath)
                }, threadID, (err) => {
                    if (err) api.sendMessage(`❌ Audio error. Link:\n${data.downloadUrl}`, threadID, messageID);
                    else if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
                    
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                    if (processingMsg) api.unsendMessage(processingMsg.messageID);
                });
            }
        });

    } catch (error) {
        console.error(error);
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};
