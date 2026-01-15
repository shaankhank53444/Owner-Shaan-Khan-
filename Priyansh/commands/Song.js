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

function getVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "song",
    version: "1.5.0",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube song downloader (Bina prefix aur prefix ke sath)",
    commandCategory: "media",
    usages: "song [Song Name] ya !song [Song Name]"
};

// --- No Prefix Logic ---
module.exports.handleEvent = async function({ api, event }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();
    
    // Agar message sirf "song " se start ho (bina prefix ke)
    if (body.startsWith("song ")) {
        const query = event.body.slice(5).trim();
        if (!query) return;
        return this.run({ api, event, args: [query] });
    }
};

// --- Main Command Logic (Prefix) ---
module.exports.run = async function({ api, args, event }) {
    try {
        checkCredits(); 

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Gane ka naam ya link dein!\nExample: song tum hi ho", event.threadID, event.messageID);

        let videoID = getVideoID(query);
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

        if (!videoID) {
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", event.threadID);
            }
            videoID = result.videos[0].videoId;
        }

        const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`;
        const response = await axios.get(apiUrl);

        const songData = response.data.data || response.data;
        const title = songData.title || "Song";
        const downloadLink = songData.downloadLink;

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Link nahi mil saka!", event.threadID);
        }

        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        let shortLink = downloadLink;
        try {
            const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`);
            shortLink = tiny.data;
        } catch (e) {}

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🎵 Title: ${title}\n📥 Download: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Error: Server respond nahi kar raha!", event.threadID);
    }
};
