module.exports.run = async function({ api, args, event }) {
    const { threadID, messageID } = event;
    try {
        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Song ka naam ya YouTube link do!", threadID, messageID);

        let videoID = getVideoID(query);
        let searchMsg = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID);

        let title = "Music File"; // Default title
        let videoData;

        if (!videoID) {
            // Agar query text hai toh search karein
            const result = await yts(query);
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Kuch nahi mila!", threadID);
            }
            videoData = result.videos[0];
            videoID = videoData.videoId;
            title = videoData.title; // Yahan title assign ho raha hai
        } else {
            // Agar query direct URL hai toh video info nikaalein
            videoData = await yts({ videoId: videoID });
            title = videoData.title || "YouTube Song"; 
        }

        const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`;
        const response = await axios.get(apiUrl);

        // API response structure check karein
        const songData = response.data.data || response.data;
        const downloadLink = songData.downloadLink || songData.videoUrl; // Kuch APIs mein videoUrl hota hai

        if (!downloadLink) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("⚠️ Error: Download link generate nahi ho saka!", threadID, messageID);
        }

        const filePath = path.join(__dirname, `song_${Date.now()}.mp3`); // Unique filename using timestamp
        
        const audioResponse = await axios({
            method: 'get',
            url: downloadLink,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        audioResponse.data.pipe(writer);

        writer.on('finish', async () => {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);

            const messageBody = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                                `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞👇👉: ${title}`;

            await api.sendMessage({
                body: messageBody,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // File delete after send
            }, messageID);
        });

    } catch (err) {
        console.error("Error details:", err);
        return api.sendMessage(`⚠️ Error: ${err.message}`, threadID, messageID);
    }
};
