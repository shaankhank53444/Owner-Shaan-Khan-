const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

async function searchYouTube(query) {
    const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const match = response.data.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
    if (!match) throw new Error('Parsing error');
    
    const data = JSON.parse(match[1]);
    const videos = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    
    const video = videos.find(v => v.videoRenderer && v.videoRenderer.videoId);
    if (!video) return null;
    
    return {
        id: video.videoRenderer.videoId,
        title: video.videoRenderer.title.runs[0].text
    };
}

module.exports = {
    config: {
        name: 'video',
        aliases: ['yt'],
        description: 'YouTube video search aur download.',
        usage: '{prefix}ytvideo [query]',
        cooldowns: 5
    },
    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const query = args.join(' ');
        if (!query) return api.sendMessage('❌ Query likhein.', threadID, messageID);

        const msg = await api.sendMessage('🔍 Searching...', threadID);
        
        try {
            const video = await searchYouTube(query);
            if (!video) return api.editMessage('❌ Video nahi mili.', msg.messageID);
            
            const filePath = path.join(cacheDir, `${video.id}.mp4`);
            api.editMessage(`⬇️ Downloading: ${video.title}...`, msg.messageID);
            
            // yt-dlp command
            await execFileAsync('yt-dlp', ['-f', 'best', '-o', filePath, `https://youtube.com/watch?v=${video.id}`]);
            
            await api.sendMessage({
                body: `✅ Video: ${video.title}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => fs.unlinkSync(filePath)); // Cleanup
            
            api.unsendMessage(msg.messageID);
        } catch (e) {
            console.error(e);
            api.sendMessage('⚠️ Error aayi.', threadID, messageID);
        }
    }
};
