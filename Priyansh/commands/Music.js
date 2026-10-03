const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const API_BASE = "https://uzairrajputapis.qzz.io/api";

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
    let cachePath = path.join(cacheDir, `${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg = await new Promise(r =>
        api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID, (err, info) => r(info))
    );

    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        const searchRes = await axios.get(`${API_BASE}/search/youtube`, {
            params: { q: input },
            headers
        });

        const video = searchRes.data?.result?.[0];
        if (!video) throw new Error("Kuch nahi mila!");

        const endpoint = isVideo
            ? `${API_BASE}/downloader/youtube`
            : `${API_BASE}/downloader/ytmp3`;

        const dlRes = await axios.post(endpoint, { url: video.url }, { headers });
        const result = dlRes.data?.result;

        const media = isVideo
            ? (
                result?.videos?.find(item =>
                    item.format === "mp4" && item.quality === "720p" && item.downloadUrl
                ) ||
                result?.videos?.find(item =>
                    item.format === "mp4" && item.downloadUrl
                )
            )
            : (
                result?.audios?.find(item =>
                    item.format === "mp3" && item.downloadUrl
                ) ||
                result?.audios?.find(item =>
                    item.format === "m4a" && item.downloadUrl
                ) ||
                result?.audios?.find(item => item.downloadUrl)
            );

        const downloadUrl =
            media?.downloadUrl ||
            (isVideo ? result?.downloadUrl : result?.download_url);

        if (!downloadUrl) {
            throw new Error(dlRes.data?.message || "Download link nahi mila.");
        }

        const format = String(media?.format || "").toLowerCase();
        const extension = ["mp3", "m4a", "weba", "mp4", "webm"].includes(format)
            ? format
            : (isVideo ? "mp4" : "mp3");

        cachePath = path.join(cacheDir, `${Date.now()}.${extension}`);

        const writer = fs.createWriteStream(cachePath);
        const response = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
            headers
        });

        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const typeLabel = isVideo ? "VIDEO" : "MUSIC";
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.channel || video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

        if (isVideo) {
            await api.sendMessage(
                { body: infoMsg, attachment: fs.createReadStream(cachePath) },
                threadID,
                messageID
            );
        } else {
            await api.sendMessage(infoMsg, threadID, messageID);
            await api.sendMessage(
                { attachment: fs.createReadStream(cachePath) },
                threadID
            );
        }
    } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    } finally {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
};