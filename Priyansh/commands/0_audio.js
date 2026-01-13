const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "audio",
    version: "7.1.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Shaan Khan",
    description: "Multi-API YouTube Downloader",
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
        const searchResults = await yts(query);
        const video = searchResults.videos[0];

        if (!video) {
            api.unsendMessage(statusMsg.messageID);
            return api.sendMessage("❌ No results found.", threadID, messageID);
        }

        const { url, title, author, timestamp } = video;
        await api.editMessage(`📥 Downloading: ${title}`, statusMsg.messageID, threadID);

        // --- API SECTION ---
        // Option 1: Dipto API (Jo aapne GitHub se di thi)
        // Option 2: Stable Global API (Backup)
        
        let audioBuffer;
        try {
            // Pehle Backup API try karte hain kyunki ye zyada stable hai
            const backupUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`;
            const res = await axios.get(backupUrl);
            const dlLink = res.data.result.download.url;
            
            const download = await axios.get(dlLink, { responseType: 'arraybuffer' });
            audioBuffer = Buffer.from(download.data);
        } catch (err) {
            // Agar backup fail ho tab Dipto API try karein
            const diptoApi = `https://dipto-api-spit.onrender.com/ytmp3?url=${encodeURIComponent(url)}`;
            const download = await axios.get(diptoApi, { responseType: 'arraybuffer' });
            audioBuffer = Buffer.from(download.data);
        }

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);

        fs.writeFileSync(audioPath, audioBuffer);

        await api.sendMessage({
            body: `🎵 Title: ${title}\n👤 Artist: ${author.name}\n⏱️ Duration: ${timestamp}\n\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞`,
            attachment: fs.createReadStream(audioPath)
        }, threadID, () => {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        console.error("FINAL ERROR:", error.message);
        api.unsendMessage(statusMsg.messageID);
        return api.sendMessage(`❌ Maaf kijiye, sari APIs busy hain.\n\nWajah: ${error.message}`, threadID, messageID);
    }
};
