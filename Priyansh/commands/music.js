const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "music",
    version: "2.0.7",
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

        // 1. YouTube Search API
        const searchRes = await axios.get("https://yt-dlp-api.vercel.app/search", { params: { q: input }, headers });
        const video = searchRes.data.results?.[0] || searchRes.data?.[0];
        if (!video) throw new Error("Kuch nahi mila!");

        const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;

        // 2. YouTube Downloader API (Audio vs Video)
        const apiUrl = isVideo 
            ? `https://api.cobalt.tools/api/json` 
            : `https://api.cobalt.tools/api/json`;

        const dlRes = await axios.post("https://api.cobalt.tools/api/json", {
            url: videoUrl,
            downloadMode: isVideo ? "auto" : "audio",
            audioFormat: "mp3"
        }, {
            headers: {
                ...headers,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        const downloadUrl = dlRes.data?.url;
        if (!downloadUrl) throw new Error("Download link nahi mila.");

        // File download & caching
        const writer = fs.createWriteStream(cachePath);
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });

        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const typeLabel = isVideo ? "VIDEO" : "MUSIC";
        const title = video.title || "YouTube Media";
        const artist = video.channelTitle || video.author?.name || "Unknown Artist";
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${artist}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

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
