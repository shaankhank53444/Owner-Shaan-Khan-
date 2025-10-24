const axios = require("axios");
const yts = require("yt-search");

// Lazy API initializer
async function getDiptoApi() {
    if (!global.apis?.diptoApi) {
        const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
        global.apis = { diptoApi: base.data.api };
    }
    return global.apis.diptoApi;
}

// YouTube video stream fetcher
async function getStreamFromURL(url, pathName) {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        response.data.path = pathName;
        return response.data;
    } catch (err) {
        throw err;
    }
}

// YouTube ID extractor
function getVideoID(url) {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(checkurl);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "music",
    version: "1.2.1",
    credits: "mesbah",
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se MP3 song download karein",
    commandCategory: "media",
    usages: "[song name ya YouTube link]"
};

module.exports.run = async function ({ api, args, event }) {
    try {
        const diptoApi = await getDiptoApi(); // Lazy init
        let videoID;
        const url = args[0];
        let waitMsg;

        // Agar direct YouTube link hai
        if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            videoID = getVideoID(url);
            if (!videoID) return api.sendMessage("❌ Invalid YouTube URL!", event.threadID, event.messageID);
        } else {
            // Agar sirf song ka naam hai
            const songName = args.join(" ");
            if (!songName) return api.sendMessage("❌ Song ka naam ya YouTube link do!", event.threadID, event.messageID);

            waitMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait"${songName}"...`, event.threadID);
            const r = await yts(songName);
            const videos = r.videos.slice(0, 20);
            const selected = videos[Math.floor(Math.random() * videos.length)];
            videoID = selected.videoId;
        }

        const { data: { title, quality, downloadLink } } = await axios.get(`${diptoApi}/ytDl3?link=${videoID}&format=mp3`);

        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

        const shortLink = (await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`)).data;

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝑨𝑼𝑫𝑰𝑶: ${title}\n🎧 Quality: ${quality}\n📥 Download: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID, event.messageID);

    } catch (e) {
        console.error(e);
        return api.sendMessage("⚠️ Error: " + (e.message || "Kuch galat ho gaya!"), event.threadID, event.messageID);
    }
};