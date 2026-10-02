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
        const headers = { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" 
        };

        // Search API
        const searchRes = await axios.get(`https://uzairrajputapis.qzz.io/api/search/youtube?q=${encodeURIComponent(input)}`, { headers });
        
        const video = searchRes.data?.result?.[0] || searchRes.data?.[0];
        if (!video) throw new Error("Kuch nahi mila!");

        const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.id || video.videoId}`;

        // Downloader API
        let dlEndpoint = isVideo 
            ? `https://uzairrajputapis.qzz.io/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`
            : `https://uzairrajputapis.qzz.io/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`;

        const dlRes = await axios.get(dlEndpoint, { headers });

        // Link extraction
        const downloadUrl = dlRes.data?.result?.downloadUrl || dlRes.data?.result?.download_url || dlRes.data?.downloadUrl || dlRes.data?.url;
        
        if (!downloadUrl) throw new Error("Download link nahi mila.");

        // File Stream Download
        const writer = fs.createWriteStream(cachePath);
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });

        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const typeLabel = isVideo ? "VIDEO" : "MUSIC";
        const title = video.title || "YouTube Media";
        const artist = video.channel?.name || video.author?.name || "YouTube";
        
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${artist}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

        if (isVideo) {
            await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, messageID);
        } else {
            await api.sendMessage(infoMsg, threadID, messageID);
            await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID);
        }

    } catch (error) {
        api.sendMessage(`❌ Error: ${error.response?.status === 404 ? "API Endpoint Not Found (404)" : error.message}`, threadID, messageID);
    } finally {
        if (processingMsg && processingMsg.messageID) {
            api.unsendMessage(processingMsg.messageID).catch(() => {});
        }
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
};
