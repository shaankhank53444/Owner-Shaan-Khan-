const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

// 🛠 API URL Fetcher
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

// 🛠 YouTube ID Extractor
function getVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "song",
    version: "1.3.1",
    credits: "Shaan Khan", 
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader (E2EE Optimized)",
    commandCategory: "media",
    usages: "[Song Name or URL]"
};

module.exports.run = async function({ api, args, event }) {
    const { threadID, messageID } = event;
    try {
        // 🔓 Credits Lock Removed by Shaan Khan

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link do!", threadID, messageID);

        let videoID = getVideoID(query);
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID);

        let title = "";
        if (!videoID) {
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", threadID);
            }
            videoID = result.videos[0].videoId;
            title = result.videos[0].title;
        } else {
            const videoInfo = await yts({ videoId: videoID });
            title = videoInfo.title;
        }

        const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`;
        const response = await axios.get(apiUrl);

        const songData = response.data.data || response.data;
        const downloadLink = songData.downloadLink;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Download link generate nahi ho saka!", threadID, messageID);
        }

        const filePath = path.join(__dirname, `song_${messageID}.mp3`);
        
        const audioResponse = await axios({
            method: 'get',
            url: downloadLink,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        audioResponse.data.pipe(writer);

        writer.on('finish', async () => {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);

            // E2EE Optimized: Bold title helps visibility in encrypted chats
            const messageBody = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                                `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞👇👉: ${title}`;

            await api.sendMessage({
                body: messageBody,
                attachment: fs.createReadStream(filePath)
            }, threadID, (err) => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, messageID);
        });

        writer.on('error', (err) => {
            throw err;
        });

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Error: Server response nahi de raha!", threadID, messageID);
    }
};
