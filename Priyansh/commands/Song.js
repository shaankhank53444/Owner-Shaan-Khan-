const axios = require("axios");
const yts = require("yt-search");

// Dynamic Base API Function (from sing.js)
const getBaseApi = async () => {
    try {
        const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
        const configRes = await axios.get(nix);
        let baseApi = configRes.data.api;
        if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);
        return baseApi;
    } catch (e) {
        return null;
    }
};

async function getStreamFromURL(url, pathName) {
    const response = await axios.get(url, { responseType: "stream" });
    response.data.path = pathName;
    return response.data;
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
module.exports.handleEvent = async function({ api, event }) {
    if (!event.body) return;
    const body = event.body.toLowerCase().trim();

    // Check if it starts with 'song ' (without prefix)
    if (body.startsWith("song ")) {
        const query = event.body.slice(5).trim();
        if (!query) return;
        return this.run({ api, event, args: [query] });
    }
};

// --- Main Command Logic (Prefix and Shared) ---
module.exports.run = async function({ api, args, event }) {
    let searchMsg;
    try {
        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Gane ka naam ya link dein!", event.threadID, event.messageID);

        searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

        let videoUrl = "";
        let videoTitle = "";

        // Check if direct link or search text
        if (query.startsWith("https://") || query.startsWith("http://")) {
            videoUrl = query;
        } else {
            const result = await yts(query);
            if (!result.videos || !result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID, event.messageID);
            }
            videoUrl = result.videos[0].url;
            videoTitle = result.videos[0].title;
        }

        // 1. Dynamic API Fetching
        const baseApi = await getBaseApi();
        if (!baseApi) throw new Error("Base API fetch failed.");

        const apiUrl = `${baseApi}/play?url=${encodeURIComponent(videoUrl)}`;
        const res = await axios.get(apiUrl);
        
        const downloadUrl = res.data.downloadUrl || res.data.link || res.data.data?.downloadUrl;
        const title = videoTitle || res.data.title || "Song";

        if (!downloadUrl) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Download link nahi mil saka!", event.threadID, event.messageID);
        }

        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        // 2. Stylish Info Message
        await api.sendMessage(`🖤 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹«« ★™\n👑 »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`, event.threadID);

        // 3. Audio Attachment Direct Stream
        const audioStream = await getStreamFromURL(downloadUrl, `${Date.now()}.mp3`);
        return api.sendMessage({ attachment: audioStream }, event.threadID);

    } catch (err) {
        if (searchMsg) api.unsendMessage(searchMsg.messageID);
        console.error(err);
        return api.sendMessage("⚠️ Server respond nahi kar raha!", event.threadID, event.messageID);
    }
};
