const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "music",
    version: "6.0.0",
    hasPermssion: 0,
    credits: "Kashif Raza",
    description: "Download music from YouTube",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

const API_BASE = "https://yt-tt.onrender.com";

async function downloadAudio(videoUrl) {
    try {
        const response = await axios.get(`${API_BASE}/api/youtube/audio`, {
            params: { url: videoUrl },
            timeout: 60000,
            responseType: 'arraybuffer'
        });
        
        if (response.data) {
            return { success: true, data: response.data };
        }
        return null;
    } catch (err) {
        console.log("Audio download failed:", err.message);
        return null;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const query = args.join(" ");
    
    if (!query) {
        return api.sendMessage("❌ Please provide a song name", event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🔍 Searching: ${query}\n\n${frames[0]}`, event.threadID);

    try {
        const searchResults = await yts(query);
        const videos = searchResults.videos;
        
        if (!videos || videos.length === 0) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ No results found", event.threadID, event.messageID);
        }

        const video = videos[0];
        const videoUrl = video.url;

        // Update progress
        for (let i = 1; i < frames.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            api.editMessage(`🔍 Searching: ${query}\n\n${frames[i]}`, searchMsg.messageID);
        }

        api.editMessage(`⏳ Downloading: ${video.title}`, searchMsg.messageID);

        const audioData = await downloadAudio(videoUrl);
        
        if (!audioData || !audioData.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Failed to download audio", event.threadID, event.messageID);
        }

        const cachePath = path.join(__dirname, 'cache', `${Date.now()}.mp3`);
        fs.writeFileSync(cachePath, Buffer.from(audioData.data));

        api.unsendMessage(searchMsg.messageID);

        await api.sendMessage({
            body: `🎵 ${video.title}\n⏱️ Duration: ${video.timestamp}\n👁️ Views: ${video.views}\n📢 Channel: ${video.author.name}`,
            attachment: fs.createReadStream(cachePath)
        }, event.threadID, () => {
            fs.unlinkSync(cachePath);
        }, event.messageID);

    } catch (error) {
        console.error('Error:', error);
        api.unsendMessage(searchMsg.messageID);
        return api.sendMessage("❌ An error occurred while processing your request", event.threadID, event.messageID);
    }
};