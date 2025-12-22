const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.2.0",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se MP3 download karein",
    commandCategory: "media",
    usages: "[song name or URL]"
};

// 🔐 Credits Check
function checkCredits() {
    if (module.exports.config.credits !== "ARIF-BABU") {
        throw new Error("❌ Credits Locked By ARIF-BABU");
    }
}

const frames = [
  "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
  "🎶 ▰▰▰▱▱▱▱▱▱▱ 30%",
  "🎧 ▰▰▰▰▰▱▱▱▱▱ 50%",
  "💿 ▰▰▰▰▰▰▰▱▱▱ 80%",
  "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

async function getStream(url, name) {
    const res = await axios.get(url, { responseType: "stream" });
    res.data.path = name;
    return res.data;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    try {
        checkCredits();

        if (!query) return api.sendMessage("⚠️ Please provide a song name or link!", threadID, messageID);

        // 1. Start Loading Animation
        const loading = await api.sendMessage(frames[0], threadID);
        let i = 1;
        const interval = setInterval(() => {
            if (i < frames.length) {
                api.editMessage(frames[i++], loading.messageID, threadID).catch(() => {});
            } else {
                clearInterval(interval);
            }
        }, 800);

        // 2. Search Logic
        let videoID;
        if (query.includes("youtube.com") || query.includes("youtu.be")) {
            const regex = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
            videoID = query.match(regex)?.[1];
        } else {
            const search = await yts(query);
            if (!search.videos.length) {
                clearInterval(interval);
                return api.sendMessage("❌ No results found!", threadID, messageID);
            }
            videoID = search.videos[0].videoId;
        }

        // 3. Fetch API Base URL
        const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
        const apiUrl = base.data.api;

        // 4. Get Download Link
        const res = await axios.get(`${apiUrl}/ytDl3?link=${videoID}&format=mp3`);
        const { title, downloadLink } = res.data.data;

        // 5. Shorten URL (Optional but looks clean)
        const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`).catch(() => ({ data: downloadLink }));

        // 6. Send Response
        clearInterval(interval);
        await api.unsendMessage(loading.messageID);

        return api.sendMessage({
            body: `✅ Downloaded Successfully!\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title: ${title}\n🔗 Link: ${tiny.data}`,
            attachment: await getStream(downloadLink, `${title}.mp3`)
        }, threadID, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
