const axios = require("axios");
const fs = require("fs");
const path = require("path");

const AUDIO_API = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/download/dlmp3";
const YT_SEARCH = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/api/search";

async function getStreamFromURL(url, pathName) {
    const response = await axios.get(url, {
        responseType: "stream",
        timeout: 30000, // 30 seconds timeout limit
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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
    version: "2.5.1",
    credits: "SHAAN-KHAN",
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader (Prefix & No Prefix)",
    commandCategory: "media",
    usages: "song [Song Name] / !song [Song Name]"
};

module.exports.handleEvent = async function({ api, event, client }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();

    if (body.startsWith("song ")) {
        const query = event.body.slice(5).trim();
        if (!query) return;

        return this.run({
            api,
            event,
            args: query.split(" ")
        });
    }
};

module.exports.run = async function({ api, args, event }) {
    let searchMsg = null;
    try {
        const query = args.join(" ");

        if (!query) {
            return api.sendMessage("❌ Gane ka naam ya link dein!", event.threadID);
        }

        let videoURL = query;

        searchMsg = await api.sendMessage(
            "✅ Apki Request Jari Hai Please wait...",
            event.threadID
        );

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        };

        // Agar query URL nahi hai to search karo
        if (!getVideoID(query)) {
            const searchRes = await axios.get(YT_SEARCH, {
                params: { query: query, type: "mp3" },
                headers,
                timeout: 20000
            });

            const data = searchRes.data;
            const videos = data?.result?.videos || data?.result?.items || data?.results || data?.result;

            let video = Array.isArray(videos) ? videos[0] : videos;

            if (!video) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID).catch(() => {});
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID);
            }

            videoURL = video.url || video.video_url || video.videoUrl || video.link || video.webpage_url || video.downloadUrl;

            if (!videoURL) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID).catch(() => {});
                return api.sendMessage("⚠️ Search result ka link nahi mila!", event.threadID);
            }
        }

        // Audio API Call
        const response = await axios.get(AUDIO_API, {
            params: { url: videoURL, query: videoURL },
            headers,
            timeout: 30000
        });

        const songData = response.data?.result || response.data?.data || response.data;
        const title = songData?.title || songData?.name || "Song";
        const downloadLink = songData?.downloadUrl || songData?.download_url || songData?.url || songData?.link || songData?.audio;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID).catch(() => {});
            return api.sendMessage("⚠️ Error: Audio link nahi mil saka!", event.threadID);
        }

        if (searchMsg) api.unsendMessage(searchMsg.messageID).catch(() => {});

        const safeTitle = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").substring(0, 80) || "Song";

        // Message title send karein
        await api.sendMessage(
            `🖤 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉SONG`,
            event.threadID
        );

        // Audio stream send karein
        const audioStream = await getStreamFromURL(downloadLink, `${safeTitle}.mp3`);

        return api.sendMessage(
            { attachment: audioStream },
            event.threadID
        );

    } catch (err) {
        if (searchMsg) api.unsendMessage(searchMsg.messageID).catch(() => {});
        
        // Exact Error Console logging
        console.error("SONG COMMAND ERROR DETAILS:", {
            message: err.message,
            code: err.code,
            response: err.response?.data
        });

        return api.sendMessage(
            `⚠️ Server respond nahi kar raha! (Error: ${err.message})`,
            event.threadID
        );
    }
};
