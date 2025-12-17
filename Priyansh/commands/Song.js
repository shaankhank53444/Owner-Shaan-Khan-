const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
    name: "yt",
    version: "1.1.1",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    role: 0, // Mirai/GoatBot compatibility
    cooldowns: 5,
    description: "YouTube video ko URL ya name se MP3 me download karein",
    commandCategory: "media",
    usages: "[YouTube URL ya song ka naam]",
    usePrefix: true
};

// 🔐 Credits Lock Check
function checkCredits() {
    const correctCredits = "ARIF-BABU";
    if (module.exports.config.credits !== correctCredits) {
        return false;
    }
    return true;
}

const frames = [
  "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
  "🎶 ▰▰▱▱▱▱▱▱▱▱ 20%",
  "🎧 ▰▰▰▰▱▱▱▱▱▱ 40%",
  "💿 ▰▰▰▰▰▰▱▱▱▱ 60%",
  "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

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

module.exports.run = async function ({ api, args, event }) {
    const { threadID, messageID } = event;

    if (!checkCredits()) {
        return api.sendMessage("❌ Credits Locked By ARIF-BABU. Please restore original credits.", threadID, messageID);
    }

    try {
        let videoID;
        const query = args.join(" ");

        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link do!", threadID, messageID);

        // 🎞 Start Loading Animation
        const loadingMsg = await api.sendMessage(frames[0], threadID);
        let frameIndex = 1;
        const interval = setInterval(() => {
            if (frameIndex < frames.length) {
                api.editMessage(frames[frameIndex], loadingMsg.messageID).catch(() => {});
                frameIndex++;
            } else {
                clearInterval(interval);
            }
        }, 800);

        // Check if input is URL or Search Query
        if (query.includes("youtube.com") || query.includes("youtu.be")) {
            videoID = getVideoID(query);
        } else {
            const result = await yts(query);
            if (!result.videos.length) {
                clearInterval(interval);
                return api.sendMessage("❌ Koi result nahi mila!", threadID, messageID);
            }
            videoID = result.videos[0].videoId;
        }

        if (!videoID) {
            clearInterval(interval);
            return api.sendMessage("❌ Valid YouTube link nahi mili.", threadID, messageID);
        }

        // Fetching API URL (Static fallback if github fails)
        let apiUrl;
        try {
            const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
            apiUrl = base.data.api;
        } catch (e) {
            apiUrl = "https://d1pt0.onrender.com"; // Default fallback
        }

        const res = await axios.get(`${apiUrl}/ytDl3?link=${videoID}&format=mp3`);
        const { title, downloadLink } = res.data.data || res.data;

        // Finalize loading and send file
        clearInterval(interval);
        
        const shortLinkRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`);
        const shortLink = shortLinkRes.data;

        await api.unsendMessage(loadingMsg.messageID);

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title: ${title}\n📥 Link: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`⚠️ Error: ${err.message || "Server Busy!"}`, threadID, messageID);
    }
};
