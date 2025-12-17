const axios = require("axios");
const yts = require("yt-search");

// 🔐 Credits Lock Check
function checkCredits(credits) {
    const correctCredits = "ARIF-BABU";
    if (credits !== correctCredits) {
        throw new Error("❌ Credits Locked By ARIF-BABU");
    }
}

/* 🎞 Loading Frames */
const frames = [
    "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
    "🎶 ▰▰▱▱▱▱▱▱▱▱ 20%",
    "🎧 ▰▰▰▰▱▱▱▱▱▱ 40%",
    "💿 ▰▰▰▰▰▰▱▱▱▱ 60%",
    "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

module.exports.config = {
    name: "song",
    version: "1.1.2",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube video ko URL ya name se MP3 me download karein",
    commandCategory: "media",
    usages: "[YouTube URL ya song ka naam]",
    dependencies: {
        "axios": "",
        "yt-search": ""
    }
};

module.exports.run = async function ({ api, args, event }) {
    const { threadID, messageID } = event;
    
    try {
        // Credits check
        checkCredits(this.config.credits);

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link dein!", threadID, messageID);

        // 🎞 Start loading animation
        const loadingMsg = await api.sendMessage(frames[0], threadID);
        let i = 1;
        const interval = setInterval(() => {
            if (i < frames.length) {
                api.editMessage(frames[i], loadingMsg.messageID).catch(() => {});
                i++;
            } else {
                clearInterval(interval);
            }
        }, 800);

        // Get Base API URL
        const baseRes = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
        const diptoApi = baseRes.data.api;

        let videoID;
        // Check if input is a URL
        const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
        const match = query.match(urlRegex);

        if (match) {
            videoID = match[1];
        } else {
            // Search if not a URL
            const searchResult = await yts(query);
            if (!searchResult.videos.length) {
                clearInterval(interval);
                return api.sendMessage("❌ Koi result nahi mila!", threadID, messageID);
            }
            videoID = searchResult.videos[0].videoId;
        }

        // Fetch Download Link
        const res = await axios.get(`${diptoApi}/ytDl3?link=${videoID}&format=mp3`);
        const { title, downloadLink } = res.data.data;

        // Stop loading and send audio
        clearInterval(interval);
        api.unsendMessage(loadingMsg.messageID);

        // TinyURL for short link
        const shortLinkRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`);
        const shortLink = shortLinkRes.data;

        const stream = (await axios.get(downloadLink, { responseType: "stream" })).data;

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title: ${title}\n📥 Download: ${shortLink}`,
            attachment: stream
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`⚠️ Error: ${err.message || "Server busy hai!"}`, threadID, messageID);
    }
};
