const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autoYoutube",
    version: "1.1.0",
    credits: "SHAAN KHAN",
    description: "Auto detect YouTube links & download video",
    eventType: ["message"]
};

module.exports.run = async function ({ api, event }) {
    const { threadID, body, senderID } = event;
    if (!body) return;

    const botID = api.getCurrentUserID();
    if (senderID === botID) return;

    const ytRegex =
        /(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/i;

    const match = body.match(ytRegex);
    if (!match) return;

    const youtubeUrl = match[0];
    const API_BASE = "https://yt-tt.onrender.com";

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 30%",
        "💜▰▰▰▰▱▱▱▱▱▱ 50%",
        "💖▰▰▰▰▰▰▱▱▱▱ 75%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% ✅"
    ];

    let status;
    try {
        status = await api.sendMessage(
            `🎬 YouTube link detected!\n\n${frames[0]}`,
            threadID
        );
    } catch {
        return;
    }

    try {
        await api.editMessage(
            `📥 Downloading video...\n\n${frames[1]}`,
            status.messageID,
            threadID
        );

        const res = await axios.get(`${API_BASE}/api/youtube/video`, {
            params: { url: youtubeUrl },
            responseType: "arraybuffer",
            timeout: 180000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        if (!res.data || res.data.length < 1000)
            throw new Error("Invalid video data");

        await api.editMessage(
            `⚙️ Processing...\n\n${frames[3]}`,
            status.messageID,
            threadID
        );

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const filePath = path.join(
            cacheDir,
            `youtube_${Date.now()}.mp4`
        );

        fs.writeFileSync(filePath, Buffer.from(res.data));

        if (fs.statSync(filePath).size < 1000) {
            fs.unlinkSync(filePath);
            throw new Error("File too small");
        }

        await api.editMessage(
            `✅ Download complete!\n\n${frames[4]}`,
            status.messageID,
            threadID
        );

        await api.sendMessage(
            {
                body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝒀𝑶𝑼𝑻𝑼𝑩𝑬 𝑽𝑰𝑫𝑬𝑶👇",
                attachment: fs.createReadStream(filePath)
            },
            threadID
        );

        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                api.unsendMessage(status.messageID);
            } catch {}
        }, 20000);

    } catch (err) {
        console.log("AutoYouTube Error:", err.message);
        try {
            await api.editMessage(
                "❌ Video download failed",
                status.messageID,
                threadID
            );
            setTimeout(() => {
                try { api.unsendMessage(status.messageID); } catch {}
            }, 5000);
        } catch {}
    }
};