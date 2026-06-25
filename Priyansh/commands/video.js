const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ytdl = require('yt-dlp-exec');

module.exports = {
    config: {
        name: "video",
        aliases: ["ytdl", "video", "youtube"],
        version: "1.0.0",
        hasPermssion: 0,
        credits: "Mirai Bot",
        description: "YouTube video download",
        commandCategory: "media",
        usages: "[video name]",
        cooldowns: 5
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const query = args.join(" ");

        if (!query) return api.sendMessage("❌ Video ka naam likhein.", threadID, messageID);

        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        
        const cachePath = path.join(cacheDir, `${Date.now()}.mp4`);

        api.sendMessage(`🔍 "${query}" dhoond raha hoon...`, threadID, messageID);

        try {
            const searchResults = await ytdl('yt-dlp', {
                'default-search': 'ytsearch1:',
                'dump-json': true,
                'no-playlist': true
            }, [query]);

            const video = JSON.parse(searchResults);
            
            if (video.duration > 600) {
                return api.sendMessage("⚠️ Video 10 minutes se badi hai.", threadID, messageID);
            }

            api.sendMessage(`📥 Download shuru: ${video.title}`, threadID, messageID);

            await ytdl('yt-dlp', {
                output: cachePath,
                format: 'best[ext=mp4][filesize<25M]',
                'no-playlist': true
            }, [video.webpage_url]);

            if (!fs.existsSync(cachePath)) throw new Error("Download fail.");

            api.sendMessage({
                body: `✅ Ye rahi video: ${video.title}`,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            }, messageID);

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ Error: Video nahi mili.", threadID, messageID);
        }
    }
};
