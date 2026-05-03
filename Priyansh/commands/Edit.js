module.exports.config = {
    name: "edit",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Gemini 3.1 Flash (Nano Banana) se image edit karein",
    commandCategory: "Media",
    usages: "[prompt] - Image ko reply karke prompt dein",
    prefix: false,
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const { threadID, messageID, messageReply, type } = event;

    // 1. Reply and Prompt Check
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Please reply to an image with your edit prompt!", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ Prompt missing!", threadID, messageID);

    const processingMsg = await api.sendMessage("🎨 AI is processing (Nano Banana 2)...", threadID);

    try {
        // Initialize Gemini with your Key
        const genAI = new GoogleGenerativeAI("AIzaSyBIkaNEcZLektmSx5a1ewKjpdnUE-PjK7w");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

        // Image download and conversion to Base64
        const imageUrl = messageReply.attachments[0].url;
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgData = {
            inlineData: {
                data: Buffer.from(response.data).toString("base64"),
                mimeType: "image/png"
            }
        };

        // Generate Content
        const result = await model.generateContent([prompt, imgData]);
        const resultResponse = await result.response;
        
        // Handling Image/Text Output
        const imagePart = resultResponse.candidates[0].content.parts.find(p => p.inlineData);
        
        if (!imagePart) {
            throw new Error("Model ne image generate nahi ki, shayad prompt policy ke khilaf hai.");
        }

        const cachePath = path.join(__dirname, "cache", `edit_${Date.now()}.png`);
        if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

        fs.writeFileSync(cachePath, Buffer.from(imagePart.inlineData.data, 'base64'));

        api.unsendMessage(processingMsg.messageID);

        return api.sendMessage({
            body: `✅ Edit Complete!\n✨ Credits: Shaan Khan`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error(error);
        if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
        return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};
