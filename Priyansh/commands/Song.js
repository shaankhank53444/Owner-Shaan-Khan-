const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
    config: {
        name: "song",
        aliases: ["music", "audio", "ytmusic"],
        version: "4.0.0",
        author: "Asif Mahmud",
        countDown: 5,
        role: 0,
        category: "media",
        shortDescription: {
            en: "Download song/audio/video from YouTube"
        },
        longDescription: {
            en: "Download high quality audio or video from YouTube"
        },
        guide: {
            en: "{p}song [song name] or {p}song [song name] video"
        },
        dependencies: {
            "axios": "",
            "fs-extra": "",
            "yt-search": ""
        }
    },

    onStart: async function ({ api, event, args, message }) {
        const query = args.join(" ");

        if (!query) {
            return message.reply("❌ Please provide a song name.\n\nUsage: song [name] or song [name] video");
        }

        const wantVideo = query.toLowerCase().endsWith(" video");
        const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
        const format = wantVideo ? "video" : "audio";

        const processingMsg = await message.reply(`✅ Apki Request Jari Hai Please Wait"${searchTerm}"...`);

        try {
            // Search using yt-search
            const searchResults = await yts(searchTerm);
            const videos = searchResults.videos;

            if (!videos || videos.length === 0) {
                await message.unsendMessage(processingMsg.messageID);
                return message.reply("❌ No results found.");
            }

            const first = videos[0];
            const title = first.title;
            const videoUrl = first.url;
            const author = first.author.name;

            await message.unsendMessage(processingMsg.messageID);
            const downloadMsg = await message.reply(`✅ Found: ${title}\n📥 Downloading ${format}...`);

            // Fetch download URL using API
            let fetchRes;
            try {
                const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
                let apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;
                if (wantVideo) {
                    apiUrl += '&quality=360';
                }
                fetchRes = await axios.get(apiUrl, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 60000
                });
            } catch (fetchError) {
                await message.unsendMessage(downloadMsg.messageID);
                return message.reply(`❌ Failed to fetch download link.\n\nThe API might be slow or unavailable. Please try again later.`);
            }

            if (!fetchRes.data.success || !fetchRes.data.data.result.urls) {
                await message.unsendMessage(downloadMsg.messageID);
                return message.reply("❌ Failed to get download URL from API");
            }

            const downloadUrl = fetchRes.data.data.result.urls;

            // Download the file
            let downloadRes;
            try {
                downloadRes = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 180000
                });
            } catch (downloadError) {
                await message.unsendMessage(downloadMsg.messageID);
                return message.reply(`❌ Download failed.\n\nPlease try again later.`);
            }

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);

            const timestamp = Date.now();
            const extension = wantVideo ? "mp4" : "mp3";
            const filePath = path.join(cacheDir, `${timestamp}.${extension}`);
            
            await fs.writeFile(filePath, downloadRes.data);

            await message.unsendMessage(downloadMsg.messageID);
            
            // Send the file
            await message.reply({
                body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞 ${title}\n📺 ${author}\n🔗 ${videoUrl}`,
                attachment: fs.createReadStream(filePath)
            });

            // Clean up file after 10 seconds
            setTimeout(() => {
                fs.unlink(filePath).catch(err => console.log("Cleanup error:", err));
            }, 10000);

        } catch (err) {
            console.error("SONG CMD ERR:", err);
            // Don't send error message to avoid spam
        }
    }
};