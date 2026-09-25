const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Render wali APIs
const AUDIO_API = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/download/dlmp3";
const YT_SEARCH = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/api/search";

async function getStreamFromURL(url, pathName) {
    const response = await axios.get(url, {
        responseType: "stream",
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });
    response.data.path = pathName;
    return response.data;
}

function getVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "song",
    version: "2.5.0",
    credits: "SHAAN-KHAN",
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader (Prefix & No Prefix)",
    commandCategory: "media",
    usages: "song [Song Name] / !song [Song Name]"
};

// --- Logic for Prefix & No Prefix ---
module.exports.handleEvent = async function({ api, event, client }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();

    if (body.startsWith("song ")) {
        const query = event.body.slice(5).trim();
        if (!query) return;

        return this.run({
            api,
            event,
            args: [query.split(" ")]
        });
    }
};

// --- Main Command Logic ---
module.exports.run = async function({ api, args, event }) {
    try {
        const query = args.join(" ");

        if (!query) {
            return api.sendMessage(
                "❌ Gane ka naam ya link dein!",
                event.threadID
            );
        }

        let videoURL = query;

        let searchMsg = await api.sendMessage(
            "✅ Apki Request Jari Hai Please wait...",
            event.threadID
        );

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36"
        };

        // YouTube URL nahi hai to Render Search API use hogi
        if (!getVideoID(query)) {
            const { data } = await axios.get(YT_SEARCH, {
                params: {
                    query: query,
                    type: "mp3"
                },
                headers
            });

            // Render API ke possible response formats
            const videos =
                data?.result?.videos ||
                data?.result?.items ||
                data?.results ||
                data?.result;

            let video = null;

            if (Array.isArray(videos)) {
                video = videos[0];
            } else if (videos && typeof videos === "object") {
                video = videos;
            }

            if (!video) {
                if (searchMsg) {
                    api.unsendMessage(searchMsg.messageID).catch(() => {});
                }

                return api.sendMessage(
                    "❌ Kuch nahi mila!",
                    event.threadID
                );
            }

            videoURL =
                video.url ||
                video.video_url ||
                video.videoUrl ||
                video.link ||
                video.webpage_url;

            // Agar search API ne direct download URL diya ho
            if (!videoURL) {
                videoURL =
                    video.downloadUrl ||
                    video.download_url;
            }

            if (!videoURL) {
                if (searchMsg) {
                    api.unsendMessage(searchMsg.messageID).catch(() => {});
                }

                return api.sendMessage(
                    "⚠️ Search result ka YouTube link nahi mila!",
                    event.threadID
                );
            }
        }

        // Render Audio API
        const response = await axios.get(AUDIO_API, {
            params: {
                url: videoURL,
                query: videoURL
            },
            headers
        });

        const songData =
            response.data?.result ||
            response.data?.data ||
            response.data;

        const title =
            songData?.title ||
            songData?.name ||
            "Song";

        const downloadLink =
            songData?.downloadUrl ||
            songData?.download_url ||
            songData?.url ||
            songData?.link ||
            songData?.audio;

        if (!downloadLink) {
            if (searchMsg) {
                api.unsendMessage(searchMsg.messageID).catch(() => {});
            }

            return api.sendMessage(
                "⚠️ Error: Audio link nahi mil saka!",
                event.threadID
            );
        }

        if (searchMsg) {
            api.unsendMessage(searchMsg.messageID).catch(() => {});
        }

        // Cache folder
        const cacheDir = path.join(__dirname, "cache");

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Safe filename
        const safeTitle = title
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
            .substring(0, 80) || "Song";

        const filePath = path.join(
            cacheDir,
            `${Date.now()}.mp3`
        );

        // 1. Title aur Owner Name
        await api.sendMessage(
            `🖤 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉SONG`,
            event.threadID
        );

        // 2. Audio File
        const audioStream = await getStreamFromURL(
            downloadLink,
            `${safeTitle}.mp3`
        );

        audioStream.on("error", () => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        return api.sendMessage(
            {
                attachment: audioStream
            },
            event.threadID,
            () => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        );

    } catch (err) {
        console.error("SONG ERROR:", err.response?.data || err.message);

        return api.sendMessage(
            "⚠️ Server respond nahi kar raha!",
            event.threadID
        );
    }
};