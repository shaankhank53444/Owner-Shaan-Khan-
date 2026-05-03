const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports.config = {
    name: "edit",
    version: "2.2.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Gemini Nano Banana 2 Image Editor",
    commandCategory: "Media",
    usages: "[prompt] - Reply to image",
    prefix: false,
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, messageReply, type } = event;

    // 1. Validation
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Image ko reply karke prompt likhein!", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ Prompt likhna bhool gaye aap!", threadID, messageID);

    const processingMsg = await api.sendMessage("🎨 Nano Banana process kar raha hai, thoda sabar karein...", threadID);

    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI("AIzaSyBIkaNEcZLektmSx5a1ewKjpdnUE-PjK7w");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Stable version

        const imageUrl = messageReply.attachments[0].url;
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        
        const imagePart = {
            inlineData: {
                data: Buffer.from(imgResponse.data).toString("base64"),
                mimeType: "image/jpeg"
            }
        };

        // API Call
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Agar model sirf text return kare (kuch models image generation/editing block karte hain)
        if (!text && !response.candidates[0].content.parts.some(p => p.inlineData)) {
            throw new Error("Model ne image return nahi ki.");
        }

        // Final Message
        api.unsendMessage(processingMsg.messageID);
        return api.sendMessage(`✅ Processed!\n\n${text}\n\n✨ Credits: Shaan Khan`, threadID, messageID);

    } catch (error) {
        console.error(error);
        if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
        return api.sendMessage(`❌ Error: ${error.message}\n\nCheck karein ki API Key sahi hai ya limit toh khatam nahi hui.`, threadID, messageID);
    }
};
