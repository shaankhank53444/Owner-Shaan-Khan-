const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.2.0",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se MP3 song download karein",
    commandCategory: "media",
    usages: "[Song Name / URL]"
};

// 🔐 Credits Lock Check
function checkCredits() {
    if (module.exports.config.credits !== "ARIF-BABU") {
        throw new Error("❌ Credits Locked By ARIF-BABU");
    }
}

const frames = [
  "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
  "🎶 ▰▰▱▱▱▱▱▱▱▱ 20%",
  "🎧 ▰▰▰▰▱▱▱▱▱▱ 40%",
  "💿 ▰▰▰▰▰▰▱▱▱▱ 60%",
  "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

async function getStreamFromURL(url) {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let loadingInterval;

    try {
        checkCredits();

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link likhein!", threadID, messageID);

        // 🎞 Start Loading Animation
        const loadingMsg = await api.sendMessage(frames[0], threadID);
        let i = 1;
        loadingInterval = setInterval(() => {
            if (i < frames.length) {
                api.editMessage(frames[i++], loadingMsg.messageID, threadID).catch(() => {});
            } else {
                clearInterval(loadingInterval);
            }
        }, 800);

        // 🔗 URL ya Search handle karein
        let videoID;
        if (query.includes("youtube.com") || query.includes("youtu.be")) {
            const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
            videoID = query.match(regex)?.[1];
        } else {
            const result = await yts(query);
            if (!result.videos.length) {
                clearInterval(loadingInterval);
                return api.sendMessage("❌ Kuch nahi mila!", threadID, messageID);
            }
            videoID = result.videos[0].videoId;
        }

        // 🌐 Dynamic API URL fetch karein
        const baseRes = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
        const apiUrl = baseRes.data.api;

        // 📥 Download Data
        const res = await axios.get(`${apiUrl}/ytDl3?link=${videoID}&format=mp3`);
        
        if (!res.data || !res.data.data) {
            throw new Error("API se response nahi mila.");
        }

        const { title, downloadLink } = res.data.data;

        // ✂️ URL Shorten
        const shortLink = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`)
            .then(r => r.data)
            .catch(() => "Link Available");

        // 🧹 Cleanup
        clearInterval(loadingInterval);
        api.unsendMessage(loadingMsg.messageID).catch(() => {});

        // 📤 Send Audio
        return api.sendMessage({
            body: `✅ **Downloaded**\n━━━━━━━━━━━━━\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title: ${title}\n🔗 Link: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink)
        }, threadID, messageID);

    } catch (err) {
        if (loadingInterval) clearInterval(loadingInterval);
        console.error(err);
        return api.sendMessage(`⚠️ Error: ${err.message || "Server Down Hai!"}`, threadID, messageID);
    }
};
