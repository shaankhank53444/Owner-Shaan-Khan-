const axios = require("axios");
 
// ================= BASE API =================
const baseApiUrl = async () => {
    const base = await axios.get(
        "https://raw.githubusercontent.com/mahmud-aura/HINATA/main/baseApiUrl.json"
    );
 
    return base.data.mahmud;
};
 
// ================= MODULE CONFIG =================
module.exports.config = {
    name: "4k",
    version: "2.7",
    credits: "SHAAN KHAN",
    description: "Enhance or restore image quality to 4K using AI",
    usages: "!remini <url> OR reply to an image",
    commandCategory: "AI",
    cooldowns: 10,
 
    aliases: [
        "hd",
        "enhance",
        "upscale"
    ]
};
 
// ================= IMAGE URL EXTRACTOR =================
function extractImageUrl(event, args) {
 
    // ===== IMAGE FROM REPLY =====
    if (
        event.messageReply &&
        event.messageReply.attachments &&
        event.messageReply.attachments.length > 0
    ) {
 
        const img = event.messageReply.attachments.find(
            a => a.type === "photo" || a.type === "image"
        );
 
        if (img && img.url) {
            return img.url;
        }
    }
 
    // ===== IMAGE URL FROM COMMAND =====
    if (args && args.length > 0) {
 
        const imageUrl = args.find(
            arg =>
                typeof arg === "string" &&
                (
                    arg.startsWith("http://") ||
                    arg.startsWith("https://")
                )
        );
 
        if (imageUrl) {
            return imageUrl;
        }
    }
 
    return null;
}
 
// ================= RUN COMMAND =================
module.exports.run = async function ({ api, event, args }) {
 
    // ===== GET IMAGE =====
    const imageUrl = extractImageUrl(event, args);
 
    if (!imageUrl) {
        return api.sendMessage(
            "❌ Please reply to an image or provide an image URL.",
            event.threadID,
            event.messageID
        );
    }
 
    // ===== LOADING REACTION =====
    api.setMessageReaction(
        "😘",
        event.messageID,
        () => {},
        true
    );
 
    try {
 
        // ===== GET BASE API =====
        const baseUrl = await baseApiUrl();
 
        if (!baseUrl) {
            throw new Error("Base API URL not found.");
        }
 
        // ===== API REQUEST =====
        const apiUrl =
            `${baseUrl}/api/enhance?imgUrl=${encodeURIComponent(imageUrl)}`;
 
        const response = await axios.get(apiUrl, {
            responseType: "stream",
            timeout: 120000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
 
        // ===== SUCCESS REACTION =====
        api.setMessageReaction(
            "🪽",
            event.messageID,
            () => {},
            true
        );
 
        // ===== SEND IMAGE =====
        return api.sendMessage(
            {
                body: "✅ | 𝗬𝗘 𝗟𝗢 𝗕𝗔𝗕𝗬 𝗔𝗣𝗞𝗔 4𝗞 𝗜𝗠𝗔𝗚𝗘 ",
                attachment: response.data
            },
            event.threadID,
            event.messageID
        );
 
    } catch (err) {
 
        console.log(
            "REMINI ERROR:",
            err?.response?.data || err?.message || err
        );
 
        // ===== ERROR REACTION =====
        api.setMessageReaction(
            "❌",
            event.messageID,
            () => {},
            true
        );
 
        // ===== SAFE ERROR MESSAGE =====
        let errorMessage = "Something went wrong.";
 
        if (err?.message) {
            errorMessage = err.message;
        } else if (typeof err === "string") {
            errorMessage = err;
        } else if (err?.response?.data) {
            try {
                errorMessage =
                    typeof err.response.data === "string"
                        ? err.response.data
                        : JSON.stringify(err.response.data);
            } catch {
                errorMessage = "API request failed.";
            }
        }
 
        return api.sendMessage(
            `❌ Error: ${errorMessage}`,
            event.threadID,
            event.messageID
        );
    }
};