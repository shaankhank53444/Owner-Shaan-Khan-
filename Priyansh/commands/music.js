const axios = require('axios');
const fs = require('fs-extra'); // Using fs-extra for robust file operations
const path = require('path');

// Mirai Bot ke lie yeh library bahut zaroori hai
const yts = require('yt-search'); 

module.exports.config = {
    name: "music",
    version: "5.2.2", // Fixed version for sending issues
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Kashif Raza | Fixed by Gemini (Attachment & Cleanup)",
    description: "Download music from YouTube (Auto-selects top result)",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

const API_BASE = "https://yt-tt.onrender.com";

/**
 * Downloads audio from the video URL as a buffer.
 */
async function downloadAudio(videoUrl) {
    try {
        const response = await axios.get(`${API_BASE}/api/youtube/audio`, {
            params: { url: videoUrl },
            timeout: 70000, 
            responseType: 'arraybuffer'
        });
        
        if (response.data) {
            return { success: true, data: Buffer.from(response.data) };
        }
        return { success: false, error: "Empty response received from API." };
    } catch (err) {
        let errorMessage = `API Download Failed: ${err.message}`;
        if (err.code === 'ECONNABORTED') {
             errorMessage = "API timed out (file too large or server slow).";
        }
        return { success: false, error: errorMessage };
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    
    if (!query) {
        return api.sendMessage("❌ Please provide a song name (e.g., .music song name)", threadID, messageID);
    }

    // Simplified progress frames
    const frames = [
        "🔍 Searching...",
        "🎵 Found and Downloading...",
        "✅ Complete! Sending file..."
    ];

    let searchMsg;
    let audioPath = null;
    let thumbPath = null;

    // Robust Cleanup function: Ensures files are deleted after a delay (5 seconds)
    const cleanup = (paths) => {
        // Delay cleanup to ensure file is fully sent by the bot
        setTimeout(() => {
            paths.forEach(p => {
                if (p && fs.existsSync(p)) {
                    try {
                        fs.unlinkSync(p);
                    } catch (e) {
                        console.error("Cleanup failed for file:", p, e.message);
                    }
                }
            });
        }, 5000); // 5 seconds delay for safe sending
    };


    try {
        searchMsg = await api.sendMessage(`${frames[0]} for **${query}**`, threadID);

        // 1. Search YouTube
        const searchResults = await yts(query);
        const videos = searchResults.videos;
        
        if (!videos || videos.length === 0) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ No results found for that query.", threadID, messageID);
        }

        const firstResult = videos[0];
        const title = firstResult.title;
        const author = firstResult.author.name;
        const thumbnail = firstResult.thumbnail;
        const videoUrl = firstResult.url;

        // Progress update
        await api.editMessage(`${frames[1]} **${title}**`, searchMsg.messageID);

        // 2. Download Audio
        const downloadResult = await downloadAudio(videoUrl);
        
        if (!downloadResult.success || !downloadResult.data) {
            api.unsendMessage(searchMsg.messageID);
            const errorDetail = downloadResult.error ? `\nError: ${downloadResult.error}` : "";
            return api.sendMessage(`❌ Download failed. The API might be busy or file is too large.${errorDetail}`, threadID, messageID);
        }

        // 3. Save Audio file
        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir); 

        audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
        await fs.writeFile(audioPath, downloadResult.data);

        // 4. Download Thumbnail
        const attachments = [];
        let bodyMessage = `✅ **Download Complete!**\n\n🎵 **Title:** ${title}\n🎤 **Artist:** ${author}`;

        if (thumbnail) {
            try {
                const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                await fs.writeFile(thumbPath, Buffer.from(thumbRes.data));
                attachments.push(fs.createReadStream(thumbPath)); // Thumbnail first
            } catch (thumbError) {
                console.error("Thumbnail download failed:", thumbError.message);
                bodyMessage += "\n(Note: Failed to load thumbnail.)";
            }
        }
        
        // Add Audio file
        if (fs.existsSync(audioPath)) {
             attachments.push(fs.createReadStream(audioPath));
        } else {
             bodyMessage += "\n\n❌ **Warning:** Could not find the audio file for sending.";
             api.unsendMessage(searchMsg.messageID);
             return api.sendMessage(bodyMessage, threadID);
        }
       

        // 5. Send the Message
        await api.editMessage(`${frames[2]}`, searchMsg.messageID);

        await api.sendMessage(
            {
                body: bodyMessage,
                attachment: attachments
            },
            threadID
        );
        
        // Mirai Bot main message ID unsend
        api.unsendMessage(searchMsg.messageID);


    } catch (error) {
        console.error("Music command general error:", error.message);
        // Try to unsend the progress message if it exists
        if (searchMsg) { 
            try { api.unsendMessage(searchMsg.messageID); } catch(e) {} 
        }
        return api.sendMessage(`❌ An unexpected internal error occurred while sending the file. Please try again. (${error.message})`, threadID, messageID);
    } finally {
        // Ensure cleanup runs after a short delay
        cleanup([audioPath, thumbPath]); 
    }
};
