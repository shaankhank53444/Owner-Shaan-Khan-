const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const https = require("https");

const TMP_DIR = path.join(process.cwd(), "uzair/mtx/song_tmp");
try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (_) {}

const BASE_API   = "https://uzairrajputapis.qzz.io/api";
const SEARCH_API = `${BASE_API}/search/youtube`;
const VIDEO_API  = `${BASE_API}/downloader/youtube`;
const AUDIO_API  = `${BASE_API}/downloader/ytmp3`;

const MAX_VIDEO_BYTES = 21 * 1024 * 1024; 

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

const keepHttp  = new http.Agent({ keepAlive: true });
const keepHttps = new https.Agent({ keepAlive: true });

const req = (opts) => axios({
    maxRedirects: 5,
    timeout: 30000,
    headers: { "User-Agent": UA },
    httpAgent: keepHttp,
    httpsAgent: keepHttps,
    ...opts
});

const trim = (s, n = 40) => {
    s = String(s || "").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

module.exports.config = {
    name: "music",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Uzair Rajput",
    description: "YouTube se audio ya video download karo",
    commandCategory: "media",
    usages: "song [naam]  |  song [naam] video",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
        return api.sendMessage(
            "📌 Istemal:\n• song [naam] → audio\n• song [naam] video → video",
            threadID, messageID
        );
    }

    const isVideo = args[args.length - 1].toLowerCase() === "video";
    const query   = isVideo ? args.slice(0, -1).join(" ") : args.join(" ");

    if (!query.trim()) {
        return api.sendMessage("❌ Koi naam toh likho bhai!", threadID, messageID);
    }

    const waitMsg = await new Promise(r =>
        api.sendMessage(
            `✅ "${trim(query, 30)}" Apki Request Jari Hai Please Wait`,
            threadID, (err, info) => r(info)
        )
    );

    const tmpFile = path.join(TMP_DIR, `${Date.now()}_${Math.random().toString(36).slice(2)}.${isVideo ? "mp4" : "mp3"}`);

    try {
        const searchRes = await req({
            url: SEARCH_API,
            params: { q: query }
        });

        const results = searchRes.data?.result;
        if (!results || !results.length) throw new Error("Koi result nahi mila");

        const first = results[0];
        const ytUrl  = first.url;
        const title  = trim(first.title, 45);
        const channel = trim(first.channel || "Unknown", 30);
        const duration = first.duration || "—";
        const views    = first.views || "—";

        if (isVideo) {
            const dlRes = await req({ method: "POST", url: VIDEO_API, data: { url: ytUrl } });
            const dlData = dlRes.data?.result;
            if (!dlData?.downloadUrl) throw new Error("Video download link nahi mila");

            const videoStream = await req({
                url: dlData.downloadUrl,
                responseType: "stream",
                timeout: 120000
            });

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(tmpFile);
                videoStream.data.pipe(writer);
                writer.on("finish", resolve);
                writer.on("error", reject);
                videoStream.data.on("error", reject);
            });

            const stat = await fs.stat(tmpFile);
            if (stat.size > MAX_VIDEO_BYTES) {
                await fs.remove(tmpFile).catch(() => {});
                if (waitMsg) api.unsendMessage(waitMsg.messageID).catch(() => {});
                return api.sendMessage(
                    `❌ Video bara hai (${(stat.size / 1024 / 1024).toFixed(1)} MB) — 21 MB se zyada nahi bheja ja sakta.\n💡 Audio ke liye: song ${query}`,
                    threadID, messageID
                );
            }

            const card =
                `🎬 ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅ\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎞️  ${title}\n` +
                `📺  ${channel}\n` +
                `⏱️  ${duration}  •  👁️ ${views}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🦋 𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍-𝐊`;

            if (waitMsg) api.unsendMessage(waitMsg.messageID).catch(() => {});

            await new Promise((resolve, reject) =>
                api.sendMessage(
                    { body: card, attachment: fs.createReadStream(tmpFile) },
                    threadID, (err) => { err ? reject(err) : resolve(); }, messageID
                )
            );

        } else {
            const dlRes = await req({ method: "POST", url: AUDIO_API, data: { url: ytUrl } });
            const dlData = dlRes.data?.result;
            if (!dlData?.download_url) throw new Error("Audio download link nahi mila");

            const audioStream = await req({
                url: dlData.download_url,
                responseType: "stream",
                timeout: 120000
            });

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(tmpFile);
                audioStream.data.pipe(writer);
                writer.on("finish", resolve);
                writer.on("error", reject);
                audioStream.data.on("error", reject);
            });

            const stat = await fs.stat(tmpFile);

            const card =
                `🎵 ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅ\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎶  ${title}\n` +
                `🎤  ${channel}\n` +
                `⏱️  ${duration}  •  👁️ ${views}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🦋 𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍-𝐊`;

            if (waitMsg) api.unsendMessage(waitMsg.messageID).catch(() => {});

            await new Promise((resolve, reject) =>
                api.sendMessage(
                    { body: card, attachment: fs.createReadStream(tmpFile) },
                    threadID, (err) => { err ? reject(err) : resolve(); }, messageID
                )
            );
        }

    } catch (err) {
        if (waitMsg) api.unsendMessage(waitMsg.messageID).catch(() => {});
        api.sendMessage(
            `❌ Kuch masla aa gaya:\n${err.message || "Unknown error"}\n\nDobara try karo!`,
            threadID, messageID
        );
    } finally {
        fs.remove(tmpFile).catch(() => {});
    }
};