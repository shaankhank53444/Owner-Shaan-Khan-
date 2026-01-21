const axios = require("axios");
const yts = require("yt-search");

const baseApiUrl = async () => {
    try {
        const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
        return base.data.api;
    } catch (e) {
        return "https://api.dipt0.biz";
    }
};

(async () => {
    global.apis = {
        diptoApi: await baseApiUrl()
    };
})();

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
    version: "2.1.0",
    credits: "SHAAN-KHAN", 
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader with Shaan Khan branding",
    commandCategory: "media",
    usages: "song [Song Name]"
};

module.exports.handleEvent = async function({ api, event }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();
    if (body.startsWith("song ")) {
        const query = event.body.slice(5).trim();
        if (!query) return;
        return this.run({ api, event, args: [query] });
    }
};

module.exports.run = async function({ api, args, event }) {
    try {
        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Gane ka naam ya link dein!", event.threadID);

        let videoID = getVideoID(query);
        // Pehle wala searching message
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

        if (!videoID) {
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID);
            }
            videoID = result.videos[0].videoId;
        }

        const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`;
        const response = await axios.get(apiUrl);

        const songData = response.data.data || response.data;
        const title = songData.title || "Song";
        const downloadLink = songData.downloadLink;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Link nahi mil saka!", event.threadID);
        }

        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        // 1. Pehle Title send hoga (Bina reply ke)
        // Niche Shaan Khan ka stylish name title ke saath
        await api.sendMessage(`🎵 Title: ${title}\n\n━━━━━━━━━━━━━\n✨  »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉SONG`, event.threadID);

        // 2. Phir Turant Audio file niche aa jayegi
        return api.sendMessage({
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Server Error ya File Size Limit!", event.threadID);
    }
};
