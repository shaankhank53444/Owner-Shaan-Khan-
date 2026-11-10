const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

const DOWNLOAD_API = "https://amir-api.space-z.ai/api/download";
const MAX_BYTES = 24_000_000; // Messenger ki ~25MB limit

module.exports.config = {
    name: "gana",
    version: "4.2.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "YouTube se Audio ya 360p Video download (New API)",
    commandCategory: "Media",
    usages: ".gana [song name] | .gana [song name] video",
    cooldowns: 5
};

function getExtensionFromResponse(response, fallback) {
    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];

    if (filename) {
        const cleanName = decodeURIComponent(filename.replace(/"/g, ""));
        const extension = path.extname(cleanName).slice(1);
        if (extension) return extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("audio/mpeg")) return "mp3";
    if (contentType.includes("audio/mp4") || contentType.includes("m4a")) return "m4a";
    if (contentType.includes("ogg") || contentType.includes("opus")) return "opus";
    if (contentType.includes("audio")) return "m4a";
    if (contentType.includes("video")) return "mp4";

    return fallback;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
        return api.sendMessage(
            "❌ Gaane ka naam likho!\n\n🎵 Audio: .gana <song name>\n🎬 Video: .gana <song name> video",
            threadID,
            messageID
        );
    }

    let isVideo = false;
    let input = args.join(" ");

    if (input.toLowerCase().endsWith(" video")) {
        isVideo = true;
        input = input.slice(0, -6).trim();
    }

    if (!input) {
        return api.sendMessage("❌ Gaane ka naam likho! Jaise: .gana pasoori ya .gana pasoori video", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    const cacheId = `${Date.now()}-${process.pid}`;
    const sourcePath = path.join(cacheDir, `${cacheId}.download`);
    let cachePath = null;

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg = await new Promise(resolve =>
        api.sendMessage(
            "✅ Apki Request Jari Hai Please Wait...",
            threadID,
            (err, info) => resolve(info)
        )
    );

    try {
        // YouTube search — npm package (yt-search)
        const searchResult = await yts(input);
        const video = searchResult?.videos?.[0];
        if (!video || !video.videoId) throw new Error("Kuch nahi mila! Dusra naam try karo.");

        // Nayi API: quality link ke aakhir mein — audio ke liye &audio, video ke liye &360
        const downloadUrl = isVideo
            ? `${DOWNLOAD_API}?url=${encodeURIComponent(video.url)}&360`
            : `${DOWNLOAD_API}?url=${encodeURIComponent(video.url)}&audio`;

        const response = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            timeout: 300000,
            maxRedirects: 5
        });

        const extension = getExtensionFromResponse(response, isVideo ? "mp4" : "m4a");
        cachePath = path.join(cacheDir, `${cacheId}.${extension}`);

        const writer = fs.createWriteStream(sourcePath);
        await new Promise((resolve, reject) => {
            response.data.on("error", reject);
            writer.on("error", reject);
            writer.on("finish", resolve);
            response.data.pipe(writer);
        });

        const fileSize = (await fs.stat(sourcePath)).size;
        if (fileSize === 0) throw new Error("API ne khali file bheji, dobara try karo.");
        if (fileSize > MAX_BYTES) {
            throw new Error("File 25MB se bari hai — koi chhoti video ya audio try karo.");
        }

        await fs.move(sourcePath, cachePath, { overwrite: true });

        const typeLabel = isVideo ? "🎬 𝗩𝗜𝗗𝗘𝗢 (360p)" : "🎵 𝗔𝗨𝗗𝗜𝗢";
        const artist = video.author?.name || "Unknown";
        const duration = video.timestamp ? `\n⏱ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}` : "";
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${artist}${duration}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

        if (isVideo) {
            // Video ke sath title ek sath send hoga (attachment ke andar body text)
            await api.sendMessage(
                { body: infoMsg, attachment: fs.createReadStream(cachePath) },
                threadID
            );
        } else {
            // Audio ke liye: pehle title send hoga, phir bina user reply ke audio file send hogi
            await api.sendMessage(infoMsg, threadID);
            await api.sendMessage(
                { attachment: fs.createReadStream(cachePath) },
                threadID
            );
        }

    } catch (error) {
        let msg = error.message || "Kuch ghalat ho gaya.";
        if (error.response) {
            if (error.response.status === 502 || error.response.status === 503) {
                msg = "API busy hai — thori dair baad dobara try karo.";
            } else if (error.response.status === 429) {
                msg = "Bohat zyada requests aa rahi hain — 1 minute baad try karo.";
            } else {
                msg = `API error (HTTP ${error.response.status}) — dobara try karo.`;
            }
        }
        api.sendMessage(`❌ Error: ${msg}`, threadID, messageID);
    } finally {
        if (processingMsg?.messageID) {
            api.unsendMessage(processingMsg.messageID).catch(() => {});
        }
        for (const f of [sourcePath, cachePath]) {
            if (f && fs.existsSync(f)) fs.unlinkSync(f);
        }
    }
};
