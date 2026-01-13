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
    usages: ".audio [song name]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
        return api.sendMessage("❌ Please provide a song name!", threadID, messageID);
    }

    // Aapka customized status message
    const statusMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

    try {
        const searchResults = await yts(query);
        const video = searchResults.videos[0];

        if (!video) {
            api.unsendMessage(statusMsg.messageID);
            return api.sendMessage("❌ No results found.", threadID, messageID);
        }

        const { url, title, author, timestamp } = video;

        // Download status message
        await api.editMessage(`📥 Downloading: ${title}`, statusMsg.messageID, threadID);

        // Stable API for downloading
        const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`;
        const res = await axios.get(apiUrl);
        
        const downloadLink = res.data.result.download.url;

        const audioResponse = await axios.get(downloadLink, {
            responseType: 'arraybuffer'
        });

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);

        fs.writeFileSync(audioPath, Buffer.from(audioResponse.data));

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
        return api.sendMessage(`❌ Error: Connection slow hai ya file badi hai. Dobara try karein!`, threadID, messageID);
    }
};
