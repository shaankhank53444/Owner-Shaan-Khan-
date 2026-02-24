const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "edit",
    version: "1.2", // Updated version
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Edit or generate an image using Gemini-Edit",
    commandCategory: "AI",
    usages: "[text] (reply to image optional)",
    cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, type } = event;
    const prompt = args.join(" ");

    if (!prompt) {
        return api.sendMessage("Please provide the text to edit or generate.", threadID, messageID);
    }

    const apiurl = "https://gemini-edit-omega.vercel.app/edit";
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    try {
        // Image URL handle karne ke liye
        let imgurl = "";
        if (type === "message_reply" && messageReply.attachments && messageReply.attachments[0]?.type === "photo") {
            imgurl = messageReply.attachments[0].url;
        }

        // Axios request with better error handling
        const res = await axios.get(apiurl, { 
            params: { 
                prompt: prompt,
                imgurl: imgurl 
            } 
        });

        // Check if response has data
        if (!res.data || !res.data.images || res.data.images.length === 0) {
            throw new Error("Invalid API Response");
        }

        const base64Image = res.data.images[0].split(",").pop(); // Safer way to get base64
        const imageBuffer = Buffer.from(base64Image, "base64");

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const cachePath = path.join(cacheDir, `edit_${Date.now()}.png`);
        fs.writeFileSync(cachePath, imageBuffer);

        api.setMessageReaction("✅", messageID, () => {}, true);

        return api.sendMessage({
            body: "Here is your edited image:",
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error("❌ API ERROR:", error.response?.data || error.message);
        api.setMessageReaction("❌", messageID, () => {}, true);
        
        // Detailed error message for debugging
        const errorMsg = error.response?.data?.error || error.message;
        return api.sendMessage(`❌ Error: ${errorMsg}`, threadID, messageID);
    }
};
