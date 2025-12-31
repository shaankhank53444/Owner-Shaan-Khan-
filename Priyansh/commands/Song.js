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
        return "https://api.dipt0.biz"; // Fallback URL
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

// 🛠 Fixed URL Detection Regex
function getVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "song",
    version: "1.2.5",
    credits: "ARIF-BABU", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube video ko URL ya name se MP3 me download karein",
    commandCategory: "media",
    usages: "[YouTube URL ya song ka naam]"
};

module.exports.run = async function({ api, args, event }) {
    try {
        checkCredits(); 

        let videoID, searchMsg;
        const query = args.join(" ");
        
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link do!", event.threadID, event.messageID);

        // Check if input is a URL
        videoID = getVideoID(query);

        if (!videoID) {
            //✅Apki Request Jari Hai Please wait..message (Title removed as requested)
            searchMsg = await api.sendMessage("🔍 Searching...", event.threadID);
            
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Koi result nahi mila!", event.threadID);
            }
            
            // Pick the first result (Best Match) instead of random
            videoID = result.videos[0].videoId;
        } else {
            searchMsg = await api.sendMessage("🔍 Processing Link...", event.threadID);
        }

        // Fetching download link from API
        const response = await axios.get(`${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`);
        
        if (!response.data.data || !response.data.data.downloadLink) {
            throw new Error("Download link nahi mil paya.");
        }

        const { title, downloadLink } = response.data.data;

        // Removing the "Searching..." message
        if (searchMsg?.messageID) api.unsendMessage(searchMsg.messageID);

        // Shorten the download link
        let shortLink = downloadLink;
        try {
            const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`);
            shortLink = tiny.data;
        } catch (e) {
            console.log("TinyURL failed, using original.");
        }

        return api.sendMessage({
            body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title: ${title}\n📥 Download: ${shortLink}`,
            attachment: await getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("⚠️ Error: " + (err.message || "Server busy!"), event.threadID, event.messageID);
    }
};
