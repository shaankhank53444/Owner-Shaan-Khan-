const axios = require("axios");

module.exports.config = {
    name: "audio",
    version: "3.1.0",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "Auto YouTube Audio (No Command | Roman Urdu)",
    usePrefix: false,
    commandCategory: "utility",
    usages: "[link/text]",
    cooldowns: 5,
};

// 🔗 Your API
const API_URL = "https://apis-ten-mocha.vercel.app/aryan/ytdl";

// 🛑 Messages (Roman Urdu)
const PROCESS_MSG = "✅ Apki request jari hai, please wait...";
const ERROR_MSG = "⚠️ Thora sa masla aa gaya hai, dobara try karein";

module.exports.onChat = async function ({ api, event }) {
    try {
        // ❌ Bot ke apne messages ignore aur basic checks
        if (event.senderID === api.getCurrentUserID()) return;
        if (!event.body) return;

        const text = event.body.trim();

        // 🧠 Check if it's a YouTube link (preventing bot from replying to every chat)
        const isYT = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/gi.test(text);
        if (!isYT) return;

        // ⏳ Processing message
        api.sendMessage(PROCESS_MSG, event.threadID, event.messageID);

        // 📡 API call
        const res = await axios.get(API_URL, {
            params: {
                url: text,
                type: "audio"
            }
        });

        const data = res.data;

        // 🔐 Safety check
        if (!data || !data.downloadUrl) {
            throw new Error("Invalid API response");
        }

        // 🎧 Send Audio
        return api.sendMessage({
                body: "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
                attachment: (await axios.get(data.downloadUrl, { responseType: "stream" })).data
            },
            event.threadID,
            event.messageID
        );

    } catch (err) {
        console.error("AUTO YT AUDIO ERROR:", err.message);
        // Sirf tab error bheje jab sach mein YT link ho
        if (event.body.includes("youtube.com") || event.body.includes("youtu.be")) {
            return api.sendMessage(ERROR_MSG, event.threadID);
        }
    }
};

// Empty run function to avoid errors in some frameworks
module.exports.run = async function ({}) {};
