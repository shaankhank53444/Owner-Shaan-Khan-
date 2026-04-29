const axios = require("axios");
const yts = require("yt-search");

const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fakeTypingThenCall(api, threadID) {
    try {
        const stop = api.sendTypingIndicator(threadID, () => {});
        await sleep(1500);
        if (typeof stop === "function") stop();
    } catch (_) {}
}

module.exports.config = {
    name: "vid",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Uzair Rajput",
    description: "YouTube official video downloader.",
    commandCategory: "Downloader",
    usages: "[video name]",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "yt-search": ""
    }
};

function streamFromUrl(url, ext) {
    return axios
        .get(url, { responseType: "stream", timeout: 120000 })
        .then((res) => {
            res.data.path = `video.${ext}`;
            return res.data;
        });
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ").trim();

    if (!query) {
        return api.sendMessage("❌ Please provide a song name!", threadID, messageID);
    }

    api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
        // Search for official video
        const search = await yts(query);
        if (!search.videos.length) throw new Error("Video nahi mil saki.");

        const video = search.videos[0]; // Official/Top result
        const videoUrl = video.url;

        const { data } = await axios.post(
            DOWNLOAD_API,
            { url: videoUrl },
            { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        if (!data || !data.success || !data.result) {
            throw new Error("Download server busy hai.");
        }

        const r = data.result;
        const file = await streamFromUrl(r.downloadUrl, "mp4");

        await fakeTypingThenCall(api, threadID);

        // Title stylish name ke upar aur baaki sab clean
        api.sendMessage(
            {
                body: `🖤 Title: ${r.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉VIDEO`,
                attachment: file
            },
            threadID,
            () => api.setMessageReaction("✅", messageID, () => {}, true),
            messageID
        );

    } catch (err) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`⚠️ Error: ${err.message}`, threadID, messageID);
    }
};
