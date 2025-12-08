const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');

// --- Configuration ---
module.exports.config = {
    name: "music",
    version: "7.0.0", // Updated version
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Kashif Raza | Modified by Gemini (Selection Feature)",
    description: "Search and download music from YouTube with selection feature.",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 7 
};

const API_BASE = "https://yt-tt.onrender.com";

/**
 * Downloads audio from the provided video URL directly to a file path.
 */
async function downloadAudioToFile(videoUrl, audioPath) {
    try {
        const response = await axios.get(`${API_BASE}/api/youtube/audio`, {
            params: { url: videoUrl },
            timeout: 90000, 
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(audioPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(true));
            writer.on('error', (err) => reject(new Error(`Stream write error: ${err.message}`)));
            response.data.on('error', (err) => reject(new Error(`API stream error: ${err.message}`)));
        });
    } catch (err) {
        console.error("Audio download failed:", err.message);
        return false;
    }
}

// --- Main Command Execution ---
module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) {
        return api.sendMessage("❌ Please provide a song name (e.g., .music Ed Sheeran Shape of You)", threadID, messageID);
    }

    let searchMsg;
    let audioPath = null;
    let thumbPath = null;
    let videos = []; // To store search results

    // Cleanup function
    const cleanup = () => {
        const filesToClean = [audioPath, thumbPath].filter(p => p && fs.existsSync(p));
        if (filesToClean.length > 0) {
            Promise.allSettled(filesToClean.map(file => fs.promises.unlink(file)))
                .catch(err => console.error("Cleanup failed:", err));
        }
    };
    
    // Set up a function to handle the selection response
    const handleSelection = async (error, info) => {
        if (error) {
            console.error("Selection listener error:", error);
            cleanup();
            return api.sendMessage("❌ Selection timed out or an error occurred. Please try again.", threadID);
        }

        const selectedIndex = parseInt(info.body.trim());
        const selectedVideo = videos[selectedIndex - 1];

        if (!selectedVideo || isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > videos.length) {
            cleanup();
            return api.sendMessage("❌ Invalid selection. Please use the command again and select a number between 1 and 5.", threadID);
        }

        const videoUrl = selectedVideo.url;
        const title = selectedVideo.title;
        const author = selectedVideo.author.name;
        const thumbnail = selectedVideo.thumbnail;

        await api.sendMessage(`⬇️ Starting download for: **${title}**`, threadID);

        try {
            // 2. Setup paths and download
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
            
            const downloadSuccess = await downloadAudioToFile(videoUrl, audioPath);

            if (!downloadSuccess) {
                return api.sendMessage("❌ Download server is busy or failed. Please try again later.", threadID);
            }

            // 3. Download Thumbnail
            const attachments = [fs.createReadStream(audioPath)];
            let bodyMessage = `✅ Download Complete!\n\n🎵 **${title}**\n🎤 **Artist:** ${author}\n\n`;

            if (thumbnail) {
                try {
                    const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 15000 });
                    thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                    fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
                    attachments.unshift(fs.createReadStream(thumbPath));
                } catch (thumbError) {
                    bodyMessage += "(Note: Failed to load thumbnail.)";
                }
            }

            // 4. Send the final message
            await api.sendMessage(
                {
                    body: bodyMessage,
                    attachment: attachments
                },
                threadID
            );

        } catch (error) {
            console.error("Download processing error:", error);
            return api.sendMessage("❌ An error occurred while processing or sending the music file.", threadID);
        } finally {
            // Clean up files after sending
            setTimeout(cleanup, 5000); 
        }
    };


    try {
        searchMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait:** ${query}`, threadID);

        // 1. Search YouTube and limit to top 5
        const searchResults = await yts(query);
        videos = searchResults.videos.slice(0, 5); // Take only the top 5 results

        if (!videos || videos.length === 0) {
            return api.sendMessage("❌ No results found for that query.", threadID, messageID);
        }

        // Format search results for selection
        let message = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞 **Top ${videos.length} Results for "${query}"**\n\n`;
        videos.forEach((video, index) => {
            message += `${index + 1}. **${video.title}**\n   _By ${video.author.name} | Duration: ${video.timestamp}_\n`;
        });
        message += "\n👇 **Please select a number (1-5) to download:** 👇";

        // Send the selection message and set up the listener
        await api.sendMessage(
            message,
            threadID,
            (error, info) => {
                if (!error) {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        handleSelection: handleSelection // Attach the selection handler
                    });
                }
            }
        );

    } catch (error) {
        console.error("Music command error:", error.message);
        if (searchMsg) { try { api.unsendMessage(searchMsg.messageID); } catch(e) {} }
        return api.sendMessage(`❌ An error occurred during search. Please try again. (${error.message})`, threadID, messageID);
    }
};

// --- Handle Reply Function for Selection ---
module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, senderID } = event;

    // Check if the reply is from the correct user
    if (senderID != handleReply.author) return;

    // Remove the listener immediately to prevent further replies
    const index = global.client.handleReply.findIndex(
        (h) => h.messageID === handleReply.messageID
    );
    if (index !== -1) {
        global.client.handleReply.splice(index, 1);
    }
    
    // Call the selection handler function
    await handleReply.handleSelection(null, event);

    // Unsend the selection message
    api.unsendMessage(handleReply.messageID);
};
