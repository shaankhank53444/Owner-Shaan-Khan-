const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "audio",
    version: "6.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Shaan Khan",
    description: "Fast YouTube Music Downloader",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

// Nayi API Base URL
const API_BASE = "https://ytapi-kl2g.onrender.com";

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
        return api.sendMessage("❌ Please provide a song name!", threadID, messageID);
    }

    const statusMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait..."${query}"`, threadID);

    try {
        // YouTube Search
        const searchResults = await yts(query);
        const video = searchResults.videos[0];

        if (!video) {
            await api.editMessage("❌ No results found.", statusMsg.messageID, threadID);
            return;
        }

        const { url, title, author, timestamp } = video;

        await api.editMessage(`📥 Downloading: ${title}...`, statusMsg.messageID, threadID);

        // Nayi API Call
        const response = await axios.get(`${API_BASE}/api/download`, {
            params: { 
                url: url,
                type: 'audio' // Specified audio download
            },
            responseType: 'arraybuffer'
        });

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);

        // Writing file to cache
        fs.writeFileSync(audioPath, Buffer.from(response.data));

        // Sending Message
        await api.sendMessage({
            body: `🎵 Title: ${title}\n👤 Artist: ${author.name}\n⏱️ Duration: ${timestamp}\n\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 💞`,
            attachment: fs.createReadStream(audioPath)
        }, threadID, (err) => {
            if (err) console.error("Send Error:", err);
            
            // Cleanup: Delete file and unsend status
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        console.error("Error details:", error.message);
        await api.editMessage("❌ Server Error: API is currently down or not responding.", statusMsg.messageID, threadID);
    }
};
