const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { spawn } = require("child_process");

const API_BASE = "https://uzairrajputapis.qzz.io/api";
const MAX_VIDEO_BYTES = 24_000_000;

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

function parseDuration(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }

    const parts = String(value || "").trim().split(":").map(Number);
    if (!parts.length || parts.some(part => !Number.isFinite(part))) return null;

    const seconds = parts.reduce((total, part) => total * 60 + part, 0);
    return seconds > 0 ? seconds : null;
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";

        child.stdout.on("data", chunk => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", chunk => {
            stderr = (stderr + chunk.toString()).slice(-4000);
        });

        child.on("error", error => {
            if (error.code === "ENOENT") {
                reject(new Error("Bot server par FFmpeg aur FFprobe install hone chahiye."));
                return;
            }
            reject(error);
        });

        child.on("close", code => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(stderr.trim() || `${command} process fail ho gaya.`));
            }
        });
    });
}

async function getDurationSeconds(filePath, durationHint) {
    const fromSearch = parseDuration(durationHint);
    if (fromSearch) return fromSearch;

    const output = await runCommand("ffprobe", [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        filePath
    ]);

    const duration = Number(output);
    if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("Video ki duration read nahi ho saki.");
    }

    return duration;
}

async function compressVideo(sourcePath, outputPath, durationHint) {
    const duration = await getDurationSeconds(sourcePath, durationHint);
    let videoKbps = Math.max(
        24,
        Math.floor(((MAX_VIDEO_BYTES * 8 / duration) * 0.9 - 48_000) / 1000)
    );

    for (let attempt = 0; attempt < 2; attempt++) {
        await runCommand("ffmpeg", [
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", sourcePath,
            "-map", "0:v:0",
            "-map", "0:a:0?",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-b:v", `${videoKbps}k`,
            "-maxrate", `${videoKbps}k`,
            "-bufsize", `${videoKbps * 2}k`,
            "-c:a", "aac",
            "-b:a", "48k",
            "-threads", "2",
            "-movflags", "+faststart",
            outputPath
        ]);

        const outputSize = (await fs.stat(outputPath)).size;
        if (outputSize < 25_000_000) return;

        videoKbps = Math.max(
            24,
            Math.floor(videoKbps * (MAX_VIDEO_BYTES / outputSize) * 0.9)
        );
    }

    throw new Error("Video 25 MB se kam nahi ho saki; is video ko bheja nahi gaya.");
}

function getExtension(media, response) {
    const format = String(media?.format || "").trim();
    if (format) return format.toLowerCase().replace(/[^a-z0-9]/g, "");

    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];

    if (filename) {
        const cleanName = decodeURIComponent(filename.replace(/"/g, ""));
        const extension = path.extname(cleanName).slice(1);
        if (extension) return extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    return String(response.headers["content-type"] || "")
        .split(";")[0]
        .split("/")
        .pop()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

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
    const cacheId = `${Date.now()}-${process.pid}`;
    const sourcePath = path.join(cacheDir, `${cacheId}.source`);
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
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        const searchRes = await axios.get(`${API_BASE}/search/youtube`, {
            params: { q: input },
            headers,
            timeout: 30000
        });

        const video = searchRes.data?.result?.[0];
        if (!video) throw new Error("Kuch nahi mila!");

        const endpoint = isVideo
            ? `${API_BASE}/downloader/youtube`
            : `${API_BASE}/downloader/ytmp3`;

        const dlRes = await axios.post(endpoint, { url: video.url }, {
            headers,
            timeout: 90000
        });

        const result = dlRes.data?.result;
        const media = isVideo
            ? result?.videos?.find(item =>
                /720p/i.test(String(item.quality || "")) && item.downloadUrl
            )
            : result?.audios
                ?.filter(item => item.downloadUrl)
                .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))[0];

        const downloadUrl =
            media?.downloadUrl ||
            (isVideo ? result?.downloadUrl : result?.download_url);

        if (!downloadUrl) {
            throw new Error(dlRes.data?.message || "Download link nahi mila.");
        }

        const response = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
            headers,
            timeout: 120000,
            maxRedirects: 5
        });

        const extension = getExtension(media, response);
        if (!extension) throw new Error("API ne file format nahi diya.");

        cachePath = path.join(cacheDir, `${cacheId}.${extension}`);

        const writer = fs.createWriteStream(sourcePath);
        await new Promise((resolve, reject) => {
            response.data.on("error", reject);
            writer.on("error", reject);
            writer.on("finish", resolve);
            response.data.pipe(writer);
        });

        if (isVideo) {
            const sourceSize = (await fs.stat(sourcePath)).size;

            if (sourceSize < 25_000_000) {
                await fs.move(sourcePath, cachePath, { overwrite: true });
            } else {
                await compressVideo(sourcePath, cachePath, video.duration);
            }

            const finalSize = (await fs.stat(cachePath)).size;
            if (finalSize >= 25_000_000) {
                throw new Error("Video 25 MB se kam nahi ho saki; is video ko bheja nahi gaya.");
            }
        } else {
            await fs.move(sourcePath, cachePath, { overwrite: true });
        }

        const typeLabel = isVideo ? "VIDEO" : "MUSIC";
        const artist = video.channel || video.author?.name || "Unknown";
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${artist}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

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
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        if (cachePath && fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
};