const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "edit",
    version: "1.1",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Edit or generate an image using Gemini-Edit",
    commandCategory: "AI",
    usages: "[text] (reply to image optional)",
    cooldowns: 30,
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
        let params = { prompt };

        // Check if user is replying to an image
        if (type === "message_reply" && messageReply.attachments[0]?.type === "photo") {
            params.imgurl = messageReply.attachments[0].url;
        }

        const res = await axios.get(apiurl, { params });

        if (!res.data || !res.data.images || !res.data.images[0]) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ Failed to get image from API.", threadID, messageID);
        }

        // Base64 to Buffer
        const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Image, "base64");

        // Cache handling
        const cachePath = path.join(__dirname, "cache", `${Date.now()}.png`);
        if (!fs.existsSync(path.join(__dirname, "cache"))) {
            fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
        }

        fs.writeFileSync(cachePath, imageBuffer);

        api.setMessageReaction("✅", messageID, () => {}, true);

        return api.sendMessage({
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error("❌ API ERROR:", error.response?.data || error.message);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("An error occurred while processing the image.", threadID, messageID);
    }
};
