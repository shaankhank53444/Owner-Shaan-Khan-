const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

// Muskan file wali APIs
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";

async function getStreamFromURL(url, pathName) {
    const response = await axios.get(url, { responseType: "stream" });
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
        return this.run({ api, event, args: [query.split(" ")] });
    }
};

// --- Main Command Logic ---
module.exports.run = async function({ api, args, event }) {
    try {
        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Gane ka naam ya link dein!", event.threadID);

        let videoID = getVideoID(query);
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

        if (!videoID) {
            const { data } = await axios.get(YT_SEARCH, { params: { q: query } });
            const video = data?.result?.[0] || data?.result?.items?.[0];
            if (!video) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID);
            }
            videoID = video.url; // URL ya ID jo API return karti hai
        }

        // Muskan API se request
        const response = await axios.post(AUDIO_API, { url: videoID });
        const songData = response.data?.result || response.data;
        const title = songData.title || "Song";
        const downloadLink = songData.download_url || songData.video || songData.url;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Link nahi mil saka!", event.threadID);
        }

        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        // 1. Title aur Owner Name
        await api.sendMessage(`🖤 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉SONG`, event.threadID);

        // 2. Audio File
        return api.sendMessage({
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Server respond nahi kar raha!", event.threadID);
    }
};
