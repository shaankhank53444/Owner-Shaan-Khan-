const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { spawn } = require("child_process");

const SEARCH_API = "https://uzairrajputapis.qzz.io/api";
const DOWNLOAD_API = "https://amir-api.space-z.ai/api/download";
const MAX_VIDEO_BYTES = 24_000_000;

module.exports.config = {
    name: "gana",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download Audio (mp3) or 360p Video from YouTube",
    commandCategory: "Media",
    usages: "[song name] or [song name] video",
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

function getExtensionFromResponse(response, isVideo) {
    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];

    if (filename) {
        const cleanName = decodeURIComponent(filename.replace(/"/g, ""));
        const extension = path.extname(cleanName).slice(1);
        if (extension) return extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("audio")) return "mp3";
    if (contentType.includes("video")) return "mp4";

    return isVideo ? "mp4" : "mp3";
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) return api.sendMessage("❌ Song ka naam likho! Jaise: .gana [name] ya .gana [name] video", threadID, messageID);

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

        const searchRes = await axios.get(`${SEARCH_API}/search/youtube`, {
            params: { q: input },
            headers,
            timeout: 30000
        });

        const video = searchRes.data?.result?.[0];
        if (!video || !video.url) throw new Error("Kuch nahi mila!");

        const downloadUrl = isVideo 
            ? `${DOWNLOAD_API}?url=${encodeURIComponent(video.url)}&360`
            : `${DOWNLOAD_API}?url=${encodeURIComponent(video.url)}&audio`;

        const response = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
            headers,
            timeout: 120000,
            maxRedirects: 5
        });

        const extension = getExtensionFromResponse(response, isVideo);
        cachePath = path.join(cacheDir, `${cacheId}.${extension}`);

        const writer = fs.createWriteStream(sourcePath);
        await new Promise((resolve, reject) => {
            response.data.on("error", reject);
            writer.on("error", reject);
            writer.on("finish", resolve);
            
