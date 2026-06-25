const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

module.exports = {
    config: {
        name: 'video',
        aliases: ['yt', 'dl'],
        description: 'YouTube se video search aur download karke bheje.',
        usage: '{prefix}video [query]',
        cooldowns: 5
    },
    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const query = args.join(' ');
        
        if (!query) return api.sendMessage('❌ Please video ka naam ya link likhein.', threadID, messageID);

        const msg = await api.sendMessage('🔍 Searching and downloading...', threadID);

        try {
            // Using a unique filename for each request to avoid conflicts
            const fileName = `${Date.now()}.mp4`;
            const filePath = path.join(cacheDir, fileName);

            // yt-dlp command: searches and downloads best mp4 format under 25MB
            const command = `yt-dlp -f "best[ext=mp4][filesize<25M]" -o "${filePath}" "ytsearch1:${query}"`;

            exec(command, async (error, stdout, stderr) => {
                if (error) {
                    api.editMessage('❌ Download failed: Video shayad 25MB se badi hai ya yt-dlp update mang raha hai.', msg.messageID);
                    return;
                }

                if (fs.existsSync(filePath)) {
                    await api.sendMessage({
                        body: '✅ Ye rahi aapki video:',
                        attachment: fs.createReadStream(filePath)
                    }, threadID, () => {
                        fs.unlinkSync(filePath); // File bhejne ke baad delete karein
                        api.unsendMessage(msg.messageID);
                    });
                } else {
                    api.editMessage('❌ File download nahi ho saki.', msg.messageID);
                }
            });

        } catch (e) {
            api.sendMessage('⚠️ Error: ' + e.message, threadID, messageID);
        }
    }
};
