const axios = require("axios");
const yts = require("yt-search");

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
    return base.data.api;
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
    const regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "video",
    version: "1.2.5",
    credits: "Shaan Khan",
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube video download with custom caption",
    commandCategory: "media",
    usages: "[YouTube URL ya song ka naam]"
};

module.exports.handleEvent = async function({ api, event }) {
    if (!event.body) return;
    const message = event.body.toLowerCase();
    const triggers = ["bot video", "shaan video", "pika video", "video bhej"];
    
    if (triggers.some(t => message.startsWith(t))) {
        const query = message.split(" ").slice(2).join(" ") || "new status video"; 
        return this.run({ api, event, args: [query] });
    }
};

module.exports.run = async function({ api, args, event }) {
    try {
        let videoID, searchMsg;
        const queryOrUrl = args.join(" ");

        if (!queryOrUrl) return api.sendMessage("❌ Song ka naam ya YouTube link do!", event.threadID, event.messageID);

        searchMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);

        if (queryOrUrl.includes("youtube.com") || queryOrUrl.includes("youtu.be")) {
            videoID = getVideoID(queryOrUrl);
        } 
        
        if (!videoID) {
            const result = await yts(queryOrUrl);
            const video = result.videos[0]; 
            if (!video) {
                if (searchMsg?.messageID) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Koi video nahi mili!", event.threadID, event.messageID);
            }
            videoID = video.videoId;
        }

        const { data } = await axios.get(`${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp4`);
        const { title, downloadLink } = data;

        if (searchMsg?.messageID) api.unsendMessage(searchMsg.messageID);

        // Custom Caption as per your request
        const caption = `🎬 Title: ${title}\n` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉VIDEO`;

        return api.sendMessage({
            body: caption,
            attachment: await getStreamFromURL(downloadLink, `video.mp4`)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        if (searchMsg?.messageID) api.unsendMessage(searchMsg.messageID);
        return api.sendMessage("⚠️ Error: Kuch galat ho gaya!", event.threadID, event.messageID);
    }
};
