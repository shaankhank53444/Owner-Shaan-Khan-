const fs = require("fs-extra");
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

    if (!args.length) return api.sendMessage("❌ Naam likho.", threadID, messageID);

    let isVideo = false;
    let input = args.join(" ");
    if (input.toLowerCase().endsWith(" video")) {
        isVideo = true;
        input = input.slice(0, -6).trim();
    }

    const cacheDir = path.join(__dirname, "cache");
    const cachePath = path.join(cacheDir, `${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg = await new Promise(r => api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID, (err, info) => r(info)));

    try {
        const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" };
        
        const searchRes = await axios.get("https://uzairrajputapis.qzz.io/api/search/youtube", { params: { q: input }, headers });
        const video = searchRes.data.result[0];
        if (!video) throw new Error("Kuch nahi mila!");

        const dlRes = await axios.post(isVideo ? "https://uzairrajputapis.qzz.io/api/downloader/youtube" : "https://uzairrajputapis.qzz.io/api/downloader/ytmp3", { url: video.url }, { headers });
        const downloadUrl = isVideo ? dlRes.data.result.downloadUrl : dlRes.data.result.download_url;
        if (!downloadUrl) throw new Error("Download link nahi mila.");

        const writer = fs.createWriteStream(cachePath);
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });
        
        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.channel || video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${isVideo ? "👉VIDEO" : "👉MUSIC"} `;
        
        if (isVideo) {
            await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, messageID);
        } else {
            await api.sendMessage(infoMsg, threadID, messageID);
            await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID);
        }

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    } finally {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
};
