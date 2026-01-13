const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "audio",
    version: "7.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Shaan Khan",
    description: "YouTube Audio Downloader with Auto-API Update",
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
        // Step 1: GitHub se Base API URL uthana
        const baseRes = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
        const API_BASE = baseRes.data.api; // Ye "https://dipto-api-spit.onrender.com" nikalega

        // Step 2: YouTube Search
        const searchResults = await yts(query);
        const video = searchResults.videos[0];

        if (!video) {
            api.unsendMessage(statusMsg.messageID);
            return api.sendMessage("❌ No results found.", threadID, messageID);
        }

        const { url, title, author, timestamp } = video;

        // Step 3: Downloading
        await api.editMessage(`📥 Downloading: ${title}`, statusMsg.messageID, threadID);

        // API Endpoint: base_url/ytmp3?url=...
        const audioResponse = await axios.get(`${API_BASE}/ytmp3?url=${encodeURIComponent(url)}`, {
            responseType: 'arraybuffer'
        });

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);

        fs.writeFileSync(audioPath, Buffer.from(audioResponse.data));

        // Step 4: Sending File
        await api.sendMessage({
            body: `🎵 Title: ${title}\n👤 Artist: ${author.name}\n⏱️ Duration: ${timestamp}\n\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞`,
            attachment: fs.createReadStream(audioPath)
        }, threadID, () => {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        console.error("ERROR:", error.message);
        api.unsendMessage(statusMsg.messageID);
        return api.sendMessage(`❌ Error: API respond nahi kar rahi ya file size bada hai.`, threadID, messageID);
    }
};
