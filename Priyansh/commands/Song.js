const axios = require("axios");
const yts = require("yt-search");

// 🔐 Credits Lock Check
function checkCredits() {
    const correctCredits = "ARIF-BABU";
    if (module.exports.config.credits !== correctCredits) {
        throw new Error("❌ Credits Locked By ARIF-BABU");
    }
}

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

// 🛠 Robust YouTube ID Extractor
function getVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "song",
    version: "1.3.0",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader with fixed API path",
    commandCategory: "media",
    usages: "[Song Name or URL]"
};

module.exports.run = async function({ api, args, event }) {
    try {
        checkCredits(); 

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link do!", event.threadID, event.messageID);

        let videoID = getVideoID(query);
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

        if (!videoID) {
            // Official results ke liye first result uthana zaroori hai
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID);
            }
            videoID = result.videos[0].videoId;
        }

        // 🚀 API Call Fixed: Direct data access
        const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`;
        const response = await axios.get(apiUrl);
        
        // Data structure checking
        const songData = response.data.data || response.data;
        const title = songData.title || "Song";
        const downloadLink = songData.downloadLink;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Download link generate nahi ho saka!", event.threadID);
        }

        // Clean UI
        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        // Shorten Link for cleaner look
        let shortLink = downloadLink;
        try {
            const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`);
            shortLink = tiny.data;
        } catch (e) {}

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞l👇👉: ${title}\n📥 Download: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Error: Server response nahi de raha!", event.threadID);
    }
};
