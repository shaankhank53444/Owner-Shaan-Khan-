const axios = require("axios");

module.exports.config = {
    name: "audio",
    eventType: ["message"],
    version: "3.1.0",
    hasPermission: 0,
    credits: "Shaan Khan",
    description: "Auto YouTube Audio (No Command | Roman Urdu)",
    dependencies: { "axios": "" }
};

// 🔗 Your API
const API_URL = "https://apis-ten-mocha.vercel.app/aryan/ytdl";

// 🛑 Messages (Roman Urdu)
const PROCESS_MSG = "✅ Apki request jari hai, please wait...";
const ERROR_MSG = "⚠️ Thora sa masla aa gaya hai, dobara try karein";

module.exports.run = async function ({ api, event }) {
    try {
        // ❌ Bot ke apne messages ignore
        if (event.senderID === api.getCurrentUserID()) return;
        if (!event.body) return;

        const text = event.body.trim();

        // 🧠 Choti ya random chat ignore
        if (text.length < 3) return;

        // ⏳ Processing message
        api.sendMessage(PROCESS_MSG, event.threadID);

        // 📡 API call (song name ya YouTube link)
        const res = await axios.get(API_URL, {
            params: {
                url: text,
                type: "audio"
            },
            timeout: 20000
        });

        const data = res.data;

        // 🔐 Safety check
        if (!data || !data.downloadUrl) {
            throw new Error("Invalid API response");
        }

        // 🎧 Send Audio
        return api.sendMessage(
            {
                body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇",
                attachment: await axios({
                    url: data.downloadUrl,
                    method: "GET",
                    responseType: "stream"
                }).then(r => r.data)
            },
            event.threadID,
            event.messageID
        );

    } catch (err) {
        console.log("AUTO YT AUDIO ERROR:", err.message);
        return api.sendMessage(ERROR_MSG, event.threadID);
    }
};