const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "audio",
    version: "6.1.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Shaan Khan",
    description: "YouTube Music Downloader using YT-TT API",
    commandCategory: "media",
    usages: ".audio [song name]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
        return api.sendMessage("❌ Please provide a song name!", threadID, messageID);
    }

    const statusMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

    try {
        // Step 1: YouTube Search
        const searchResults = await yts(query);
        const video = searchResults.videos[0];

        if (!video) {
            api.unsendMessage(statusMsg.messageID);
            return api.sendMessage("❌ No results found.", threadID, messageID);
        }

        const { url, title, author, timestamp } = video;

        // Step 2: Download using your API
        // Format: https://yt-tt.onrender.com/api/download?url=VIDEO_URL&type=audio
        const apiUrl = `https://yt-tt.onrender.com/api/download?url=${encodeURIComponent(url)}&type=audio`;
        
        await api.editMessage(`📥 Downloading: ${title}`, statusMsg.messageID, threadID);

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 120000 // 2 minutes timeout for large files
        });

        // Step 3: Cache Management
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);

        fs.writeFileSync(audioPath, Buffer.from(response.data));

        // Step 4: Final Message
        await api.sendMessage({
            body: `🎵 Title: ${title}\n👤 Artist: ${author.name}\n⏱️ Duration: ${timestamp}\n\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞`,
            attachment: fs.createReadStream(audioPath)
        }, threadID, () => {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        console.error("API ERROR:", error.message);
        api.unsendMessage(statusMsg.messageID);
        
        // Detailed error for you to debug
        let errorMsg = "❌ Error: API Server response nahi de raha.";
        if (error.message.includes("timeout")) errorMsg = "❌ Error: Download time out ho gaya (File badi hai).";
        
        return api.sendMessage(errorMsg, threadID, messageID);
    }
};
